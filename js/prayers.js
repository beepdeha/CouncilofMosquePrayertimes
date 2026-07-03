/* ============================================================
   PRAYERS VIEW — today's table, day navigation, live countdown,
   and pull-to-refresh.
   ============================================================ */
import { DOW, MON, dayTimes, nextBegins } from "./data.js";

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

  const rows=$("rows");
  if(!t){ rows.innerHTML='<div class="row"><div class="name">No data for this date</div><div></div><div></div></div>'; return; }

  const list=[
    ["Fajr","Dawn", t.sehri, t.fajrJ, "fajr"],
    ["Sunrise","Fajr ends", t.sunrise, "", "sunrise"],
    ["Zuhr","Midday", t.zuhrS, t.zuhrJ, "zuhr"],
    ["Asr","Afternoon", t.asrS, t.asrJ, "asr"],
    ["Maghrib","Sunset", t.maghrib, t.maghrib, "maghrib"],
    ["Isha","Night", t.ishaS, t.ishaJ, "isha"]
  ];

  let nextIdx=-1;
  if(isToday){
    const nx=nextBegins();
    if(nx) nextIdx=list.findIndex(p=>p[0]===nx.name);
  }

  rows.innerHTML = list.map((p,i)=>{
    const cls = "row" + (p[4]==="sunrise"?" sunrise":"") + (i===nextIdx?" next":"");
    const begins = p[2] || '<span class="dash">—</span>';
    const jam = p[4]==="sunrise" ? '<span class="dash">—</span>' : (p[3] || '<span class="dash">—</span>');
    return `<div class="${cls}">
      <div class="name">${p[0]}<span class="sub">${p[1]}</span></div>
      <div class="begins">${begins}</div>
      <div class="jamaat">${jam}</div>
    </div>`;
  }).join("");
}

function tickCountdown(){
  const cd=$("countdown");
  const n=new Date();
  const isToday = view.getFullYear()===n.getFullYear() &&
                  view.getMonth()===n.getMonth() &&
                  view.getDate()===n.getDate();
  const nx = isToday ? nextBegins() : null;
  if(!nx){ cd.hidden=true; return; }
  cd.hidden=false;
  const totalMin=Math.max(0,Math.floor((nx.target-n)/60000));
  const h=Math.floor(totalMin/60), m=totalMin%60;
  $("cdLabel").textContent = nx.name+" begins in";
  $("cdTime").textContent = h>0 ? (h+"h "+m+"m") : (m+"m");
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
