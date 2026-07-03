/* ============================================================
   APP BOOTSTRAP — loads data, wires the bottom nav, and lazily
   initialises each section the first time it is opened.
   Also: auto-refresh of live content on app resume, and the
   About easter egg.
   (Web build: no push/local notifications — those need the
   native app — and no first-run onboarding gate.)
   ============================================================ */
import { initData } from "./data.js";
import { initSettings, getSettings, renderSettings } from "./settings.js";
import { initLinks } from "./links.js";
import { initPrayers, refreshPrayers } from "./prayers.js";
import { initTimetable } from "./timetable.js";
import { initEvents } from "./events.js";
import { initAnnouncements } from "./announcements.js";
import { initDirectory } from "./directory.js";

const $ = id => document.getElementById(id);

const SECTIONS = {
  prayers:       { el:"todayView" },
  timetable:     { el:"timetableView" },
  events:        { el:"eventsView" },
  announcements: { el:"announcementsView" },
  directory:     { el:"directoryView" },
  settings:      { el:"settingsView" },
  about:         { el:"aboutView" },
};
const LIVE = ["events","announcements","directory"];   // sections fed by Firebase
const inited = new Set();
let current = "prayers";

function lazyInit(name){
  if(inited.has(name)) {
    if(name==="prayers") refreshPrayers();
    if(name==="settings") renderSettings();
    return;
  }
  inited.add(name);
  switch(name){
    case "prayers":       initPrayers(refreshLiveContent); break;
    case "timetable":     initTimetable(); break;
    case "events":        initEvents(); break;
    case "announcements": initAnnouncements(); break;
    case "directory":     initDirectory(); break;
    case "settings":      renderSettings(); break;
    case "about":         wireAbout(); break;
  }
}

/* Mark live sections stale so they re-fetch next time they're opened. */
async function refreshLiveContent(){
  LIVE.forEach(n=>inited.delete(n));
}

function show(name){
  if(!SECTIONS[name]) return;
  current=name;
  Object.entries(SECTIONS).forEach(([k,v])=> $(v.el).hidden = (k!==name));
  // About lives under Settings in the nav
  const navKey = (name==="about") ? "settings" : name;
  document.querySelectorAll(".navitem").forEach(b=>
    b.classList.toggle("active", b.dataset.nav===navKey));
  lazyInit(name);
  window.scrollTo({ top:0 });
}

/* ---- About: back link + easter egg (5 taps on Credits) ---- */
function wireAbout(){
  $("aboutBack").onclick=()=>show("settings");
  let clicks=0, timer=null;
  $("creditsBox").onclick=()=>{
    clicks++;
    clearTimeout(timer);
    timer=setTimeout(()=>{ clicks=0; }, 3000);   // taps must be reasonably close together
    if(clicks>=5){
      clicks=0;
      $("aboutContent").hidden=true;
      $("easterEgg").hidden=false;
      window.scrollTo({ top:0 });
    }
  };
  $("easterBack").onclick=()=>{
    $("easterEgg").hidden=true;
    $("aboutContent").hidden=false;
  };
}

function wireNav(){
  document.querySelectorAll(".navitem").forEach(b=>{
    b.onclick=()=>show(b.dataset.nav);
  });
  // other modules (e.g. the About link in Settings) can navigate too
  document.addEventListener("app:navigate", e=>show(e.detail));
}

/* ---- Auto-refresh live content when the app returns to the foreground ---- */
function wireResumeRefresh(){
  const onResume=()=>{
    if(document.visibilityState!=="visible") return;
    LIVE.forEach(n=>inited.delete(n));
    if(LIVE.includes(current)) lazyInit(current);   // re-fetch the visible section now
    if(current==="prayers") refreshPrayers();
  };
  document.addEventListener("visibilitychange", onResume);
  window.addEventListener("focus", onResume);
}

async function main(){
  initLinks();
  await initData();
  await initSettings(kind=>{
    if(kind==="theme"||kind==="font") refreshPrayers();
  });
  wireNav();
  wireResumeRefresh();
  show("prayers");
}

main().catch(e=>{
  console.error(e);
  document.body.insertAdjacentHTML("beforeend",
    `<p class="empty">Something went wrong loading the app.</p>`);
});
