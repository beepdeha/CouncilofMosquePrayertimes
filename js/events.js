/* ============================================================
   EVENTS VIEW — upcoming events, soonest first.
   Past events disappear automatically. Each event:
   { title, date(YYYY-MM-DD), startTime(HH:MM), durationHours?,
     location, description, image? }
   ============================================================ */
import { loadCollection } from "./firebase.js";
import { attachPTR } from "./ptr.js";

const $ = id => document.getElementById(id);
let ptrAttached = false;

function esc(s=""){ return String(s).replace(/[&<>"]/g, c=>({ "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;" }[c])); }

function startOf(ev){
  if(!ev.date) return null;
  const t = ev.startTime && /^\d{1,2}:\d{2}$/.test(ev.startTime) ? ev.startTime : "00:00";
  const d = new Date(`${ev.date}T${t}`);
  return isNaN(d) ? null : d;
}
function endOf(ev, start){
  const h = Number(ev.durationHours);
  if(h>0) return new Date(start.getTime() + h*3600000);
  // no duration → lasts until end of its day
  const e = new Date(start); e.setHours(23,59,59,999); return e;
}
function fmtTime(d){
  return d.toLocaleTimeString(undefined,{ hour:"numeric", minute:"2-digit" });
}
function fmtWhen(start, end, hasDuration){
  const day = start.toLocaleDateString(undefined,{ weekday:"short", day:"numeric", month:"long" });
  const time = hasDuration ? `${fmtTime(start)} – ${fmtTime(end)}` : fmtTime(start);
  return `${day} · ${time}`;
}

async function loadAndRender(){
  const { data } = await loadCollection("events", { orderField:"date", desc:false });
  const items = data||[];
  const now = new Date();
  const upcoming = items
    .map(ev=>{ const s=startOf(ev); return s ? { ev, start:s, end:endOf(ev,s), hasDur:Number(ev.durationHours)>0 } : null; })
    .filter(x=> x && x.end >= now)
    .sort((a,b)=> a.start - b.start);

  const list = $("eventsList");
  if(!upcoming.length){
    list.innerHTML = `<p class="empty">No upcoming events at the moment.<br>Check back soon.</p>`;
    return;
  }
  list.innerHTML = upcoming.map(x=>{
    const e=x.ev;
    return `<div class="event">
      <h3>${esc(e.title||"Event")}</h3>
      <div class="when">${esc(fmtWhen(x.start, x.end, x.hasDur))}</div>
      ${e.location?`<div class="where">📍 ${esc(e.location)}</div>`:""}
      ${e.image?`<img src="${esc(e.image)}" alt="" loading="lazy">`:""}
      ${e.description?`<p>${esc(e.description).replace(/\n/g,"<br>")}</p>`:""}
    </div>`;
  }).join("");
}

export async function initEvents(){
  $("eventsList").innerHTML = `<p class="empty">Loading…</p>`;
  await loadAndRender();
  if(!ptrAttached){
    ptrAttached = true;
    attachPTR({ sectionId:"eventsView", ptrId:"ptrEvents", textId:"ptrEventsText", onRefresh: loadAndRender });
  }
}
