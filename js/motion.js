/* ============================================================
   MOTION — helpers for view entrances and list stagger.

   Entrances are one-shot CSS animations, not transitions. The app
   switches views by toggling [hidden] (display:none), and a transition
   cannot start from a display:none frame — the usual fix is to paint a
   "from" class and strip it on the next rAF, but rAF does not fire while
   the page is hidden, which leaves the view stuck at opacity:0 until
   something paints. An animation with no fill has the opposite failure
   mode: if it never runs, the element just renders normally. That is the
   right way round for an app people open from a notification.

   The class is therefore left on the element; it is removed and re-added
   (with a forced reflow between) so a repeat call replays the animation.

   Keep every value here small. The bottom nav is the most-tapped surface
   in the app; anything that reads as a "page transition" makes it feel
   slower, not nicer.
   ============================================================ */

const ENTRANCES = ["view-enter","fade-enter","detail-enter","back-enter"];

const reduced = () =>
  window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false;

/* Play an entrance on `el`. Reduced motion is handled in CSS (the fade is
   kept, the movement is dropped), so it is not gated here. */
export function enter(el, cls="view-enter"){
  if(!el) return;
  el.classList.remove(...ENTRANCES);
  void el.offsetWidth;                 // restart if one is already playing
  el.classList.add(cls);
}

/* Stagger the children of a list container. Decorative, so it is skipped
   entirely under reduced motion. */
export function stagger(el){
  if(!el || reduced()) return;
  el.classList.remove("stagger");
  void el.offsetWidth;
  el.classList.add("stagger");
}
