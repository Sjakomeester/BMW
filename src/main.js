import { supabase } from "./supabase.js";
import { SEED_KM, SEED_HISTORY } from "./seed.js";
import "./style.css";


(function(){
"use strict";

/* ---------- Basisgegevens uit het onderhoudsschema ---------- */
var BASE = {km:133890, date:"2026-10-27"};
var DEFAULT_RATE = 25000/365;           // km per dag volgens opgave
var WARRANTY_END = "2026-11-27";
var SRC_E = "schatting", SRC_S = "jouw overzicht", SRC_O = "offerte";

var ITEMS = [
 {id:"keuring", name:"Einde-garantiekeuring", cat:"Garantie", dueDate:"2026-11-02", soonDays:14, diy:false, labour:0,
  parts:[{n:"Algehele staat keuring III (offerte 1653)", q:1, p:348.99, s:SRC_O}],
  note:"Staat gepland op 2 november. Laat de keuring plaatsvinden voordat de onderzijde wordt schoongemaakt of er olie wordt afgetapt. Stuur het rapport daarna schriftelijk naar Broekhuis."},
 {id:"zf", name:"ZF-bakservice (specialist)", cat:"Aandrijflijn", dueDate:"2026-11-02", intervalKm:60000, soonDays:14, diy:false, labour:0,
  parts:[{n:"Versnellingsbakservice incl. doorspoelen, nieuw filter en BMW-olie (offerte 1653)", q:1, p:844.99, s:SRC_O}],
  note:"Gepland op 2 november bij de specialist. Daarna volgende beurt na ±60.000 km (zwaar belaste bak, getuned)."},
 {id:"apk", name:"APK-keuring", cat:"Wettelijk", dueDate:"2027-02-25", askNextDate:true, soonDays:42, diy:false, labour:0,
  parts:[{n:"APK-keuring", q:1, p:60, s:SRC_E}],
  note:"Vervalt 25 februari 2027, op de originele downpipe. Vul bij 'gedaan' de nieuwe vervaldatum in."},
 {id:"oil", name:"Motorolie + filter", cat:"Motor", intervalKm:10000, last:{km:125750,date:"2026-07-01"}, soonKm:2000, diy:true, labour:85,
  parts:[{n:"BMW motorolie (liter)", q:7, p:14.5, s:SRC_E},{n:"Oliefilter 11428092620", q:1, p:25, s:SRC_E},{n:"Aftapplug met O-ring", q:1, p:6, s:SRC_E}],
  note:"Bij elke beurt: oliepeil noteren, multiriem visueel controleren, koelvloeistofniveau en expansievat, foutcodes uitlezen."},
 {id:"eventuri", name:"Eventuri-filters reinigen", cat:"Motor", intervalKm:5000, unknownDue:"now", soonKm:1000, diy:true, labour:0,
  parts:[{n:"Reinigingsset voor inlaatfilters", q:1, p:30, s:SRC_E}],
  note:"Elke 5.000 km. In je overzicht staat nog geen reiniging sinds de montage op 117.000 km. Volg het reinigingsvoorschrift van Eventuri inclusief droogtijd."},
 {id:"cabin", name:"Interieurfilter", cat:"Interieur", intervalMonths:12, last:{km:111000,date:"2025-12-01"}, soonDays:45, diy:true, labour:30,
  parts:[{n:"Interieurfilter (koolstof)", q:1, p:35, s:SRC_E}], note:"Elk jaar. Laatst vervangen in december 2025, dus weer in december 2026."},
 {id:"belt", name:"Multiriem vervangen", cat:"Motor", fixedKm:150000, soonKm:4000, diy:true, labour:70,
  parts:[{n:"Multiriem 6PK1183", q:1, p:45, s:SRC_E}],
  note:"Geen officieel interval gevonden; 150.000 km is een eigen voorstel. Laat de staat bij de beurt van 135.750 km beoordelen en vervang eerder bij scheurtjes, rafels of gepiep."},
 {id:"plugs", name:"Bougies", cat:"Motor", intervalKm:32000, last:{km:124000,date:"2026-07-01"}, soonKm:3000, diy:true, labour:120,
  parts:[{n:"NGK 93560 (SILKGR9A7ES)", q:6, p:20, s:SRC_E}],
  note:"Getuned interval. Elektrodenafstand 0,028 inch. De NGK 93560 is één warmtegraad kouder dan standaard."},
 {id:"tyres", name:"Banden (set van 4, ★)", cat:"Chassis", fixedKm:152000, soonKm:8000, tread:true, diy:false, labour:220,
  parts:[{n:"Sportbanden ★ per set van 4 (voor en achter verschillende maat)", q:1, p:1700, s:SRC_E}],
  note:"Altijd alle vier tegelijk, met ★-markering, zelfde model per as. Vervang bij 3 mm of 6 jaar na productie. Vul bij de kilometerstand het profiel in, dan rekent de app daarmee."},
 {id:"diffs", name:"Diff- en tussenbakolie", cat:"Aandrijflijn", intervalKm:32000, last:{km:132000,date:"2026-10-01"}, soonKm:3000, diy:true, labour:150,
  parts:[{n:"Olie achterdifferentieel 83222447362", q:2, p:53, s:SRC_S},{n:"Olie voordifferentieel 83222413511", q:1, p:53, s:SRC_S},{n:"Olie tussenbak 83220397244 (nieuw: 83222409710)", q:1, p:50, s:SRC_S},{n:"Vulplug 33117525064", q:4, p:6.29, s:SRC_S}],
  note:"Vulhoeveelheden: tussenbak 0,7 l, achterdiff 1 l, voordiff 0,45 l. Laatst gedaan op 132.000 km."},
 {id:"brake", name:"Remvloeistof", cat:"Remmen", intervalMonths:24, soonDays:60, diy:false, labour:90,
  parts:[{n:"Remvloeistof DOT 4 (liter)", q:2, p:12, s:SRC_E}],
  note:"Elke 2 jaar. De datum van de laatste vervanging staat niet in je overzicht. Zoek hem op in het serviceboek en leg hem hier vast."},
 {id:"coolant", name:"Koelvloeistof", cat:"Motor", intervalKm:64000, intervalMonths:48, soonKm:5000, soonDays:90, diy:false, labour:170,
  parts:[{n:"BMW koelvloeistof, inclusief aanvulling", q:1, p:60, s:SRC_E}],
  note:"Elke 4 jaar of ±64.000 km. De laatste vervanging is niet bekend. Zoek hem op in het serviceboek."},
 {id:"downpipe", name:"Downpipe met sportkat + Stage 2", cat:"Tuning", dueDate:"2027-03-01", soonDays:45, diy:false, labour:0,
  parts:[{n:"Downpipe met sportkat (E-keur of TÜV)", q:1, p:null, s:SRC_E},{n:"Stage 2-software", q:1, p:null, s:SRC_E},{n:"Montage", q:1, p:null, s:SRC_E}],
  note:"Pas na 27 november 2026 (garantie) en na de APK van 25 februari 2027. Vul de prijzen in zodra je een offerte hebt. Meld het bij je verzekeraar."}
];

/* ---------- Staat ---------- */
var state = {entries:[], history:[], done:{}, prices:{}, tab:"overzicht", openItem:null, doneForm:null,
  horizon:5000, mode:"diy", confirmDel:null, user:null, loaded:false};

function lsGet(k){ try{ return localStorage.getItem(k); }catch(e){ return null; } }
function lsSet(k,v){ try{ localStorage.setItem(k,v); }catch(e){} }
var pref = lsGet("x3m-pref"); if(pref){ try{ var pp=JSON.parse(pref); if(pp.horizon) state.horizon=pp.horizon; if(pp.mode) state.mode=pp.mode; }catch(e){} }
function savePref(){ lsSet("x3m-pref", JSON.stringify({horizon:state.horizon, mode:state.mode})); }

/* ---------- Hulpfuncties ---------- */
function esc(s){ return String(s==null?"":s).replace(/[&<>"']/g,function(c){return {"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c];}); }
function pad(n){ return n<10?"0"+n:""+n; }
function iso(d){ return d.getFullYear()+"-"+pad(d.getMonth()+1)+"-"+pad(d.getDate()); }
function parse(s){ var p=s.split("-"); return new Date(+p[0],+p[1]-1,+p[2]); }
function todayIso(){ return iso(new Date()); }
function daysBetween(a,b){ return Math.round((parse(b)-parse(a))/86400000); }
function addDays(s,n){ var d=parse(s); d.setDate(d.getDate()+Math.round(n)); return iso(d); }
function addMonths(s,n){ var d=parse(s); d.setMonth(d.getMonth()+n); return iso(d); }
var nf = new Intl.NumberFormat("nl-NL");
var cf = new Intl.NumberFormat("nl-NL",{style:"currency",currency:"EUR",maximumFractionDigits:0});
var cf2 = new Intl.NumberFormat("nl-NL",{style:"currency",currency:"EUR",minimumFractionDigits:2,maximumFractionDigits:2});
function fmtKm(n){ return nf.format(Math.round(n)); }
function fmtDate(s){ return parse(s).toLocaleDateString("nl-NL",{day:"numeric",month:"short",year:"numeric"}); }
function fmtShort(s){ return parse(s).toLocaleDateString("nl-NL",{day:"numeric",month:"short"}); }
function toast(msg){ var t=document.getElementById("toast"); t.textContent=msg; t.hidden=false; clearTimeout(toast._t); toast._t=setTimeout(function(){t.hidden=true;},3500); }

function sortedEntries(){ return state.entries.slice().sort(function(a,b){ return a.date===b.date ? b.km-a.km : (a.date<b.date?1:-1); }); }
function current(){
  if(!state.entries.length) return {km:BASE.km, date:BASE.date, virtual:true};
  var best=state.entries.reduce(function(m,e){ return e.km>m.km?e:m; });
  return {km:best.km, date:best.date, virtual:false};
}
function rate(){
  var es = state.entries.slice().sort(function(a,b){return a.date<b.date?-1:1;});
  if(es.length<2) return DEFAULT_RATE;
  var last=es[es.length-1], cutoff=addDays(last.date,-90), first=es[0];
  for(var i=0;i<es.length;i++){ if(es[i].date>=cutoff){ first=es[i]; break; } }
  var days=daysBetween(first.date,last.date);
  if(days<14) return DEFAULT_RATE;
  var r=(last.km-first.km)/days;
  return Math.min(200,Math.max(20,r));
}

/* ---------- Berekening per onderhoudspunt ---------- */
function evaluate(it){
  var cur=current(), today=todayIso(), r=rate();
  var dn=state.done[it.id];
  var hasInt=!!(it.intervalKm||it.intervalMonths);
  var lastKm = dn?dn.km:(it.last?it.last.km:null);
  var lastDate = dn?dn.date:(it.last?it.last.date:null);
  var dueDate=it.dueDate, fixedKm=it.fixedKm;
  if(it.askNextDate && dn && dn.nextDate){ dueDate=dn.nextDate; }
  var oneOffDone = dn && !hasInt && !(it.askNextDate && dn.nextDate);
  var out={item:it,status:"ok",nextKm:null,nextDate:null,kmLeft:null,daysLeft:null,eff:null,estDate:null,frac:null,reason:"",lastKm:lastKm,lastDate:lastDate};
  if(oneOffDone){ out.status="done"; return out; }
  var haveLast = (lastKm!=null && it.intervalKm) || (lastDate && it.intervalMonths);
  if(haveLast){
    if(lastKm!=null && it.intervalKm) out.nextKm=lastKm+it.intervalKm;
    if(lastDate && it.intervalMonths) out.nextDate=addMonths(lastDate,it.intervalMonths);
  } else if(dueDate||fixedKm){
    out.nextDate=dueDate||null; out.nextKm=fixedKm||null;
  } else if(it.unknownDue==="now"){
    out.nextKm=cur.km; out.reason="Laatste reiniging onbekend";
  } else {
    out.status="unknown"; out.reason="Laatste keer onbekend"; return out;
  }
  if(out.nextKm!=null) out.kmLeft=out.nextKm-cur.km;
  if(out.nextDate) out.daysLeft=daysBetween(today,out.nextDate);
  var cands=[]; if(out.daysLeft!=null) cands.push(out.daysLeft); if(out.kmLeft!=null) cands.push(out.kmLeft/r);
  out.eff=cands.length?Math.min.apply(null,cands):null;
  if(out.eff!=null) out.estDate=addDays(today,Math.max(out.eff,0));
  var soonKm=it.soonKm||2500, soonDays=it.soonDays||45;
  var over=(out.kmLeft!=null&&out.kmLeft<=0)||(out.daysLeft!=null&&out.daysLeft<0);
  var soon=(out.kmLeft!=null&&out.kmLeft<=soonKm)||(out.daysLeft!=null&&out.daysLeft<=soonDays);
  out.status = over?"overdue":(soon?"soon":"ok");
  if(it.tread){
    var since = dn?dn.date:"0000-00-00", t=null;
    sortedEntries().forEach(function(e){ if(t==null && e.tread!=null && e.date>=since) t=e; });
    if(t){
      out.reason="Profiel "+String(t.tread).replace(".",",")+" mm ("+fmtShort(t.date)+")";
      if(t.tread<=3){ out.status="overdue"; } else if(t.tread<=4 && out.status==="ok"){ out.status="soon"; }
    }
  }
  if(it.intervalKm && out.kmLeft!=null) out.frac=Math.min(1,Math.max(0,1-out.kmLeft/it.intervalKm));
  return out;
}
var RANK={overdue:0,soon:1,ok:2,unknown:3,done:4};
function allEvals(){
  return ITEMS.map(evaluate).sort(function(a,b){
    if(RANK[a.status]!==RANK[b.status]) return RANK[a.status]-RANK[b.status];
    var ea=a.eff==null?1e9:a.eff, eb=b.eff==null?1e9:b.eff; return ea-eb;
  });
}
var LABEL={overdue:"Nu doen",soon:"Binnenkort",ok:"In orde",unknown:"Onbekend",done:"Afgerond"};

/* ---------- Kosten ---------- */
function partPrice(it,i){ var k=it.id+"."+i; var v=state.prices[k]; if(v!=null) return v; return it.parts[i].p; }
function labourPrice(it){ var v=state.prices[it.id+".labour"]; return v!=null?v:it.labour; }
function itemCost(it){
  var sum=0, missing=false;
  it.parts.forEach(function(p,i){ var pr=partPrice(it,i); if(pr==null){ missing=true; } else sum+=pr*p.q; });
  var lab = (state.mode==="garage"||it.diy===false) ? (labourPrice(it)||0) : 0;
  return {parts:sum, labour:lab, total:sum+lab, missing:missing};
}
function inHorizon(ev,km){
  if(ev.status==="done"||ev.status==="unknown") return false;
  if(ev.status==="overdue"||ev.status==="soon") return true;
  var r=rate();
  if(ev.kmLeft!=null && ev.kmLeft<=km) return true;
  if(ev.daysLeft!=null && ev.daysLeft<=km/r) return true;
  return false;
}

/* ---------- Opslag (Supabase) ---------- */
var chain=Promise.resolve();
function enqueue(fn){ chain=chain.then(fn).catch(function(e){ toast("Opslaan mislukt. Probeer het opnieuw."); console.error(e); }); return chain; }
function chk(r){ if(r && r.error) throw r.error; return r; }
function itemById(id){ return ITEMS.filter(function(x){return x.id===id;})[0]; }
function uid(){ return state.user.id; }

function loadAll(){
  return Promise.all([
    supabase.from("km_entries").select("id,km,date,tread,note"),
    supabase.from("history").select("id,name,date,km,approx,item"),
    supabase.from("done").select("item,km,date,next_date"),
    supabase.from("prices").select("key,value")
  ]).then(function(r){
    r.forEach(chk);
    state.entries=r[0].data.map(function(x){ var o={id:x.id,km:x.km,date:x.date}; if(x.tread!=null) o.tread=Number(x.tread); if(x.note) o.note=x.note; return o; });
    state.history=r[1].data.map(function(x){ return {id:x.id,name:x.name,date:x.date,km:x.km,approx:!!x.approx,item:x.item}; });
    var m={}; r[2].data.forEach(function(x){ var o={km:x.km,date:x.date}; if(x.next_date) o.nextDate=x.next_date; m[x.item]=o; }); state.done=m;
    var pr={}; r[3].data.forEach(function(x){ pr[x.key]=Number(x.value); }); state.prices=pr;
    state.loaded=true; render();
  });
}
function reload(){ return loadAll().catch(function(e){ console.error(e); toast("Gegevens laden mislukt."); }); }

function addEntry(e){
  return enqueue(function(){
    return supabase.from("km_entries").insert({user_id:uid(),km:e.km,date:e.date,tread:e.tread==null?null:e.tread,note:e.note||null}).then(chk).then(loadAll);
  });
}
function delEntry(id){
  return enqueue(function(){ return supabase.from("km_entries").delete().eq("id",id).then(chk).then(loadAll); });
}
function setDone(id,d){
  var it=itemById(id);
  return enqueue(function(){
    return supabase.from("done").upsert({user_id:uid(),item:id,km:d.km,date:d.date,next_date:d.nextDate||null},{onConflict:"user_id,item"}).then(chk)
      .then(function(){ return supabase.from("history").upsert({user_id:uid(),item:id,name:it.name,date:d.date,km:d.km,approx:false},{onConflict:"user_id,item"}); })
      .then(chk).then(loadAll);
  });
}
function undoDone(id){
  return enqueue(function(){
    return supabase.from("done").delete().eq("item",id).then(chk)
      .then(function(){ return supabase.from("history").delete().eq("item",id); }).then(chk).then(loadAll);
  });
}
function addHistory(e){
  return enqueue(function(){
    return supabase.from("history").insert({user_id:uid(),name:e.name,date:e.date,km:e.km==null?null:e.km,approx:false}).then(chk).then(loadAll);
  });
}
function updateHistory(id,e){
  return enqueue(function(){
    return supabase.from("history").update({name:e.name,date:e.date,km:e.km==null?null:e.km,approx:false}).eq("id",id).then(chk).then(loadAll);
  });
}
function delHistory(id){
  return enqueue(function(){ return supabase.from("history").delete().eq("id",id).then(chk).then(loadAll); });
}
function savePrice(key,val){
  return enqueue(function(){
    if(val==null) return supabase.from("prices").delete().eq("key",key).then(chk).then(loadAll);
    return supabase.from("prices").upsert({user_id:uid(),key:key,value:val},{onConflict:"user_id,key"}).then(chk).then(loadAll);
  });
}
function seedData(){
  return enqueue(function(){
    return supabase.from("km_entries").insert(SEED_KM.map(function(r){ return Object.assign({user_id:uid()},r); })).then(chk)
      .then(function(){ return supabase.from("history").insert(SEED_HISTORY.map(function(r){ return Object.assign({user_id:uid()},r); })); })
      .then(chk).then(loadAll);
  });
}

/* ---------- Weergave ---------- */
var TABS=[["overzicht","Overzicht"],["onderhoud","Onderhoud"],["inkopen","Inkopen en kosten"],["logboek","Logboek"]];
function renderTabs(){
  var h=""; TABS.forEach(function(t){ h+='<button role="tab" data-act="tab" data-v="'+t[0]+'" aria-selected="'+(state.tab===t[0])+'">'+t[1]+'</button>'; });
  document.getElementById("tabs").innerHTML=h;
}
function rowHtml(ev, compact){
  var it=ev.item, when="";
  if(ev.status==="unknown"){ when=ev.reason; }
  else if(ev.status==="done"){ when="Gedaan op "+(ev.lastKm!=null?fmtKm(ev.lastKm)+" km · ":"")+(ev.lastDate?fmtDate(ev.lastDate):""); }
  else {
    var parts=[];
    if(ev.kmLeft!=null) parts.push(ev.kmLeft<0 ? "Sinds "+fmtKm(-ev.kmLeft)+" km over tijd" : (ev.kmLeft===0 ? "Nu aan de beurt" : "Over "+fmtKm(ev.kmLeft)+" km ("+fmtKm(ev.nextKm)+")"));
    if(ev.estDate) parts.push(ev.daysLeft!=null && ev.daysLeft<0 ? fmtShort(ev.nextDate)+" verstreken" : "±"+fmtDate(ev.estDate));
    when=parts.join(" · ");
    if(ev.reason) when+=(when?" · ":"")+ev.reason;
  }
  var bar = (ev.frac!=null && !compact) ? '<div class="bar"><i class="'+(ev.status==="ok"?"":ev.status)+'" style="width:'+Math.round(ev.frac*100)+'%"></i></div>' : "";
  var cost=itemCost(it);
  return '<div class="'+(compact?"row":"head")+'"><span><span class="pill '+ev.status+'">'+LABEL[ev.status]+'</span></span>'+
    '<span><div class="nm">'+esc(it.name)+'</div><div class="meta">'+esc(it.cat)+" · "+esc(when)+'</div>'+bar+'</span>'+
    '<span class="right">'+(cost.total>0?cf.format(cost.total)+(cost.missing?"+":""):(cost.missing?"prijs ontbreekt":""))+'</span></div>';
}

function viewOverzicht(){
  var cur=current(), today=todayIso(), evs=allEvals(), r=rate();
  var ageDays=daysBetween(cur.date,today);
  var latest=sortedEntries()[0];
  var h='<section class="panel"><div class="cluster"><div>'+
    '<div class="odo-label">Kilometerstand</div><div class="odo mono">'+fmtKm(cur.km)+'<span>KM</span></div>'+
    '<div class="odo-sub">'+(cur.virtual?"Startstand uit het schema, "+fmtDate(cur.date):"Bijgewerkt "+fmtDate(cur.date)+(ageDays>0?" ("+ageDays+" dagen geleden)":" (vandaag)"))+' · gemiddeld ±'+Math.round(r)+' km per dag</div>'+
    (ageDays>=7?'<div class="alert">Je laatste stand is '+ageDays+' dagen oud. Vul de actuele stand in, dan kloppen de voorspellingen.</div>':'')+
    '</div><form class="form" id="km-form" autocomplete="off">'+
    '<label class="f">Kilometerstand<input id="f-km" type="number" inputmode="numeric" min="0" step="1" placeholder="'+(cur.km+300)+'" required></label>'+
    '<label class="f">Datum<input id="f-date" type="date" value="'+today+'" max="'+today+'" required></label>'+
    '<label class="f">Profiel banden (mm, optioneel)<input id="f-tread" type="number" inputmode="decimal" min="0" max="12" step="0.1" placeholder="6,0"></label>'+
    '<label class="f">Notitie (optioneel)<input id="f-note" type="text" placeholder="Oliepeil, lek, foto gemaakt"></label>'+
    '<div class="full"><button class="btn" type="submit">Stand opslaan</button> <span class="err" id="km-err"></span></div></form></div></section>';

  var gd=daysBetween(today,WARRANTY_END);
  var dates=[["Garantie BOVAG",fmtDate(WARRANTY_END),gd>=0?"nog "+gd+" dagen":"verlopen"],
    ["Keuring + bakservice","2 nov 2026",(function(){var d=daysBetween(today,"2026-11-02");return d>=0?"over "+d+" dagen":"gepland";})()],
    ["APK vervalt","25 feb 2027",(function(){var d=daysBetween(today,"2027-02-25");return d>=0?"over "+d+" dagen (±"+fmtKm(cur.km+d*r)+" km)":"verlopen";})()]];
  h+='<div class="dates">'; dates.forEach(function(d){ h+='<div><div class="k">'+d[0]+'</div><div class="v">'+d[1]+'</div><div class="s">'+d[2]+'</div></div>'; }); h+='</div>';

  var attn=evs.filter(function(e){return e.status==="overdue"||e.status==="soon"||e.status==="unknown";}).slice(0,6);
  h+='<section class="panel"><h2>Aandacht nodig</h2><div class="rows" style="margin-top:6px">';
  h+= attn.length? attn.map(function(e){return rowHtml(e,true);}).join("") : '<div class="empty">Niets dat binnenkort aan de beurt is.</div>';
  h+='</div></section>';

  var near=evs.filter(function(e){return inHorizon(e,state.horizon);});
  var nearTotal=near.reduce(function(s,e){return s+itemCost(e.item).total;},0);
  var year=evs.filter(function(e){return e.status!=="done"&&e.status!=="unknown"&&((e.eff!=null&&e.eff<=365)||e.status==="overdue");});
  var yearTotal=year.reduce(function(s,e){return s+itemCost(e.item).total;},0);
  h+='<section class="panel"><h2>Kosten</h2><div class="dates" style="margin-top:10px">'+
    '<div><div class="k">Binnen '+fmtKm(state.horizon)+' km</div><div class="v">'+cf.format(nearTotal)+'</div><div class="s">'+near.length+' onderhoudspunten</div></div>'+
    '<div><div class="k">Komende 12 maanden</div><div class="v">'+cf.format(yearTotal)+'</div><div class="s">'+year.length+' punten, ±'+fmtKm(r*365)+' km</div></div></div>'+
    '<p class="note" style="margin:10px 0 0">'+(state.mode==="diy"?"Onderdelen, plus werkplaatskosten waar je het niet zelf doet.":"Onderdelen plus werkplaatskosten voor alles.")+' Bedragen zijn richtprijzen incl. btw. Pas ze aan op het tabblad Inkopen en kosten.</p></section>';
  return h;
}

function doneFormHtml(ev){
  var it=ev.item, cur=current();
  var f=state.doneForm;
  var h='<div class="inline-form" id="done-form">'+
   '<label class="f">Kilometerstand bij uitvoering<input id="d-km" type="number" min="0" step="1" value="'+(f&&f.km!=null?f.km:cur.km)+'"></label>'+
   '<label class="f">Datum<input id="d-date" type="date" value="'+todayIso()+'" max="'+todayIso()+'"></label>'+
   (it.askNextDate?'<label class="f">Nieuwe vervaldatum<input id="d-next" type="date"></label>':'')+
   '<div><button class="btn small" data-act="done-save" data-id="'+it.id+'">Vastleggen</button> <button class="btn small ghost" data-act="done-cancel">Annuleren</button></div></div>';
  return h;
}
function viewOnderhoud(){
  var evs=allEvals();
  var h='<section class="panel"><h2>Alle onderhoudspunten</h2><div style="margin-top:6px">';
  evs.forEach(function(ev){
    var it=ev.item, open=state.openItem===it.id;
    h+='<div class="item"><button class="hb" data-act="toggle" data-id="'+it.id+'" aria-expanded="'+open+'">'+rowHtml(ev,false)+'</button>';
    if(open){
      h+='<div class="body"><p class="note" style="margin:0">'+esc(it.note)+'</p>';
      if(ev.lastDate||ev.lastKm!=null) h+='<div class="meta" style="color:var(--muted);font-size:13px">Laatst: '+(ev.lastKm!=null?fmtKm(ev.lastKm)+" km":"")+(ev.lastDate?" · "+fmtDate(ev.lastDate):"")+'</div>';
      h+='<div class="scroll"><table class="partlist"><thead><tr><th>Onderdeel</th><th class="n">Aantal</th><th class="n">Prijs p.st.</th></tr></thead><tbody>';
      it.parts.forEach(function(p,i){ var pr=partPrice(it,i); h+='<tr><td>'+esc(p.n)+' <span class="tag">'+esc(p.s)+'</span></td><td class="n">'+p.q+'</td><td class="n">'+(pr==null?"onbekend":cf2.format(pr))+'</td></tr>'; });
      h+='</tbody></table></div>';
      if(state.doneForm && state.doneForm.id===it.id) h+=doneFormHtml(ev);
      else {
        h+='<div><button class="btn small" data-act="done-open" data-id="'+it.id+'">'+(ev.status==="unknown"?"Laatste keer vastleggen":"Vastleggen als gedaan")+'</button>';
        if(state.done[it.id]) h+=' <button class="btn small ghost" data-act="undo" data-id="'+it.id+'">Terugdraaien</button>';
        h+='</div>';
      }
      h+='</div>';
    }
    h+='</div>';
  });
  h+='</div></section>';
  return h;
}

function viewInkopen(){
  var evs=allEvals(), list=evs.filter(function(e){return inHorizon(e,state.horizon);});
  var h='<section class="panel"><h2>Wat moet ik kopen</h2><div class="controls" style="margin-top:10px">'+
   '<label class="f">Vooruitkijken<select id="s-hor">'+[2000,5000,10000,20000].map(function(v){return '<option value="'+v+'"'+(state.horizon===v?" selected":"")+'>Komende '+fmtKm(v)+' km</option>';}).join("")+'</select></label>'+
   '<div><div style="font-size:12px;color:var(--muted);margin-bottom:3px">Werkzaamheden</div><div class="seg"><button data-act="mode" data-v="diy" aria-pressed="'+(state.mode==="diy")+'">Zelf waar het kan</button><button data-act="mode" data-v="garage" aria-pressed="'+(state.mode==="garage")+'">Alles bij de werkplaats</button></div></div></div></section>';
  var total=0, missing=false;
  h+='<section class="panel">';
  if(!list.length) h+='<div class="empty">Binnen '+fmtKm(state.horizon)+' km staat niets gepland.</div>';
  list.forEach(function(ev){
    var it=ev.item, c=itemCost(it); total+=c.total; if(c.missing) missing=true;
    h+='<div class="item"><div class="body" style="padding-top:12px"><div style="display:flex;justify-content:space-between;gap:12px;flex-wrap:wrap;align-items:baseline"><h3>'+esc(it.name)+'</h3><span class="meta" style="color:var(--muted);font-size:13px"><span class="pill '+ev.status+'">'+LABEL[ev.status]+'</span> '+(ev.kmLeft!=null?(ev.kmLeft<=0?"nu":"over "+fmtKm(ev.kmLeft)+" km"):"")+(ev.estDate?" · ±"+fmtShort(ev.estDate):"")+'</span></div>'+
     '<div class="scroll"><table class="partlist"><thead><tr><th>Onderdeel</th><th class="n">Aantal</th><th class="n">Prijs p.st. (€)</th><th class="n">Totaal</th></tr></thead><tbody>';
    it.parts.forEach(function(p,i){ var pr=partPrice(it,i);
      h+='<tr><td>'+esc(p.n)+' <span class="tag">'+esc(p.s)+'</span></td><td class="n">'+p.q+'</td><td class="n"><input type="number" min="0" step="0.01" id="p-'+it.id+'-'+i+'" data-price="'+it.id+'.'+i+'" value="'+(pr==null?"":pr)+'" placeholder="invullen" aria-label="Prijs '+esc(p.n)+'"></td><td class="n">'+(pr==null?"–":cf2.format(pr*p.q))+'</td></tr>'; });
    var showLab = state.mode==="garage"||it.diy===false;
    if(showLab||labourPrice(it)>0){
      h+='<tr><td>Werkplaats arbeid '+(showLab?'':'<span class="tag">niet meegeteld</span> ')+'<span class="tag">schatting</span></td><td class="n">1</td><td class="n"><input type="number" min="0" step="1" id="p-'+it.id+'-lab" data-price="'+it.id+'.labour" value="'+(labourPrice(it)||0)+'" aria-label="Arbeid '+esc(it.name)+'"></td><td class="n">'+(showLab?cf2.format(labourPrice(it)||0):"–")+'</td></tr>';
    }
    h+='</tbody></table></div><div style="text-align:right;font-weight:600" class="mono">Subtotaal '+cf2.format(c.total)+(c.missing?" + nog onbekend":"")+'</div></div></div>';
  });
  h+='<div class="total"><span>Totaal</span><span>'+cf2.format(total)+'</span></div>';
  h+='<p class="note" style="margin:8px 0 0">Alle bedragen zijn richtprijzen incl. btw. Prijzen met het label schatting heb ik niet bij een winkel nagekeken. Wijzig ze hierboven, dan worden ze bewaard.'+(missing?' Bij sommige punten ontbreekt nog een prijs.':'')+'</p></section>';
  var unk=evs.filter(function(e){return e.status==="unknown";});
  if(unk.length) h+='<section class="panel"><h3>Nog uit te zoeken</h3><p class="note" style="margin:6px 0 0">Van deze punten ken ik de laatste uitvoering niet, dus ze staan niet in de lijst: '+unk.map(function(e){return esc(e.item.name.toLowerCase());}).join(", ")+'. Leg de laatste keer vast op het tabblad Onderhoud.</p></section>';
  return h;
}

function viewLogboek(){
  var es=sortedEntries(), r=rate();
  var h='<section class="panel"><h2>Logboek kilometerstand</h2><p class="note" style="margin:6px 0 10px">Gemiddeld ±'+Math.round(r)+' km per dag ('+fmtKm(r*365)+' km per jaar), berekend over de laatste drie maanden.</p>';
  if(!es.length){ h+='<div class="empty">Nog geen standen opgeslagen. Voer op het tabblad Overzicht je eerste stand in.</div>'; }
  else {
    h+='<div class="scroll"><table class="partlist"><thead><tr><th>Datum</th><th class="n">Km</th><th class="n">Sinds vorige</th><th class="n">Profiel</th><th>Notitie</th><th></th></tr></thead><tbody>';
    var asc=es.slice().sort(function(a,b){return a.date===b.date?a.km-b.km:(a.date<b.date?-1:1);});
    var prevMap={}; asc.forEach(function(e,i){ prevMap[e.id]= i>0? e.km-asc[i-1].km : null; });
    es.forEach(function(e){
      var d=prevMap[e.id];
      h+='<tr><td>'+fmtDate(e.date)+'</td><td class="n">'+fmtKm(e.km)+'</td><td class="n">'+(d==null?"–":"+"+fmtKm(d))+'</td><td class="n">'+(e.tread!=null?String(e.tread).replace(".",",")+" mm":"–")+'</td><td>'+esc(e.note||"")+'</td><td class="n">'+
        (state.confirmDel===e.id?'<button class="btn small danger" data-act="del-yes" data-id="'+e.id+'">Zeker?</button> <button class="btn small ghost" data-act="del-no">Nee</button>':'<button class="btn small ghost" data-act="del" data-id="'+e.id+'">Verwijder</button>')+'</td></tr>';
    });
    h+='</tbody></table></div>';
  }
  h+='</section>';
  var hs=state.history.slice().sort(function(a,b){ return a.date===b.date ? (b.km||0)-(a.km||0) : (a.date<b.date?1:-1); });
  h+='<section class="panel"><h2>Onderhoudshistorie</h2><p class="note" style="margin:6px 0 10px">Wat er aan de auto is gedaan. Wat je op het tabblad Onderhoud als gedaan vastlegt, komt hier ook in.</p>'+
    '<form class="inline-form" id="hist-form" autocomplete="off">'+
    '<label class="f">Werkzaamheid<input id="h-name" type="text" required></label>'+
    '<label class="f">Kilometerstand<input id="h-km" type="number" min="0" step="1"></label>'+
    '<label class="f">Datum<input id="h-date" type="date" value="'+todayIso()+'" max="'+todayIso()+'" required></label>'+
    '<div><button class="btn small" type="submit">Toevoegen</button></div></form>';
  if(!hs.length) h+='<div class="empty">Nog geen onderhoud vastgelegd.</div>';
  else {
    h+='<div class="scroll" style="margin-top:8px"><table class="partlist"><thead><tr><th>Datum</th><th class="n">Km</th><th>Werkzaamheid</th><th></th></tr></thead><tbody>';
    hs.forEach(function(e){
      if(state.editHist===e.id){
        h+='<tr class="editrow"><td><input id="he-date" type="date" value="'+esc(e.date)+'" max="'+todayIso()+'" required aria-label="Datum"></td>'+
          '<td class="n"><input id="he-km" type="number" min="0" step="1" value="'+(e.km!=null?e.km:"")+'" aria-label="Kilometerstand" style="width:90px"></td>'+
          '<td><input id="he-name" type="text" value="'+esc(e.name)+'" aria-label="Werkzaamheid" style="width:100%;min-width:140px"></td>'+
          '<td class="n"><button class="btn small" data-act="hedit-save" data-id="'+e.id+'">Opslaan</button> <button class="btn small ghost" data-act="hedit-cancel">Annuleren</button></td></tr>';
        return;
      }
      var d = e.approx ? parse(e.date).toLocaleDateString("nl-NL",{month:"short",year:"numeric"}) : fmtDate(e.date);
      h+='<tr><td>'+d+'</td><td class="n">'+(e.km!=null&&e.km!==""?fmtKm(e.km):"–")+'</td><td>'+esc(e.name)+'</td><td class="n"><button class="btn small ghost" data-act="hedit" data-id="'+e.id+'">Wijzig</button> '+
        (state.confirmDel==="h:"+e.id?'<button class="btn small danger" data-act="hdel-yes" data-id="'+e.id+'">Zeker?</button> <button class="btn small ghost" data-act="del-no">Nee</button>':'<button class="btn small ghost" data-act="hdel" data-id="'+e.id+'">Verwijder</button>')+'</td></tr>';
    });
    h+='</tbody></table></div>';
  }
  h+='</section>';
  return h;
}

/* ---------- Render met behoud van invoer ---------- */
function render(){
  var keep={}, active=document.activeElement && document.activeElement.id;
  var selS=null, selE=null;
  document.querySelectorAll("#view input[id], #view select[id]").forEach(function(el){ keep[el.id]=el.value; });
  if(active){ var ae=document.getElementById(active); try{ selS=ae.selectionStart; selE=ae.selectionEnd; }catch(e){} }
  renderTabs();
  var v=document.getElementById("view");
  var seedPanel = (state.loaded && !state.entries.length && !state.history.length) ?
    '<section class="panel"><h2>Startgegevens importeren</h2><p class="note" style="margin:6px 0 12px">Je account is nog leeg. Importeer je kilometerstand van 27 oktober 2026 (133.890 km) en de 18 onderhoudsregels uit je Excel. Dit kan één keer.</p><button class="btn" data-act="seed">Startgegevens importeren</button></section>' : "";
  v.innerHTML = seedPanel + (state.tab==="overzicht"?viewOverzicht():state.tab==="onderhoud"?viewOnderhoud():state.tab==="inkopen"?viewInkopen():viewLogboek());
  Object.keys(keep).forEach(function(id){ var el=document.getElementById(id); if(el && el.tagName!=="SELECT" && !/^p-/.test(id) && keep[id]!=="") el.value=keep[id]; });
  if(active){ var ne=document.getElementById(active); if(ne){ ne.focus(); try{ if(selS!=null) ne.setSelectionRange(selS,selE); }catch(e){} } }
  document.getElementById("who").textContent = state.user ? state.user.email : "";
}

/* ---------- Events ---------- */
document.addEventListener("click",function(ev){
  var b=ev.target.closest("[data-act]"); if(!b) return;
  var act=b.getAttribute("data-act"), id=b.getAttribute("data-id"), v=b.getAttribute("data-v");
  if(act==="tab"){ state.tab=v; try{ history.replaceState(null,"","#"+v); }catch(e){} render(); }
  else if(act==="toggle"){ state.openItem = state.openItem===id?null:id; state.doneForm=null; render(); }
  else if(act==="seed"){ b.disabled=true; seedData().then(function(){ toast("Startgegevens geïmporteerd."); }); }
  else if(act==="mode"){ state.mode=v; savePref(); render(); }
  else if(act==="done-open"){ state.doneForm={id:id}; render(); }
  else if(act==="done-cancel"){ state.doneForm=null; render(); }
  else if(act==="done-save"){
    var km=parseInt(document.getElementById("d-km").value,10), date=document.getElementById("d-date").value;
    var nx=document.getElementById("d-next");
    if(isNaN(km)||!date){ toast("Vul kilometerstand en datum in."); return; }
    var rec={km:km,date:date}; if(nx&&nx.value) rec.nextDate=nx.value;
    state.doneForm=null; setDone(id,rec).then(function(){ toast("Vastgelegd."); });
  }
  else if(act==="undo"){ undoDone(id).then(function(){ toast("Teruggedraaid."); }); }
  else if(act==="del"){ state.confirmDel=id; render(); }
  else if(act==="hedit"){ document.querySelectorAll('[id^="he-"]').forEach(function(el){ el.remove(); }); state.confirmDel=null; state.editHist=id; render(); }
  else if(act==="hedit-cancel"){ state.editHist=null; render(); }
  else if(act==="hedit-save"){
    var en=document.getElementById("he-name").value.trim(), ed=document.getElementById("he-date").value, ek=document.getElementById("he-km").value;
    if(!en||!ed){ toast("Vul werkzaamheid en datum in."); return; }
    var ue={name:en,date:ed}; if(ek!=="") ue.km=parseInt(ek,10);
    state.editHist=null; updateHistory(id,ue).then(function(){ toast("Gewijzigd."); });
  }
  else if(act==="hdel"){ state.confirmDel="h:"+id; render(); }
  else if(act==="hdel-yes"){ state.confirmDel=null; delHistory(id).then(function(){ toast("Verwijderd."); }); }
  else if(act==="del-no"){ state.confirmDel=null; render(); }
  else if(act==="del-yes"){ state.confirmDel=null; delEntry(id).then(function(){ toast("Verwijderd."); }); }
});
document.addEventListener("submit",function(ev){
  if(ev.target.id==="hist-form"){
    ev.preventDefault();
    var nm=document.getElementById("h-name").value.trim(), hk=document.getElementById("h-km").value, hd=document.getElementById("h-date").value;
    if(!nm||!hd){ toast("Vul werkzaamheid en datum in."); return; }
    var he={name:nm,date:hd}; if(hk!=="") he.km=parseInt(hk,10);
    document.getElementById("h-name").value=""; document.getElementById("h-km").value="";
    addHistory(he).then(function(){ toast("Toegevoegd."); });
    return;
  }
  if(ev.target.id!=="km-form") return;
  ev.preventDefault();
  var km=parseInt(document.getElementById("f-km").value,10), date=document.getElementById("f-date").value;
  var tr=document.getElementById("f-tread").value, note=document.getElementById("f-note").value.trim();
  var err=document.getElementById("km-err"), cur=current();
  if(isNaN(km)||km<0||!date){ err.textContent="Vul een geldige kilometerstand en datum in."; return; }
  if(km<cur.km && date>=cur.date){ err.textContent="Dit is lager dan je laatste stand ("+fmtKm(cur.km)+" km)."; return; }
  if(km-cur.km>6000){ err.textContent="Dat is meer dan 6.000 km boven je laatste stand. Controleer het getal."; return; }
  var e={km:km,date:date}; if(tr!=="") e.tread=parseFloat(tr); if(note) e.note=note;
  err.textContent="";
  addEntry(e).then(function(){ document.getElementById("f-km")&&(document.getElementById("f-km").value=""); toast("Stand opgeslagen."); });
});
document.addEventListener("change",function(ev){
  var t=ev.target;
  if(t.id==="s-hor"){ state.horizon=parseInt(t.value,10); savePref(); render(); }
  else if(t.getAttribute("data-price")){
    var k=t.getAttribute("data-price");
    if(t.value===""){ savePrice(k,null); }
    else { var n=parseFloat(t.value); if(isNaN(n)||n<0) return; savePrice(k,n); }
  }
});

/* ---------- Opstarten en inloggen ---------- */
var h0=(location.hash||"").replace("#",""); if(TABS.some(function(t){return t[0]===h0;})) state.tab=h0;
window.addEventListener("hashchange",function(){ var h=(location.hash||"").replace("#",""); if(TABS.some(function(t){return t[0]===h;})){ state.tab=h; render(); } });

var appEl=document.getElementById("app"), loginEl=document.getElementById("login"), cfgEl=document.getElementById("config-error");

function setSession(s){
  var same = s && state.user && state.user.id===s.user.id;
  state.user = s ? s.user : null;
  appEl.hidden=!s; loginEl.hidden=!!s;
  if(s){ if(!same){ render(); reload(); } }
  else { state.entries=[]; state.history=[]; state.done={}; state.prices={}; state.loaded=false; }
}

document.getElementById("login-form").addEventListener("submit",function(ev){
  ev.preventDefault();
  var err=document.getElementById("login-err"); err.textContent="";
  var btn=document.getElementById("login-btn"); btn.disabled=true;
  supabase.auth.signInWithPassword({email:document.getElementById("l-email").value.trim(),password:document.getElementById("l-pass").value})
    .then(function(r){ if(r.error){ err.textContent="Inloggen mislukt. Controleer je e-mailadres en wachtwoord."; } })
    .catch(function(){ err.textContent="Geen verbinding. Probeer het opnieuw."; })
    .then(function(){ btn.disabled=false; });
});
document.getElementById("logout").addEventListener("click",function(){ supabase.auth.signOut(); });
document.addEventListener("visibilitychange",function(){ if(!document.hidden && state.user) reload(); });

if(!supabase){ cfgEl.hidden=false; }
else {
  render();
  supabase.auth.onAuthStateChange(function(_e,s){ setSession(s); });
}
})();
