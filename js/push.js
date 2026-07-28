/* ============================================================
   PUSH NOTIFICATIONS (Android via Firebase Cloud Messaging).
   Uses @capacitor-firebase/messaging topic subscriptions so no
   device-token management is needed: a Cloud Function publishes
   to a topic when content is posted, and devices subscribed to
   that topic receive it.
   No-ops on the web (plugin only present in the native shell).
   ============================================================ */

// settings type-key  ->  FCM topic
const TOPIC = { events:"events", reminder:"reminders", death:"deaths", madrassa:"madrassa", offers:"offers" };

function plugin(){
  try{ return window.Capacitor?.Plugins?.FirebaseMessaging || null; }catch{ return null; }
}
export function pushAvailable(){ return !!plugin(); }

async function ensurePermission(){
  const M=plugin(); if(!M) return false;
  try{
    let r = await M.checkPermissions();
    if(r.receive!=="granted") r = await M.requestPermissions();
    if(r.receive!=="granted") return false;
    await M.getToken();          // registers the device with FCM
    return true;
  }catch(e){ console.warn("push permission failed", e); return false; }
}

/* Bring topic subscriptions in line with the saved settings. */
export async function syncSubscriptions(settings){
  const M=plugin(); if(!M) return;
  const a = settings.announce || {};
  try{
    if(!a.enabled){
      for(const t of Object.values(TOPIC)){ try{ await M.unsubscribeFromTopic({ topic:t }); }catch{} }
      return;
    }
    const granted = await ensurePermission();
    if(!granted) return;
    for(const [key, topic] of Object.entries(TOPIC)){
      const on = a.types?.[key];
      try{
        if(on) await M.subscribeToTopic({ topic });
        else   await M.unsubscribeFromTopic({ topic });
      }catch(e){ console.warn("topic sync failed", topic, e); }
    }
  }catch(e){ console.warn("syncSubscriptions failed", e); }
}
