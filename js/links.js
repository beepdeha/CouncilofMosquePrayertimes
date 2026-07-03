/* ============================================================
   EXTERNAL LINKS — open http(s) links in the system browser
   instead of navigating the app's WebView (which would strand
   the user on a page with no back button).
   Uses @capacitor/browser on device; window.open on the web.
   tel:/mailto: are left to the OS.
   ============================================================ */
function browserPlugin(){
  try{ return window.Capacitor?.Plugins?.Browser || null; }catch{ return null; }
}

/* Add a scheme if the user/admin typed a bare domain like "www.gdcopy.com". */
export function normalizeUrl(url){
  const u = String(url||"").trim();
  if(!u) return "";
  if(/^(https?:|tel:|mailto:)/i.test(u)) return u;
  return "https://" + u.replace(/^\/+/, "");
}

export async function openExternal(url){
  const u = normalizeUrl(url);
  if(!u) return;
  if(/^(tel:|mailto:)/i.test(u)){ window.location.href = u; return; }
  const B = browserPlugin();
  if(B){ try{ await B.open({ url:u }); return; }catch{ /* fall through */ } }
  window.open(u, "_blank", "noopener");
}

/* Delegated handler: any <a> whose href is http(s) opens externally. */
export function initLinks(){
  document.addEventListener("click", (e)=>{
    const a = e.target.closest && e.target.closest("a[href]");
    if(!a) return;
    const href = a.getAttribute("href") || "";
    if(/^https?:\/\//i.test(href) || a.dataset.external==="1"){
      e.preventDefault();
      openExternal(href);
    }
  });
}
