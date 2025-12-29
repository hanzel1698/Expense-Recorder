# Firebase Setup Instructions

## Step 1: Create Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Add project" and follow the setup wizard
3. Once created, click on the web icon (`</>`) to add a web app
4. Register your app with a nickname (e.g., "Expense Recorder")
5. Copy the Firebase configuration object

## Step 2: Update Firebase Config

Open `src/firebase.ts` and replace the placeholder config with your actual Firebase credentials:

```typescript
const firebaseConfig = {
  apiKey: "YOUR_ACTUAL_API_KEY",
  authDomain: "your-project-id.firebaseapp.com",
  projectId: "your-project-id",
  storageBucket: "your-project-id.appspot.com",
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
  appId: "YOUR_APP_ID"
};
```

## Step 3: Enable Firestore Database

1. In Firebase Console, go to **Build** → **Firestore Database**
2. Click "Create database"
3. Choose **Start in test mode** (for development)
4. Select a location close to your users
5. Click "Enable"

## Step 4: Enable Anonymous Authentication

1. Go to **Build** → **Authentication**
2. Click "Get started"
3. Go to **Sign-in method** tab
4. Enable **Anonymous** authentication
5. Click "Save"

## Step 5: Update Firestore Rules (Optional but Recommended)

In Firestore Database → Rules, update to:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

This ensures users can only access their own data.

## How It Works

- **Anonymous Auth**: App automatically signs in users anonymously
- **Real-time Sync**: Data syncs between devices using Firestore
- **Local Backup**: localStorage still works as offline backup
- **Cross-device**: Same data appears on mobile and laptop when using the same browser or anonymous account

## Access from Mobile

The dev server is running at: **http://192.168.29.200:5173/**

Make sure your mobile is on the same WiFi network and navigate to this URL.

---

## Deploy to Firebase Hosting (Get Public URL)

To access your app from anywhere (not just local network), deploy to Firebase Hosting:

### 1. Install Firebase CLI (one-time setup)
```bash
npm install -g firebase-tools
```

### 2. Login to Firebase
```bash
firebase login
```

### 3. Initialize Firebase Hosting
```bash
firebase init hosting
```
- Select your existing project: **expense-recorder-1988**
- Public directory: **dist**
- Configure as single-page app: **Yes**
- Set up automatic builds: **No**
- Don't overwrite dist/index.html: **No**

### 4. Build your app
```bash
npm run build
```

### 5. Deploy to Firebase
```bash
firebase deploy --only hosting
```

### 6. Get Your Public URL
After deployment completes, you'll get a URL like:
**https://expense-recorder-1988.web.app/**

This URL works from any device, anywhere in the world!

### Quick Deploy Command (after initial setup)
```bash
npm run build && firebase deploy --only hosting
```
