/* ============================================================
   FIREBASE CONFIG
   Paste the config from your Firebase project here (Project
   Settings → Your apps → SDK setup). Until then the app runs on
   bundled seed data + offline cache, so everything still works.

   The app treats the config as "not set up" while apiKey still
   starts with "PASTE_".
   ============================================================ */
export const firebaseConfig = {
  apiKey: "AIzaSyDgoBu7mKx2DNN2ppywpK86uQ-ARf3k_D4",
  authDomain: "council-of-mosque-prayer-times.firebaseapp.com",
  projectId: "council-of-mosque-prayer-times",
  storageBucket: "council-of-mosque-prayer-times.firebasestorage.app",
  messagingSenderId: "81625512077",
  appId: "1:81625512077:web:3743ac6c15a68415f60ac4"
};

export function isConfigured(){
  return !!firebaseConfig.apiKey && !firebaseConfig.apiKey.startsWith("PASTE_");
}
