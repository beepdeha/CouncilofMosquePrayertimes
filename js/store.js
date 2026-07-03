/* ============================================================
   STORAGE — thin wrapper that uses Capacitor Preferences on a
   device and falls back to localStorage in a plain browser.
   All values are JSON-encoded.
   ============================================================ */
let Prefs = null;
try {
  // Available when running inside the Capacitor native shell.
  const cap = window.Capacitor;
  if (cap?.Plugins?.Preferences) Prefs = cap.Plugins.Preferences;
} catch { /* ignore */ }

export async function getItem(key, fallback=null){
  try{
    if(Prefs){ const { value } = await Prefs.get({ key }); return value==null ? fallback : JSON.parse(value); }
    const v = localStorage.getItem(key); return v==null ? fallback : JSON.parse(v);
  }catch{ return fallback; }
}

export async function setItem(key, value){
  const v = JSON.stringify(value);
  try{
    if(Prefs){ await Prefs.set({ key, value:v }); return; }
    localStorage.setItem(key, v);
  }catch{ /* ignore */ }
}
