/* Theories · propose a theory, v0.3.0 (14 Nov 2026) - Cedwyn editors.
   Builds a proposal in the shape of tools/theories.src.json with status "proposed". Nothing is sent anywhere:
   the record is kept in this browser (localStorage, when available) and can be copied or downloaded for review. */
(function(){
var d=(typeof document!=="undefined")?document:null,KEY="cw-theories-proposals-v1",mem=[];
var GATE=["says","claims","according to","hearsay","unverified","alleged","fraud","stolen"];
var ID=/\b(?:EV|MR|TBD|OBS)-\d{4}\b|\bTOC-[A-Z]?\d{2,3}\b|\bGHF-E\d{2,3}-\d{2}\b|\bTH-\d{2}\b/g;
function $(i){return d.getElementById(i);}
function lines(s){return String(s||"").split(/\r?\n/).map(function(x){return x.trim();}).filter(Boolean);}
function gate(text){var t=" "+String(text||"").toLowerCase().replace(/[^a-z]+/g," ")+" ";
 return GATE.filter(function(w){return t.indexOf(" "+w+" ")>-1;});}
function build(a){a=a||{};var title=String(a.title||"").trim(),summary=String(a.summary||"").trim(),
 f=lines(a["for"]),ag=lines(a.against),test=String(a.test||"").trim(),errs=[];
 if(!title)errs.push("Give the theory a one-line title.");
 if(summary.length<40)errs.push("Describe the theory in a sentence or two.");
 if(!ag.length)errs.push("Add at least one line on what cuts against it. Every theory here shows the evidence against.");
 if(!test)errs.push("Name the record that would test it.");
 var hit=gate([title,summary,f.join(" "),ag.join(" "),test].join(" "));
 if(hit.length)errs.push("Reword to drop: "+hit.join(", ")+". The page states what a record shows and leaves the conclusion to the reader.");
 var ids=(f.join(" ").match(ID)||[]).filter(function(x,i,r){return r.indexOf(x)===i;});
 var rec={schema:"theories-proposal/1",id:"PROPOSED-"+Date.now().toString(36).toUpperCase(),status:"proposed",
  status_label:"Proposed · not reviewed",added:new Date().toISOString().slice(0,10),title:title,summary:summary,
  evidence_for:f,evidence_ids:ids,against:ag,test:test};
 return {ok:!errs.length,errors:errs,record:rec,notes:ids.length?[]:["No catalogue id found in “Records it rests on”. A theory can be proposed without one; the editors will look for the records."]};}
function load(){try{var j=JSON.parse(localStorage.getItem(KEY)||"[]");if(Array.isArray(j))mem=j;}catch(e){}return mem;}
function save(){try{localStorage.setItem(KEY,JSON.stringify(mem));}catch(e){}}
function el(t,c,x){var n=d.createElement(t);if(c)n.className=c;if(x!=null)n.textContent=x;return n;}
function ul(arr){var u=el("ul");arr.forEach(function(x){u.appendChild(el("li",null,x));});if(!arr.length){u.appendChild(el("li","th-none","None given."));}return u;}
function render(){var box=$("tp-list");if(!box)return;box.textContent="";
 $("tp-empty").hidden=!!mem.length;$("tp-count").textContent=mem.length?"("+mem.length+", kept in this browser only)":"";
 mem.forEach(function(r,i){var a=el("article","th-card tp-card");
  var m=el("p","th-meta");m.appendChild(el("span","th-id",r.id));m.appendChild(el("span","th-st",r.status_label));m.appendChild(el("span",null,"written "+r.added));a.appendChild(m);
  a.appendChild(el("h3",null,r.title));a.appendChild(el("p","th-sum",r.summary));
  var p=el("div","th-pair"),f=el("div","th-for"),g=el("div","th-against");
  f.appendChild(el("p","th-lab","Records it rests on"));f.appendChild(ul(r.evidence_for));
  g.appendChild(el("p","th-lab","What cuts against it"));g.appendChild(ul(r.against));p.appendChild(f);p.appendChild(g);a.appendChild(p);
  var t=el("p","th-test");t.appendChild(el("b",null,"What would test it: "));t.appendChild(d.createTextNode(r.test));a.appendChild(t);
  var act=el("p","tp-actions"),json=JSON.stringify(r,null,1),pre=el("pre","tp-json",json);pre.hidden=true;
  var c=el("button","tp-btn","Copy for review");c.type="button";c.addEventListener("click",function(){
   var done=function(){c.textContent="Copied";setTimeout(function(){c.textContent="Copy for review";},1600);};
   if(navigator.clipboard&&navigator.clipboard.writeText){navigator.clipboard.writeText(json).then(done,function(){pre.hidden=false;});}else{pre.hidden=false;}});
  var dl=el("button","tp-btn","Download (.json)");dl.type="button";dl.addEventListener("click",function(){
   try{var u=URL.createObjectURL(new Blob([json],{type:"application/json"})),k=el("a");k.href=u;k.download=r.id.toLowerCase()+".json";d.body.appendChild(k);k.click();k.remove();setTimeout(function(){URL.revokeObjectURL(u);},500);}catch(e){pre.hidden=false;}});
  var rm=el("button","tp-btn","Remove");rm.type="button";rm.addEventListener("click",function(){mem.splice(i,1);save();render();});
  act.appendChild(c);act.appendChild(dl);act.appendChild(rm);a.appendChild(act);a.appendChild(pre);box.appendChild(a);});}
function fields(){return {title:$("tp-title").value,summary:$("tp-summary").value,"for":$("tp-for").value,against:$("tp-against").value,test:$("tp-test").value};}
function init(){var form=$("tp-form");if(!form)return;load();render();var g=$("tp-gate");
 form.addEventListener("submit",function(ev){ev.preventDefault();var r=build(fields());
  if(!r.ok){g.className="tp-gate tp-bad";g.textContent=r.errors.join(" ");return;}
  mem.unshift(r.record);save();render();form.reset();g.className="tp-gate tp-ok";
  g.textContent="Saved in this browser as "+r.record.id+". "+(r.notes[0]||"Copy or download it to pass it to the editors.");});
 $("tp-clear").addEventListener("click",function(){form.reset();g.className="tp-gate";g.textContent="";});
 var mc=(navigator&&navigator.modelContext)||d.modelContext;
 if(mc&&typeof mc.registerTool==="function"){try{mc.registerTool({name:"theories_propose",
  description:"Build a proposed working theory (not published, not sent): title, summary, for (records it rests on, one per line), against (required), test. Returns the record for review, or the reasons it needs rewording.",
  inputSchema:{type:"object",properties:{title:{type:"string"},summary:{type:"string"},"for":{type:"string"},against:{type:"string"},test:{type:"string"}},required:["title","summary","against","test"]},
  execute:function(a){var r=build(a);return Promise.resolve({content:[{type:"text",text:JSON.stringify(r.ok?r.record:{errors:r.errors})}]});}});}catch(e){}}}
if(typeof module!=="undefined"&&module.exports){module.exports={build:build,gate:gate};}
else if(d){if(d.readyState==="loading")d.addEventListener("DOMContentLoaded",init);else init();}
})();
