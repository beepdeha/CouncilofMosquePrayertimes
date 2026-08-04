/* ============================================================
   DIRECTORY VIEW — Masjids (square grid → detail) and
   Businesses (list → detail with offers).
   ============================================================ */
import { loadCollection } from "./firebase.js";
import { normalizeUrl } from "./links.js";
import { enter } from "./motion.js";

const $ = id => document.getElementById(id);
let activeTab = "mosques";
let mosques = [];
let businesses = [];
let offersByBiz = {};

const BUSINESS_INTRO = "Our Business Directory exists to help our community benefit from the services offered by local Muslim-owned businesses. It's a win for everyone: the community gets easy access to trusted local services, the businesses gain visibility and custom, and every business that advertises with us also directly supports Dar Ul Uloom Siddiqia Masjid.";

function esc(s=""){ return String(s).replace(/[&<>"]/g, c=>({ "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;" }[c])); }

/* `cls` picks the entrance: a plain fade when switching sub-tabs, a
   return-from-the-left when coming back out of a detail page. */
function showSection(cls="fade-enter"){
  document.querySelectorAll("#directoryView .subtab").forEach(b=>
    b.classList.toggle("active", b.dataset.dir===activeTab));
  $("mosqueDetail").hidden=true;
  $("dirList").hidden=false;
  activeTab==="mosques" ? renderMasjids() : renderBusinesses();
  enter($("dirList"), cls);
}
const backToList = ()=>showSection("back-enter");

/* ---------- Masjids (square cards, 2-up) ---------- */
function renderMasjids(){
  const list=$("dirList");
  if(!mosques.length){ list.innerHTML=`<p class="empty">No masjids listed yet.</p>`; return; }
  list.innerHTML = `<div class="dir-grid">` + mosques.map(m=>`
    <div class="card-sq" data-id="${esc(m.id)}">
      <h3>${esc(m.name||"Masjid")}</h3>
      ${m.area?`<div class="meta">${esc(m.area)}</div>`:""}
    </div>`).join("") + `</div>`;
  list.querySelectorAll(".card-sq").forEach(el=> el.onclick=()=>showMasjid(el.dataset.id));
}

function field(lbl, val, href){
  if(!val) return "";
  const inner = href ? `<a href="${esc(href)}">${esc(val)}</a>` : esc(val);
  return `<div class="field"><div class="lbl">${lbl}</div><div class="val">${inner}</div></div>`;
}

function showMasjid(id){
  const m=mosques.find(x=>x.id===id); if(!m) return;
  $("dirList").hidden=true;
  const box=$("mosqueDetail"); box.hidden=false;
  const jummah = Array.isArray(m.jummah)
    ? m.jummah.map(j=>`${esc(j.label||"Jummah")}: ${esc(j.time||"")}`).join("<br>")
    : esc(m.jummah||"");
  box.innerHTML=`
    <button class="backlink" id="backBtn">‹ All masjids</button>
    <h1 class="title" style="margin-top:10px">${esc(m.name||"Masjid")}</h1>
    ${m.area?`<p class="subtitle">${esc(m.area)}</p>`:""}
    <div class="detail">
      ${field("Address", m.address)}
      ${jummah?`<div class="field"><div class="lbl">Jummah</div><div class="val">${jummah}</div></div>`:""}
      ${field("Phone", m.phone, m.phone?`tel:${m.phone}`:null)}
      ${field("Email", m.email, m.email?`mailto:${m.email}`:null)}
      ${field("Website", m.website, m.website?normalizeUrl(m.website):null)}
      ${field("Location", m.location, m.location?normalizeUrl(m.location):null)}
      ${field("Notes", m.notes)}
      ${(!m.address&&!jummah&&!m.phone&&!m.location)?`<p class="empty">Details for this masjid will be added soon.</p>`:""}
    </div>`;
  $("backBtn").onclick=backToList;
  // instant, not smooth — a scroll animation would fight the slide-in
  window.scrollTo({top:0});
  enter(box, "detail-enter");
}

/* ---------- Businesses (list → detail with offers) ---------- */
function renderBusinesses(){
  const list=$("dirList");
  const intro = `<div class="intro">${esc(BUSINESS_INTRO)}</div>`;
  if(!businesses.length){ list.innerHTML=intro+`<p class="empty">No businesses listed yet.</p>`; return; }
  list.innerHTML = intro + `<div class="dir-grid">` + businesses.map(b=>`
    <div class="card-sq" data-id="${esc(b.id)}">
      <h3>${esc(b.name||"")}</h3>
      ${b.category?`<div class="meta">${esc(b.category)}</div>`:""}
    </div>`).join("") + `</div>`;
  list.querySelectorAll(".card-sq").forEach(el=> el.onclick=()=>showBusiness(el.dataset.id));
}

function showBusiness(id){
  const b=businesses.find(x=>x.id===id); if(!b) return;
  $("dirList").hidden=true;
  const box=$("mosqueDetail"); box.hidden=false;
  const offers=(offersByBiz[id]||[]).sort((x,y)=>(y.createdAt||0)-(x.createdAt||0));
  const offersHtml = offers.length ? `
    <div class="detail">
      <div class="section-cap">Offers &amp; News</div>
      ${offers.map(o=>`<div class="offer">
        ${o.createdAt?`<div class="meta">${new Date(o.createdAt).toLocaleDateString(undefined,{day:"numeric",month:"long",year:"numeric"})}</div>`:""}
        <h4>${esc(o.title||"")}</h4>
        ${o.image?`<img src="${esc(o.image)}" alt="" loading="lazy">`:""}
        ${o.body?`<p>${esc(o.body).replace(/\n/g,"<br>")}</p>`:""}
      </div>`).join("")}
    </div>` : "";
  box.innerHTML=`
    <button class="backlink" id="backBtn">‹ All businesses</button>
    <h1 class="title" style="margin-top:10px">${esc(b.name||"")}</h1>
    ${b.category?`<p class="subtitle">${esc(b.category)}</p>`:""}
    ${b.image?`<div class="card" style="margin-top:14px"><img src="${esc(b.image)}" alt="" style="width:100%;display:block"></div>`:""}
    <div class="detail">
      ${b.description?`<div class="field"><div class="val">${esc(b.description).replace(/\n/g,"<br>")}</div></div>`:""}
      ${field("Phone", b.phone, b.phone?`tel:${b.phone}`:null)}
      ${field("Website", b.website, b.website?normalizeUrl(b.website):null)}
    </div>
    ${offersHtml}`;
  $("backBtn").onclick=backToList;
  // instant, not smooth — a scroll animation would fight the slide-in
  window.scrollTo({top:0});
  enter(box, "detail-enter");
}

export async function initDirectory(){
  $("dirList").innerHTML=`<p class="empty">Loading…</p>`;
  document.querySelectorAll("#directoryView .subtab").forEach(b=>{
    b.onclick=()=>{ activeTab=b.dataset.dir; showSection(); };   // fade
  });
  const [m,b,o]=await Promise.all([
    loadCollection("mosques",{ orderField:"name", desc:false }),
    loadCollection("businesses",{ orderField:"name", desc:false }),
    loadCollection("offers",{ orderField:"createdAt", desc:true })
  ]);
  mosques=m.data||[];
  businesses=b.data||[];
  offersByBiz={};
  (o.data||[]).forEach(of=>{ (offersByBiz[of.businessId] ||= []).push(of); });
  showSection();
}
