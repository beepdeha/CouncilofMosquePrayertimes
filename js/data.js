/* ============================================================
   DATA LAYER
   Loads the year's prayer times from data/prayer-times.json and
   builds a flat lookup keyed "M-D" with Jamāʿah carried forward
   (a time applies until it changes, like the printed board).
   Row format:
   [date, sehriEnds, sunrise, zuhrStart, asrStart, ishaStart,
    fajrJamaat, zuhrJamaat, asrJamaat, maghrib, ishaJamaat]
   ============================================================ */

export const DOW = ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"];
export const MON = ["January","February","March","April","May","June","July",
                    "August","September","October","November","December"];

export const TABLE = {};
export const RAW = {};

export async function initData(){
  const res = await fetch("data/prayer-times.json");
  const raw = await res.json();
  Object.assign(RAW, raw);

  let lastFajr="", lastZuhr="", lastAsr="", lastIsha="";
  for(let m=1;m<=12;m++){
    if(!raw[m]) continue;
    for(const row of raw[m]){
      const [d,sehri,sunrise,zuhrS,asrS,ishaS,fJ,zJ,aJ,maghrib,iJ]=row;
      if(fJ) lastFajr=fJ;
      if(zJ) lastZuhr=zJ;
      if(aJ) lastAsr=aJ;
      if(iJ) lastIsha=iJ;
      TABLE[m+"-"+d]={
        sehri, sunrise, zuhrS, asrS, ishaS, maghrib,
        fajrJ:lastFajr, zuhrJ:lastZuhr, asrJ:lastAsr, ishaJ:lastIsha
      };
    }
  }
  return TABLE;
}

export function dayTimes(date){
  return TABLE[(date.getMonth()+1)+"-"+date.getDate()] || null;
}

/* "Begins" time string -> minutes-from-midnight, choosing AM/PM by prayer. */
export function toMinutes(t, prayer){
  if(!t) return null;
  const [h,mm]=t.split(".").map(Number);
  let hr=h, min=mm||0;
  const pm = (prayer==="zuhr"||prayer==="asr"||prayer==="maghrib"||prayer==="isha");
  if(pm && hr!==12) hr+=12;
  if(prayer==="zuhr" && (h===11)) hr=11;        // winter Zuhr ~11.5x stays AM
  if(prayer==="fajr"||prayer==="sunrise"){ if(hr===12) hr=0; }
  return hr*60+min;
}

/* Next prayer to BEGIN from now, wrapping to tomorrow's Fajr. */
export function nextBegins(from){
  const order=[["Fajr","fajr","sehri"],["Zuhr","zuhr","zuhrS"],["Asr","asr","asrS"],
               ["Maghrib","maghrib","maghrib"],["Isha","isha","ishaS"]];
  const now = from || new Date();
  const t = dayTimes(now);
  const nowMin = now.getHours()*60+now.getMinutes()+now.getSeconds()/60;
  if(t){
    for(const [name,key,field] of order){
      const mins=toMinutes(t[field],key);
      if(mins!==null && mins>nowMin){
        const tgt=new Date(now); tgt.setHours(Math.floor(mins/60),mins%60,0,0);
        return {name,target:tgt};
      }
    }
  }
  const tm=new Date(now); tm.setDate(tm.getDate()+1);
  const t2=dayTimes(tm);
  if(t2){
    const mins=toMinutes(t2.sehri,"fajr");
    const tgt=new Date(tm); tgt.setHours(Math.floor(mins/60),mins%60,0,0);
    return {name:"Fajr",target:tgt};
  }
  return null;
}
