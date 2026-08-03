/* ============================================================
   PRAYERS VIEW — today's table, day navigation, live countdown,
   and pull-to-refresh.
   ============================================================ */
import { DOW, MON, dayTimes, nextBegins, nextJamaat } from "./data.js";
import { getSettings } from "./settings.js";

let view = new Date();              // the date currently shown
let cdTimer = null;
let onRefresh = null;               // optional live-content refresh

const $ = id => document.getElementById(id);

function render(){
  const m=view.getMonth()+1, d=view.getDate();
  const t=dayTimes(view);
  const today=new Date();

  $("dow").textContent = DOW[view.getDay()];
  $("date").textContent = d+" "+MON[m-1];

  const isToday = view.toDateString()===today.toDateString();
  $("todayBtn").hidden = isToday;
  $("pageTitle").textContent = isToday ? "Today's Prayers" : "Prayer Times";

  const mode = getSettings().display.times;      // "both" | "begins" | "jamaat"
  const single = mode!=="both";
  const rows=$("rows");
  const head=$("tableHead");

  head.className = "tablehead" + (single?" single":"");
  head.innerHTML = single
    ? `<div>Prayer</div><div>${mode==="jamaat"?"Jamaat":"Start"}</div>`
    : `<div>Prayer</div><div>Start</div><div>Jamaat</div>`;

  if(!t){ rows.innerHTML='<div class="row"><div class="name">No data for this date</div><div></div></div>'; return; }

  let list=[
    ["Fajr","Dawn", t.sehri, t.fajrJ, "fajr"],
    ["Sunrise","Fajr ends", t.sunrise, "", "sunrise"],
    ["Zuhr","Midday", t.zuhrS, t.zuhrJ, "zuhr"],
    ["Asr","Afternoon", t.asrS, t.asrJ, "asr"],
    ["Maghrib","Sunset", t.maghrib, t.maghrib, "maghrib"],
    ["Isha","Night", t.ishaS, t.ishaJ, "isha"]
  ];
  // Sunrise has no Jamaat, so drop it when only Jamaat times are shown
  if(mode==="jamaat") list=list.filter(p=>p[4]!=="sunrise");

  let nextIdx=-1;
  if(isToday){
    const nx = mode==="jamaat" ? nextJamaat() : nextBegins();
    if(nx) nextIdx=list.findIndex(p=>p[0]===nx.name);
  }

  const dash = '<span class="dash">—</span>';
  rows.innerHTML = list.map((p,i)=>{
    const cls = "row" + (single?" single":"") + (p[4]==="sunrise"?" sunrise":"") + (i===nextIdx?" next":"");
    const begins = p[2] || dash;
    const jam = p[4]==="sunrise" ? dash : (p[3] || dash);
    const cells = mode==="both" ? `<div class="begins">${begins}</div><div class="jamaat">${jam}</div>`
                : mode==="jamaat" ? `<div class="jamaat">${jam}</div>`
                : `<div class="begins">${begins}</div>`;
    return `<div class="${cls}">
      <div class="name">${p[0]}<span class="sub">${p[1]}</span></div>
      ${cells}
    </div>`;
  }).join("");
}

/* Time remaining as text. Under a minute we say so rather than "0m". */
function fmtLeft(target, now){
  const ms = target - now;
  if(ms <= 0) return { text:"now", small:true };
  const totalMin = Math.floor(ms/60000);
  if(totalMin < 1) return { text:"less than a minute", small:true };
  const h=Math.floor(totalMin/60), m=totalMin%60;
  return { text: h>0 ? (h+"h "+m+"m") : (m+"m"), small:false };
}

function cdBox(label, nx, now){
  if(!nx) return "";
  const { text, small } = fmtLeft(nx.target, now);
  return `<div class="cd-box">
    <span class="cd-label">${nx.name} ${label}</span>
    <span class="cd-time${small?" text":""}">${text}</span>
  </div>`;
}

function tickCountdown(){
  const cd=$("countdown");
  const n=new Date();
  const isToday = view.getFullYear()===n.getFullYear() &&
                  view.getMonth()===n.getMonth() &&
                  view.getDate()===n.getDate();
  if(!isToday){ cd.hidden=true; return; }

  const mode = getSettings().display.countdown;   // "both" | "begins" | "jamaat"
  const nb = (mode==="both"||mode==="begins") ? nextBegins() : null;
  const nj = (mode==="both"||mode==="jamaat") ? nextJamaat() : null;
  if(!nb && !nj){ cd.hidden=true; return; }

  cd.hidden=false;
  cd.className = "countdown" + (mode==="both" ? " split" : "");
  cd.innerHTML = cdBox("starts in", nb, n) + cdBox("Jamaat in", nj, n);
}

/* ---- Pull-to-refresh (only while the Prayers view is visible) ---- */
function initPullToRefresh(){
  const ptr=$("ptr"), text=$("ptrText");
  const THRESHOLD=70;
  let startY=0, pulling=false, dist=0;

  const visible = ()=> !$("todayView").hidden;

  document.addEventListener("touchstart", e=>{
    if(!visible() || window.scrollY>0 || ptr.classList.contains("refreshing")) return;
    startY=e.touches[0].clientY; pulling=true; dist=0;
  }, { passive:true });

  document.addEventListener("touchmove", e=>{
    if(!pulling) return;
    dist=e.touches[0].clientY-startY;
    if(dist>0 && window.scrollY<=0){
      ptr.classList.add("pulling");
      text.textContent = dist>THRESHOLD ? "Release to refresh" : "Pull to refresh";
    } else if(dist<=0){
      ptr.classList.remove("pulling");
    }
  }, { passive:true });

  document.addEventListener("touchend", async ()=>{
    if(!pulling) return;
    pulling=false;
    if(dist>THRESHOLD){
      ptr.classList.add("refreshing"); text.textContent="Refreshing…";
      try{ if(onRefresh) await onRefresh(); }catch{ /* ignore */ }
      render(); tickCountdown();
      await new Promise(r=>setTimeout(r,500));
    }
    ptr.classList.remove("pulling","refreshing");
    text.textContent="Pull to refresh";
  });
}

export function initPrayers(refreshCb){
  onRefresh = refreshCb || null;
  $("prev").onclick   =()=>{ view.setDate(view.getDate()-1); render(); tickCountdown(); };
  $("next").onclick   =()=>{ view.setDate(view.getDate()+1); render(); tickCountdown(); };
  $("todayBtn").onclick=()=>{ view=new Date(); render(); tickCountdown(); };
  render();
  tickCountdown();
  if(cdTimer) clearInterval(cdTimer);
  cdTimer=setInterval(tickCountdown,1000);
  initPullToRefresh();
}

export function refreshPrayers(){ render(); tickCountdown(); }
