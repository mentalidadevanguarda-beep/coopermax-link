/* Motor do encurtador. NÃO precisa editar. Para criar links, use o links.js */
(function(){
"use strict";

var STORE_KEY = "mv_wa_links";
var toastTimer;

function toast(msg){
  var t = document.getElementById("toast");
  t.textContent = msg; t.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(function(){ t.classList.remove("show"); }, 1800);
}
function normSlug(s){
  return (s||"").toString().trim().toLowerCase()
    .normalize("NFD").replace(/[̀-ͯ]/g,"")
    .replace(/[^a-z0-9]+/g,"");
}
function normPhone(p){ return (p||"").replace(/\D/g,""); }
function waLink(phone, text){
  var u = "https://wa.me/" + normPhone(phone);
  if(text && text.trim()) u += "?text=" + encodeURIComponent(text.trim());
  return u;
}

// Descobre sozinho a pasta onde o site está (raiz do domínio OU /nome-do-repo)
var AUTO_BASE = (function(){
  try{
    var s = document.currentScript && document.currentScript.src;
    if(!s){
      var ss = document.getElementsByTagName("script");
      for(var i=0;i<ss.length;i++){ if(/\bapp\.js(\?|$)/.test(ss[i].src)){ s = ss[i].src; break; } }
    }
    if(!s) return "";
    var dir = s.replace(/[^\/]*$/,"");
    return new URL(dir, location.href).pathname.replace(/\/+$/,"");
  }catch(e){ return ""; }
})();
function basePath(){
  var manual = (window.BASE||"").trim();
  return (manual ? manual : AUTO_BASE).replace(/\/+$/,"");
}
function baseUrl(){ return location.origin + basePath(); }

function loadLocal(){
  try{ return JSON.parse(localStorage.getItem(STORE_KEY)||"{}"); }catch(e){ return {}; }
}
function saveLocal(obj){
  try{ localStorage.setItem(STORE_KEY, JSON.stringify(obj)); }catch(e){}
}
function allLinks(){
  var out = {};
  var base = window.LINKS || {};
  Object.keys(base).forEach(function(k){ out[normSlug(k)] = base[k]; });
  var loc = loadLocal();
  Object.keys(loc).forEach(function(k){ out[normSlug(k)] = loc[k]; });
  return out;
}

function currentSlug(){
  var path = decodeURIComponent(location.pathname);
  var b = basePath();
  if(b && path.indexOf(b) === 0) path = path.slice(b.length);
  path = path.replace(/^\/+/,"").replace(/\/+$/,"");
  if(path && !/index\.html?$/i.test(path) && !/404\.html?$/i.test(path)) return normSlug(path);
  if(location.hash) return normSlug(location.hash.replace(/^#/,""));
  return "";
}

function boot(){
  var slug = currentSlug();
  if(slug){
    var link = allLinks()[slug];
    if(link){ return renderRedirect(link); }
    return renderNotFound(slug);
  }
  renderManager();
}

function renderRedirect(link){
  var url = waLink(link.phone, link.text);
  document.getElementById("app").innerHTML =
    '<div class="redir">' +
      '<div class="spinner"></div>' +
      '<h1 style="margin:0 0 6px">Abrindo o WhatsApp...</h1>' +
      '<p class="sub">Se não abrir sozinho, toque no botão.</p>' +
      '<a class="btn" style="max-width:280px;text-decoration:none" href="'+url+'">Abrir conversa</a>' +
    '</div>';
  setTimeout(function(){ location.replace(url); }, 500);
}

function renderNotFound(slug){
  document.getElementById("app").innerHTML =
    '<div class="redir">' +
      '<h1 style="margin:0 0 6px">Link não encontrado</h1>' +
      '<p class="sub">O link <b>/'+slug+'</b> ainda não existe.</p>' +
      '<a class="btn secondary" style="max-width:280px;text-decoration:none" href="'+baseUrl()+'/">Criar um link</a>' +
    '</div>';
}

function renderManager(){
  document.getElementById("app").innerHTML =
    '<div class="wrap">' +
      '<header>' +
        '<div class="brand">Coopermax - Cooperativa de Trabalho Multiprofissionais</div>' +
        '<h1>Encurtador <span>WhatsApp</span></h1>' +
        '<p class="sub">Crie links personalizados que abrem o WhatsApp com a mensagem pronta.</p>' +
      '</header>' +
      '<div class="card">' +
        '<label>Número com DDI + DDD (só números)</label>' +
        '<input id="f_phone" inputmode="numeric" placeholder="5579996503547" value="5579996503547">' +
        '<div class="hint">55 (Brasil) + DDD + número. Ex.: 55 79 99146-3157</div>' +
        '<label>Mensagem que já vem digitada</label>' +
        '<textarea id="f_text" placeholder="Olá! Quero saber como me tornar um cooperado da Coopermax.">Olá! Quero saber como me tornar um cooperado da Coopermax.</textarea>' +
        '<label>Final do link (personalizado)</label>' +
        '<div class="slug-row">' +
          '<span class="prefix" id="prefixLbl"></span>' +
          '<input id="f_slug" placeholder="SejaUmCooperadoCoopermax" value="SejaUmCooperadoCoopermax">' +
        '</div>' +
        '<div class="hint">Só letras e números. Ex.: SejaUmCooperadoCoopermax</div>' +
        '<button class="btn" id="genBtn">Gerar link + QR Code</button>' +
      '</div>' +
      '<div class="card result" id="resultCard">' +
        '<label style="margin-top:0">Seu link personalizado</label>' +
        '<div class="linkbox"><span class="val" id="outLink"></span><button class="copybtn" id="copyLink">Copiar</button></div>' +
        '<div class="qr" id="qr"></div>' +
        '<div class="row2">' +
          '<button class="btn secondary" id="dlQr" style="margin-top:0">Baixar QR</button>' +
          '<button class="btn secondary" id="saveBtn" style="margin-top:0">Salvar na lista</button>' +
        '</div>' +
        '<div class="hint" style="margin-top:10px">Alvo real: <span id="outWa"></span></div>' +
        '<div class="hint" style="margin-top:6px">Atenção: "Salvar na lista" guarda só neste aparelho. Para o link funcionar para todo mundo, use "Exportar código" e cole no links.js.</div>' +
      '</div>' +
      '<div class="card saved" id="savedCard"></div>' +
      '<footer>Trabalho digno - Respeito - Gratidão</footer>' +
    '</div>';

  document.getElementById("prefixLbl").textContent = baseUrl().replace(/^https?:\/\//,"") + "/";
  document.getElementById("genBtn").onclick = generate;
  document.getElementById("copyLink").onclick = function(){ copy(document.getElementById("outLink").textContent); };
  document.getElementById("saveBtn").onclick = saveCurrent;
  document.getElementById("dlQr").onclick = downloadQr;
  renderSaved();
}

var lastGen = null;

function generate(){
  var phone = normPhone(document.getElementById("f_phone").value);
  var text = document.getElementById("f_text").value;
  var rawSlug = document.getElementById("f_slug").value.trim();
  var slug = normSlug(rawSlug);
  if(phone.length < 12){ toast("Confira o número (DDI+DDD)"); return; }
  if(!slug){ toast("Escolha um final pro link"); return; }

  var shortUrl = baseUrl() + "/" + rawSlug;
  var wa = waLink(phone, text);
  lastGen = { slug:slug, label:rawSlug, phone:phone, text:text };

  document.getElementById("outLink").textContent = shortUrl;
  document.getElementById("outWa").textContent = wa;

  var box = document.getElementById("qr"); box.innerHTML = "";
  new QRCode(box, { text: shortUrl, width:190, height:190, colorDark:"#0a0a0f", colorLight:"#ffffff", correctLevel: QRCode.CorrectLevel.M });

  document.getElementById("resultCard").classList.add("show");
  document.getElementById("resultCard").scrollIntoView({behavior:"smooth", block:"start"});
}

function saveCurrent(){
  if(!lastGen){ return; }
  var loc = loadLocal();
  loc[lastGen.slug] = { label:lastGen.label, phone:lastGen.phone, text:lastGen.text };
  saveLocal(loc);
  toast("Salvo na lista");
  renderSaved();
}

function renderSaved(){
  var loc = loadLocal();
  var keys = Object.keys(loc);
  var el = document.getElementById("savedCard");
  if(!el) return;
  var html = '<h2>Meus links salvos</h2>';
  if(!keys.length){
    html += '<div class="empty">Nenhum link salvo ainda neste aparelho.</div>';
    el.innerHTML = html; return;
  }
  keys.forEach(function(k){
    var it = loc[k];
    var short = baseUrl() + "/" + (it.label||k);
    html += '<div class="item">' +
      '<div class="info"><div class="name">'+(it.label||k)+'</div><div class="u">'+short+'</div></div>' +
      '<div class="acts">' +
        '<button class="iconbtn" data-copy="'+short+'">Copiar</button>' +
        '<button class="iconbtn del" data-del="'+k+'">Excluir</button>' +
      '</div>' +
    '</div>';
  });
  html += '<button class="btn ghost" id="exportBtn">Exportar código para o links.js</button>';
  el.innerHTML = html;

  Array.prototype.forEach.call(el.querySelectorAll("[data-copy]"), function(b){
    b.onclick = function(){ copy(b.getAttribute("data-copy")); };
  });
  Array.prototype.forEach.call(el.querySelectorAll("[data-del]"), function(b){
    b.onclick = function(){ var l = loadLocal(); delete l[b.getAttribute("data-del")]; saveLocal(l); renderSaved(); toast("Excluído"); };
  });
  document.getElementById("exportBtn").onclick = exportCode;
}

function exportCode(){
  var loc = loadLocal();
  var lines = Object.keys(loc).map(function(k){
    var it = loc[k];
    return '  "'+k+'": {\n' +
      '    label: '+JSON.stringify(it.label||k)+',\n' +
      '    phone: '+JSON.stringify(it.phone)+',\n' +
      '    text: '+JSON.stringify(it.text||"")+'\n' +
      '  }';
  });
  var code = "window.LINKS = {\n" + lines.join(",\n") + "\n};";
  copy(code);
  toast("Código copiado. Cole no links.js");
}

function downloadQr(){
  var canvas = document.querySelector("#qr canvas");
  var img = document.querySelector("#qr img");
  var url = canvas ? canvas.toDataURL("image/png") : (img ? img.src : null);
  if(!url){ toast("Gere um link primeiro"); return; }
  var a = document.createElement("a");
  a.href = url; a.download = "qr-" + (lastGen ? lastGen.slug : "whatsapp") + ".png";
  document.body.appendChild(a); a.click(); a.remove();
}

function copy(text){
  if(navigator.clipboard && navigator.clipboard.writeText){
    navigator.clipboard.writeText(text).then(function(){ toast("Copiado"); }, function(){ fallbackCopy(text); });
  } else { fallbackCopy(text); }
}
function fallbackCopy(text){
  var t = document.createElement("textarea"); t.value = text;
  document.body.appendChild(t); t.select();
  try{ document.execCommand("copy"); toast("Copiado"); }catch(e){ toast("Copie manualmente"); }
  t.remove();
}

boot();
})();
