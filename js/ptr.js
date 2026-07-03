/* ============================================================
   PULL-TO-REFRESH — reusable touch handler. Attach once per
   section; it only reacts while that section is visible and
   the page is scrolled to the top.
   ============================================================ */
export function attachPTR({ sectionId, ptrId, textId, onRefresh }){
  const section = document.getElementById(sectionId);
  const ptr = document.getElementById(ptrId);
  const text = document.getElementById(textId);
  if(!section || !ptr || !text) return;

  const THRESHOLD = 70;
  let startY = 0, pulling = false, dist = 0;
  const visible = () => !section.hidden;

  document.addEventListener("touchstart", e => {
    if(!visible() || window.scrollY > 0 || ptr.classList.contains("refreshing")) return;
    startY = e.touches[0].clientY; pulling = true; dist = 0;
  }, { passive: true });

  document.addEventListener("touchmove", e => {
    if(!pulling) return;
    dist = e.touches[0].clientY - startY;
    if(dist > 0 && window.scrollY <= 0){
      ptr.classList.add("pulling");
      text.textContent = dist > THRESHOLD ? "Release to refresh" : "Pull to refresh";
    } else if(dist <= 0){
      ptr.classList.remove("pulling");
    }
  }, { passive: true });

  document.addEventListener("touchend", async () => {
    if(!pulling) return;
    pulling = false;
    if(dist > THRESHOLD){
      ptr.classList.add("refreshing"); text.textContent = "Refreshing…";
      try{ await onRefresh(); }catch{ /* ignore */ }
      await new Promise(r => setTimeout(r, 400));
    }
    ptr.classList.remove("pulling","refreshing");
    text.textContent = "Pull to refresh";
  });
}
