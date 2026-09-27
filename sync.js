// Lightweight cross-device sync layer built on Firebase Realtime Database.
// Mirrors a fixed set of localStorage keys to a single database node so that
// any device with the same firebase-config.js sees the same app state live.
// If firebase-config.js is left blank, this becomes a harmless no-op and the
// app behaves exactly as it did with local-only storage.
//
// Optional sign-in (email/password via Firebase Auth): when the auth SDK is
// loaded, sync only runs while a user is signed in. This keeps private-
// browsing sessions working (sign in, data is pulled/pushed, sign out) and
// lets the database rules be locked to authenticated users only.
(function (global) {
  const NODE_PATH = 'dinnerWheelState';
  const SYNC_KEYS = [
    'dinnerWheelRecipes',
    'dinnerWheelHiddenRecipes',
    'dinnerWheelThisWeek',
    'dinnerWheelDontMakeAgain',
    'dinnerWheelCuisines',
    'dinnerWheelIngredients',
    'dinnerWheelLikedRecipes',
    'dinnerWheelWeekArchive',
    'dinnerWheelSpinHistory',
  ];
  const PUSH_DEBOUNCE_MS = 300;

  let dbRef = null;
  let database = null;
  let auth = null;
  let listening = false;
  let onRemoteUpdate = null;
  const authListeners = [];
  let applyingRemote = false;
  let pushTimer = null;

  function isEnabled() {
    return !!(global.firebase && global.firebaseConfig && global.firebaseConfig.apiKey);
  }

  function authSupported() {
    return !!(global.firebase && typeof global.firebase.auth === 'function');
  }

  function readLocalPayload() {
    const payload = {};
    SYNC_KEYS.forEach((key) => {
      const val = localStorage.getItem(key);
      if (val !== null) payload[key] = val;
    });
    return payload;
  }

  function applyRemotePayload(data) {
    applyingRemote = true;
    SYNC_KEYS.forEach((key) => {
      if (data[key] !== undefined) {
        localStorage.setItem(key, data[key]);
      }
    });
    applyingRemote = false;
  }

  function onValue(snapshot) {
    if (applyingRemote) return;
    const data = snapshot.val();
    if (!data) {
      // Nothing in the cloud yet — seed it with whatever this device has.
      push(true);
      return;
    }
    applyRemotePayload(data);
    if (onRemoteUpdate) onRemoteUpdate();
  }

  function onValueError(err) {
    console.error('DinnerWheelSync: failed to read remote state', err);
    // Firebase cancels the listener on permission_denied — allow a later
    // sign-in to re-subscribe.
    listening = false;
  }

  function subscribe() {
    if (!dbRef || listening) return;
    listening = true;
    dbRef.on('value', onValue, onValueError);
  }

  function unsubscribe() {
    if (dbRef && listening) dbRef.off('value', onValue);
    listening = false;
  }

  function notifyAuthListeners(user) {
    authListeners.forEach((cb) => cb(user));
  }

  function init(remoteUpdateCb) {
    if (!isEnabled()) {
      console.info('Cross-device sync disabled. Fill in firebase-config.js to enable it.');
      return;
    }
    onRemoteUpdate = remoteUpdateCb;
    if (!global.firebase.apps.length) {
      global.firebase.initializeApp(global.firebaseConfig);
    }
    database = global.firebase.database();

    if (authSupported()) {
      auth = global.firebase.auth();
      auth.onAuthStateChanged((user) => {
        // Sync only while signed in, and scope the data to the user's own
        // node (users/<uid>/...) so security rules can lock each user to
        // their own space. Sign-in (re)subscribes; sign-out detaches.
        unsubscribe();
        dbRef = user ? database.ref(`users/${user.uid}/${NODE_PATH}`) : null;
        if (user) subscribe();
        notifyAuthListeners(user);
      });
    } else {
      // Auth SDK not loaded — fall back to syncing anonymously (open rules).
      dbRef = database.ref(NODE_PATH);
      subscribe();
    }

    // Flush any pending debounced push when the page is closed or
    // backgrounded, so quick "change then close" actions aren't lost.
    global.addEventListener('pagehide', () => push(true));
  }

  function push(immediate) {
    if (!dbRef || applyingRemote) return;
    clearTimeout(pushTimer);
    // update() merges per-key instead of set() which replaces the whole
    // node — a device missing keys in localStorage must not delete them
    // for everyone else.
    const doPush = () => {
      dbRef.update(readLocalPayload()).catch((err) => {
        console.error('DinnerWheelSync: failed to push local state', err);
      });
    };
    if (immediate) {
      doPush();
    } else {
      pushTimer = setTimeout(doPush, PUSH_DEBOUNCE_MS);
    }
  }

  function requireAuth() {
    if (!auth) return Promise.reject(new Error('Sign-in is unavailable (auth SDK not loaded).'));
    return null;
  }

  function signIn(email, password) {
    return requireAuth() || auth.signInWithEmailAndPassword(email, password);
  }

  function signUp(email, password) {
    const err = requireAuth();
    if (err) return err;
    return auth.createUserWithEmailAndPassword(email, password).then((cred) => {
      const user = cred.user;
      const uid = user && user.uid;
      const addr = (user && user.email) || email;
      // Record the signup so it's visible in the Firebase console
      // (Realtime Database > Data > signups, and Authentication > Users).
      if (database && uid) {
        database.ref(`signups/${uid}`)
          .set({ email: addr, createdAt: Date.now() })
          .catch(() => {});
      }
      // Optional push notification via ntfy.sh — set
      // window.signupNotifyTopic in firebase-config.js to enable.
      if (global.signupNotifyTopic) {
        fetch(`https://ntfy.sh/${encodeURIComponent(global.signupNotifyTopic)}`, {
          method: 'POST',
          body: `New Dinner Wheel account created: ${addr}`,
        }).catch(() => {});
      }
      return cred;
    });
  }

  function signOut() {
    return requireAuth() || auth.signOut();
  }

  function onAuthChange(cb) {
    authListeners.push(cb);
    if (auth) cb(auth.currentUser);
  }

  global.DinnerWheelSync = { init, push, signIn, signUp, signOut, onAuthChange, authSupported };
})(window);
