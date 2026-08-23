# Cross-Device Sync Setup (Firebase)

This enables live syncing of recipes, this week's meals, archive, hidden/liked
recipes, and spin history across devices (e.g. computer + phone), using
Firebase Realtime Database's free tier.

## 1. Create a Firebase project
1. Go to https://console.firebase.google.com/ and sign in with any Google account.
2. Click **Add project**, give it a name (e.g. "dinner-wheel"), finish the wizard.
   (You can decline Google Analytics — not needed.)

## 2. Add a Web App
1. On the project overview page, click the **</>** (Web) icon.
2. Give it a nickname (e.g. "Dinner Wheel Web"), click **Register app**.
3. You'll see a `firebaseConfig` object with values like `apiKey`, `projectId`, etc.
   Keep this tab open — you'll need it in step 4.

## 3. Create the Realtime Database
1. In the left sidebar, go to **Build > Realtime Database**.
2. Click **Create Database**, pick any location, choose **Start in test mode**.
3. Once created, copy the **databaseURL** shown at the top
   (looks like `https://your-project-id-default-rtdb.firebaseio.com`).

> **Security note:** Test mode allows anyone with your databaseURL to read/write
> for 30 days, then locks everything by default. For a personal app like this,
> after the 30 days you can go to the **Rules** tab and set:
> ```json
> { "rules": { ".read": true, ".write": true } }
> ```
> to keep it permanently open (simplest option), since the URL isn't shared
> publicly anywhere and there's no sensitive data at risk beyond your recipes.

## 4. Fill in `firebase-config.js`
Open `firebase-config.js` in this project and paste in the values from step 2
(plus `databaseURL` from step 3):

```js
window.firebaseConfig = {
  apiKey: "AIza...",
  authDomain: "your-project-id.firebaseapp.com",
  databaseURL: "https://your-project-id-default-rtdb.firebaseio.com",
  projectId: "your-project-id",
  storageBucket: "your-project-id.appspot.com",
  messagingSenderId: "...",
  appId: "...",
};
```

Save, commit, and push. Once deployed, every device that opens the app will
sync through this same database — spin the wheel on your computer, and the
result/meal list/etc. will update live on your phone too.

Leaving `apiKey` blank keeps sync disabled and the app works exactly as before
(local-only storage per device).
