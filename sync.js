// Lightweight cross-device sync layer built on Firebase Realtime Database.
// Mirrors a fixed set of localStorage keys to a single database node so that
// any device with the same firebase-config.js sees the same app state live.
// If firebase-config.js is left blank, this becomes a harmless no-op and the
// app behaves exactly as it did with local-only storage.
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
  let applyingRemote = false;
  let pushTimer = null;

  function isEnabled() {
    return !!(global.firebase && global.firebaseConfig && global.firebaseConfig.apiKey);
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

  function init(onRemoteUpdate) {
    if (!isEnabled()) {
      console.info('Cross-device sync disabled. Fill in firebase-config.js to enable it.');
      return;
    }
    if (!global.firebase.apps.length) {
      global.firebase.initializeApp(global.firebaseConfig);
    }
    dbRef = global.firebase.database().ref(NODE_PATH);

    dbRef.on('value', (snapshot) => {
      if (applyingRemote) return;
      const data = snapshot.val();
      if (!data) {
        // Nothing in the cloud yet — seed it with whatever this device has.
        push(true);
        return;
      }
      applyRemotePayload(data);
      if (onRemoteUpdate) onRemoteUpdate();
    });
  }

  function push(immediate) {
    if (!dbRef || applyingRemote) return;
    clearTimeout(pushTimer);
    const doPush = () => dbRef.set(readLocalPayload());
    if (immediate) {
      doPush();
    } else {
      pushTimer = setTimeout(doPush, PUSH_DEBOUNCE_MS);
    }
  }

  global.DinnerWheelSync = { init, push };
})(window);
