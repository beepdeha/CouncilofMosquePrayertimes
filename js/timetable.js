/* ============================================================
   TIMETABLE VIEW — full month as a data table.
   Toggle between Start times and Jamāʿah times for a cleaner view.
   ============================================================ */
import { MON, RAW } from "./data.js";

const $ = id => document.getElementById(id);
let activeMonth = new Date().getMonth()+1;
let mode = "begins";   // "begins" | "jamaat"

// Jamāʿah carried forward within a month for display.
function monthRows(m){
  const rows = RAW[m] || [];
  let fJ="", zJ="", aJ="", iJ="";
  for(let mm=1; mm<m; mm++){
    for(const r of (RAW[mm]||[])){ if(r[6])fJ=r[6]; if(r[7])zJ=r[7]; if(r[8])aJ=r[8]; if(r[10])iJ=r[10]; }
  }
  return rows.map(r=>{
    const [d,sehri,sunrise,zuhrS,asrS,ishaS,f,z,a,maghrib,i]=r;
    if(f)fJ=f; if(z)zJ=z; if(a)aJ=a; if(i)iJ=i;
    return { d,
      begins:{ fajr:sehri, zuhr:zuhrS, asr:asrS, maghrib, isha:ishaS },
      jamaat:{ fajr:fJ,    zuhr:zJ,    asr:aJ,   maghrib, isha:iJ }
    };
  });
}

function buildGrid(){
  const g=$("monthGrid");
  g.innerHTML = MON.map((name,i)=>
    `<button class="monthbtn" data-m="${i+1}">${i+1}. ${name.slice(0,3)}</button>`).join("");
  g.querySelectorAll(".monthbtn").forEach(b=>{
    b.onclick=()=>showMonth(parseInt(b.dataset.m,10));
  });
}

function showMonth(m){
  activeMonth=m;
  document.querySelectorAll(".monthbtn").forEach(b=>
    b.classList.toggle("active", parseInt(b.dataset.m,10)===m));

  const today=new Date();
  const rows=monthRows(m);
  const cell = v => v || "—";
  const body = rows.map(r=>{
    const t = r[mode];
    const date=new Date(today.getFullYear(), m-1, r.d);
    const isToday = date.toDateString()===today.toDateString();
    const isFri = date.getDay()===5;
    const cls=[isToday?"is-today":"", isFri?"is-fri":""].filter(Boolean).join(" ");
    return `<tr class="${cls}">
      <td class="d">${r.d}</td>
      <td>${cell(t.fajr)}</td>
      <td>${cell(t.zuhr)}</td>
      <td>${cell(t.asr)}</td>
      <td>${cell(t.maghrib)}</td>
      <td>${cell(t.isha)}</td>
    </tr>`;
  }).join("");

  const box=$("monthTable");
  box.hidden=false;
  box.innerHTML = `<div class="mt-cap">${m}. ${MON[m-1]}</div>
    <div class="card" style="margin-top:0;overflow-x:auto">
      <table class="mt-table">
        <thead><tr>
          <th>Date</th><th>Fajr</th><th>Zuhr</th><th>Asr</th><th>Mgrb</th><th>Isha</th>
        </tr></thead>
        <tbody>${body}</tbody>
      </table>
    </div>
    <p class="note">Showing <b>${mode==="begins"?"start":"Jamaat"} times</b>. Today is highlighted · Friday dates underlined.</p>`;
}

export function initTimetable(){
  buildGrid();
  document.querySelectorAll("#ttSeg button").forEach(b=>{
    b.onclick=()=>{
      mode=b.dataset.mode;
      document.querySelectorAll("#ttSeg button").forEach(x=>x.classList.toggle("active", x===b));
      showMonth(activeMonth);
    };
  });
  showMonth(new Date().getMonth()+1);
}
