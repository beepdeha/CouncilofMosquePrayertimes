/* ============================================================
   LOCAL PRAYER NOTIFICATIONS
   Schedules on-device reminders from the prayer data per the
   user's settings. No network needed. No-ops in a plain browser
   (the Capacitor plugin is only present in the native shell).
   ============================================================ */
import { dayTimes, toMinutes } from "./data.js";

const PRAYERS = [
  { key:"fajr",    label:"Fajr",    startField:"sehri",  jamField:"fajrJ" },
  { key:"zuhr",    label:"Zuhr",    startField:"zuhrS",  jamField:"zuhrJ" },
  { key:"asr",     label:"Asr",     startField:"asrS",   jamField:"asrJ" },
  { key:"maghrib", label:"Maghrib", startField:"maghrib",jamField:"maghrib" },
  { key:"isha",    label:"Isha",    startField:"ishaS",  jamField:"ishaJ" },
];

function plugin(){
  try{ return window.Capacitor?.Plugins?.LocalNotifications || null; }catch{ return null; }
}

export function notificationsAvailable(){ return !!plugin(); }

export async function requestPermission(){
  const LN=plugin(); if(!LN) return false;
  try{ const r=await LN.requestPermissions(); return r.display==="granted"; }
  catch{ return false; }
}

/* Build notification objects for the next `days` days from a base date. */
function buildSchedule(settings, baseDate, days=2){
  const list=[];
  const lead = Math.max(0, Math.min(60, settings.notify.leadMinutes|0));
  for(let off=0; off<days; off++){
    const date=new Date(baseDate); date.setDate(date.getDate()+off);
    const t=dayTimes(date); if(!t) continue;
    for(const p of PRAYERS){
      if(!settings.notify.prayers[p.key]) continue;
      const useJam = settings.notify.target==="jamaat";
      const timeStr = useJam ? (t[p.jamField]||t[p.startField]) : t[p.startField];
      const mins = toMinutes(timeStr, p.key);
      if(mins==null) continue;
      const at=new Date(date); at.setHours(Math.floor(mins/60), mins%60, 0, 0);
      at.setMinutes(at.getMinutes()-lead);
      if(at <= new Date()) continue;             // skip past times
      // stable-ish id: dayOfYear*100 + prayerIndex
      const doy = Math.floor((at - new Date(at.getFullYear(),0,0)) / 86400000);
      const id = doy*100 + PRAYERS.indexOf(p);
      const when = useJam ? "Jamaat" : "starts";
      const body = lead>0 ? `${p.label} ${when} in ${lead} min` : `${p.label} ${when} now`;
      list.push({ id, title:"Prayer Times", body, schedule:{ at }, smallIcon:"ic_stat_icon" });
    }
  }
  return list;
}

/* Cancel everything we previously scheduled, then schedule fresh. */
export async function reschedule(settings){
  const LN=plugin(); if(!LN) return;
  try{
    const pending = await LN.getPending();
    if(pending?.notifications?.length){
      await LN.cancel({ notifications: pending.notifications.map(n=>({id:n.id})) });
    }
    if(!settings.notify.enabled) return;
    const granted = await requestPermission();
    if(!granted) return;
    const notifications = buildSchedule(settings, new Date(), 2);
    if(notifications.length) await LN.schedule({ notifications });
  }catch(e){ console.warn("notification reschedule failed", e); }
}
