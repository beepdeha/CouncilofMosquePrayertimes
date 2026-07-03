/* ============================================================
   SETTINGS — font scale and light/dark theme.
   (Web build: notification settings are omitted because push /
   on-device reminders require the native app.)
   Persisted via store.js. Other modules read getSettings().
   ============================================================ */
import { getItem, setItem } from "./store.js";

const KEY = "settings.v1";

const DEFAULTS = {
  fontScale: 1,
  theme: "light",            // "light" | "dark"
};

let state = structuredClone(DEFAULTS);
let onChange = ()=>{};

export function getSettings(){ return state; }

function apply(){
  document.documentElement.style.setProperty("--fs", state.fontScale.toFixed(2));
  document.documentElement.setAttribute("data-theme", state.theme);
  const tc = document.querySelector('meta[name="theme-color"]');
  if(tc) tc.setAttribute("content", state.theme==="dark" ? "#06140f" : "#2f9e44");
}

async function persist(){ await setItem(KEY, state); }

export async function initSettings(changeCb){
  onChange = changeCb || (()=>{});
  const saved = await getItem(KEY, null);
  if(saved) state = Object.assign(structuredClone(DEFAULTS), saved);
  apply();
}

const $ = id => document.getElementById(id);

export function renderSettings(){
  const s=state;
  const root=$("settingsView");
  root.querySelector(".settings").innerHTML = `
    <div class="set-card">
      <div class="set-row linkrow" id="aboutLink" role="button" tabindex="0">
        <div class="lbl" style="font-weight:700">About</div>
        <span class="chev">›</span>
      </div>
    </div>

    <div class="set-card">
      <h3>Display</h3>
      <div class="set-row">
        <div class="lbl">Text size</div>
        <div class="stepper">
          <button id="fontDec" aria-label="Smaller text">A−</button>
          <span class="v" id="fontVal">${Math.round(s.fontScale*100)}%</span>
          <button id="fontInc" aria-label="Larger text">A+</button>
        </div>
      </div>
      <div class="set-row">
        <div class="lbl">Dark mode</div>
        <label class="toggle"><input type="checkbox" id="darkToggle" ${s.theme==="dark"?"checked":""}><span class="track"></span><span class="knob"></span></label>
      </div>
    </div>`;

  // wire controls
  $("aboutLink").onclick=()=>document.dispatchEvent(new CustomEvent("app:navigate",{ detail:"about" }));
  $("fontInc").onclick=()=>setFont(s.fontScale+0.1);
  $("fontDec").onclick=()=>setFont(s.fontScale-0.1);
  $("darkToggle").onchange=e=>{ s.theme=e.target.checked?"dark":"light"; apply(); persist(); onChange("theme"); };
}

function setFont(v){
  state.fontScale=Math.max(0.85, Math.min(1.6, Math.round(v*10)/10));
  apply(); persist();
  const el=$("fontVal"); if(el) el.textContent=Math.round(state.fontScale*100)+"%";
  onChange("font");
}
