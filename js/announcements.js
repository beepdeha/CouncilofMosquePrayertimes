/* ============================================================
   ANNOUNCEMENTS VIEW — Announcements / Janaza / Madrassa / Reminders.
   Each item has a `type` of announcement | death | madrassa | reminder.
   ("death" is kept as the stored key so existing posts still show;
   it is only labelled "Janaza" in the UI.)
   Newest first (by createdAt); shows posted date + time of day.
   ============================================================ */
import { loadCollection } from "./firebase.js";
import { attachPTR } from "./ptr.js";

const $ = id => document.getElementById(id);
const TYPES = { announcement:"announcements", death:"Janaza notices",
                madrassa:"madrassa announcements", reminder:"reminders" };
let activeType = "announcement";
let items = [];
let ptrAttached = false;

function esc(s=""){ return String(s).replace(/[&<>"]/g, c=>({ "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;" }[c])); }

function postedAt(i){
  if(i.createdAt) return new Date(i.createdAt);
  if(i.date){ const d=new Date(i.date); if(!isNaN(d)) return d; }
  return null;
}
function fmtDateTime(i){
  const d = postedAt(i);
  if(!d) return "";
  return d.toLocaleDateString(undefined,{ day:"numeric", month:"long", year:"numeric" }) +
         " · " + d.toLocaleTimeString(undefined,{ hour:"numeric", minute:"2-digit" });
}

function renderList(){
  document.querySelectorAll("#announcementsView .subtab").forEach(b=>
    b.classList.toggle("active", b.dataset.type===activeType));

  const list=$("annList");
  const rows=items
    .filter(i=>(i.type||"announcement")===activeType)
    .sort((a,b)=>(b.createdAt||0)-(a.createdAt||0));   // newest first
  if(!rows.length){
    list.innerHTML=`<p class="empty">No ${TYPES[activeType]} at the moment.<br>Check back soon.</p>`;
    return;
  }
  list.innerHTML=rows.map(i=>`
    <div class="item">
      <div class="meta">${esc(fmtDateTime(i))}</div>
      <h3>${esc(i.title||"")}</h3>
      ${i.image?`<img src="${esc(i.image)}" alt="" loading="lazy">`:""}
      ${i.body?`<p>${esc(i.body).replace(/\n/g,"<br>")}</p>`:""}
    </div>`).join("");
}

async function load(){
  const { data } = await loadCollection("announcements", { orderField:"createdAt", desc:true });
  items=data||[];
}

export async function initAnnouncements(){
  $("annList").innerHTML=`<p class="empty">Loading…</p>`;
  document.querySelectorAll("#announcementsView .subtab").forEach(b=>{
    b.onclick=()=>{ activeType=b.dataset.type; renderList(); };
  });
  await load();
  renderList();
  if(!ptrAttached){
    ptrAttached = true;
    attachPTR({ sectionId:"announcementsView", ptrId:"ptrAnn", textId:"ptrAnnText",
                onRefresh: async ()=>{ await load(); renderList(); } });
  }
}
