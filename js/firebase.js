/* ============================================================
   CONTENT SOURCE
   Resolves a collection (announcements / mosques / businesses) by:
     1. returning the offline cache immediately if we have it, then
     2. fetching live from Firestore (only if configured + online),
        updating the cache, and
     3. falling back to bundled seed JSON (data/<name>.json) when
        there is no cache yet.
   Firebase is imported lazily from the CDN so the app stays
   offline-first and works before Firebase is even set up.
   ============================================================ */
import { getItem, setItem } from "./store.js";
import { firebaseConfig, isConfigured } from "./firebase-config.js";

const SDK = "https://www.gstatic.com/firebasejs/10.12.2";
let dbPromise = null;

async function getDb(){
  if(!isConfigured()) return null;
  if(!navigator.onLine) return null;
  if(dbPromise) return dbPromise;
  dbPromise = (async ()=>{
    const { initializeApp } = await import(`${SDK}/firebase-app.js`);
    const { getFirestore, collection, getDocs, orderBy, query } =
      await import(`${SDK}/firebase-firestore.js`);
    const app = initializeApp(firebaseConfig);
    const db = getFirestore(app);
    return { db, collection, getDocs, orderBy, query };
  })().catch(e=>{ console.warn("Firebase init failed", e); return null; });
  return dbPromise;
}

async function seed(name){
  try{ const r=await fetch(`data/${name}.json`); return r.ok ? await r.json() : []; }
  catch{ return []; }
}

/* Returns { data, source } where source ∈ "live" | "cache" | "seed". */
export async function loadCollection(name, { orderField="date", desc=true } = {}){
  const cacheKey = `cache.${name}`;
  const cached = await getItem(cacheKey, null);

  const fb = await getDb();
  if(fb){
    try{
      const q = fb.query(fb.collection(fb.db, name), fb.orderBy(orderField, desc?"desc":"asc"));
      const snap = await fb.getDocs(q);
      const data = snap.docs.map(d=>({ id:d.id, ...d.data() }));
      await setItem(cacheKey, data);
      return { data, source:"live" };
    }catch(e){ console.warn(`live fetch failed for ${name}`, e); }
  }

  if(cached) return { data: cached, source:"cache" };
  return { data: await seed(name), source:"seed" };
}
