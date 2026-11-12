/* Theories v0.2.0 (12 Nov 2026) - Cedwyn editors.
   The page is server-rendered from data/theories.json by tools/theories_sync.py; this script adds the filters, the changelog
   modal, the page name in the header, and WebMCP tools for agents. Theories has no N-of-59 slot yet (v0.2.0). */
(function(){
var d=document,NAME="Theories";
function num(){var n=d.querySelector(".ghf-v2-chain .ghf-v2-name");if(!n)return false;
 var b=n.querySelector("b");if(b&&b.textContent!==NAME)b.textContent=NAME;
 return true;}
function strip(){var up=d.querySelector(".ghf-v2-up");if(!up)return false;
 var want=up.classList.contains("cw-gdn-on")?"":"none";
 if((up.style.getPropertyValue("display")||"")!==want){
  if(want){up.style.setProperty("display","none","important");up.setAttribute("aria-hidden","true");}
  else{up.style.removeProperty("display");up.removeAttribute("aria-hidden");}
  try{window.dispatchEvent(new Event("resize"));}catch(e){}}
 return true;}
function both(){var a=num(),b=strip();return a&&b;}
var n=0,iv=setInterval(function(){if(both()||++n>150){clearInterval(iv);var h=d.querySelector(".ghf-v2");
 if(h)new MutationObserver(both).observe(h,{childList:true,subtree:true,attributes:true,attributeFilter:["class","style"]});}},100);
d.addEventListener("ghf-lang-change",function(){setTimeout(both,0);});
})();
(function(){
var d=document,nav=d.querySelector(".th-filter"),cards=[].slice.call(d.querySelectorAll(".th-card"));
if(nav&&cards.length){nav.hidden=false;
 nav.addEventListener("click",function(ev){var b=ev.target.closest("button[data-f]");if(!b)return;var f=b.getAttribute("data-f");
  [].forEach.call(nav.querySelectorAll("button"),function(x){x.setAttribute("aria-pressed",x===b?"true":"false");});
  cards.forEach(function(c){var s=c.getAttribute("data-status");c.hidden=!(f==="all"||s===f);});});}
var dlg=d.getElementById("th-changelog"),opener=null;
d.addEventListener("click",function(ev){var o=ev.target.closest("[data-th-info]");if(o&&dlg&&dlg.showModal){ev.preventDefault();opener=o;dlg.showModal();}
 if(ev.target.closest("[data-th-close]")&&dlg)dlg.close();if(ev.target===dlg)dlg.close();});
if(dlg)dlg.addEventListener("close",function(){if(opener&&opener.focus)opener.focus();});
var db=null;function load(){if(db)return Promise.resolve(db);return fetch("data/theories.json",{cache:"no-cache"}).then(function(r){return r.json();}).then(function(j){db=j;return j;});}
var mc=(navigator&&navigator.modelContext)||d.modelContext;
if(mc&&typeof mc.registerTool==="function"){try{
 mc.registerTool({name:"theories_list",description:"List the family's working theories (each not checked), with status, the evidence IDs each rests on, what cuts against it and what would test it. Optional filter status: 'open' or 'tested'.",
  inputSchema:{type:"object",properties:{status:{type:"string",enum:["open","tested"]}}},
  execute:function(a){return load().then(function(j){var e=j.theories.filter(function(x){return !a||!a.status||x.status===a.status;});return {content:[{type:"text",text:JSON.stringify(e)}]};});}});
 mc.registerTool({name:"theories_get",description:"Return one working theory by id (TH-01, TH-02, ...).",
  inputSchema:{type:"object",properties:{id:{type:"string"}},required:["id"]},
  execute:function(a){return load().then(function(j){var e=j.theories.filter(function(x){return x.id===(a&&a.id);});return {content:[{type:"text",text:JSON.stringify(e[0]||null)}]};});}});
}catch(e){}}
})();
