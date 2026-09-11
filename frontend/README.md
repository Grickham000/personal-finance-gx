# Welcome to your Expo app 👋

This is an [Expo](https://expo.dev) project created with [`create-expo-app`](https://www.npmjs.com/package/create-expo-app).

## Get started

1. Install dependencies

   ```bash
   npm install
   ```

2. Start the app

   ```bash
   npx expo start
   ```

In the output, you'll find options to open the app in a

- [development build](https://docs.expo.dev/develop/development-builds/introduction/)
- [Android emulator](https://docs.expo.dev/workflow/android-studio-emulator/)
- [iOS simulator](https://docs.expo.dev/workflow/ios-simulator/)
- [Expo Go](https://expo.dev/go), a limited sandbox for trying out app development with Expo

You can start developing by editing the files inside the **app** directory. This project uses [file-based routing](https://docs.expo.dev/router/introduction).

## Get a fresh project

When you're ready, run:

```bash
npm run reset-project
```

This command will move the starter code to the **app-example** directory and create a blank **app** directory where you can start developing.

### Other setup steps

- To set up ESLint for linting, run `npx expo lint`, or follow our guide on ["Using ESLint and Prettier"](https://docs.expo.dev/guides/using-eslint/)
- If you'd like to set up unit testing, follow our guide on ["Unit Testing with Jest"](https://docs.expo.dev/develop/unit-testing/)
- Learn more about the TypeScript setup in this template in our guide on ["Using TypeScript"](https://docs.expo.dev/guides/typescript/)

## Firebase Configuration & Crash Prevention

> [!CAUTION]
> **Critical — Missing Keys Cause Startup Crashes**:
> The frontend relies on the Firebase Client SDK (`firebase/app`, `firebase/auth`) for authentication. If the Firebase configuration is missing or incomplete at compile time, `initializeAuth()` will throw an uncaught `FirebaseError: (auth/invalid-api-key)` error during startup, causing the standalone APK to **crash immediately upon launch**.

### Environment Variables (`.env`):
```env
EXPO_PUBLIC_API_BASE_URL=https://personalfinancegx-cgctcugsgtfgfpew.eastus2-01.azurewebsites.net/api
EXPO_PUBLIC_FIREBASE_API_KEY=your_firebase_api_key
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
EXPO_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.firebasestorage.app
EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
EXPO_PUBLIC_FIREBASE_APP_ID=your_app_id
EXPO_PUBLIC_FIREBASE_MEASUREMENT_ID=your_measurement_id
```

### Why are these keys needed in builds?
- In Expo / React Native, environment variables prefixed with `EXPO_PUBLIC_` are **inlined into the JavaScript bundle at compile time**.
- In cloud builds (EAS Build), local `.env` is excluded because it is in `.gitignore`.
- If not provided to EAS Build, the compiler inlines empty strings (`""`), causing the fatal `auth/invalid-api-key` crash.

### How this is handled in the project:
1. **`eas.json`**: The `env` block is defined under `preview` and `development` profiles so cloud builds have the configuration embedded.
2. **`src/constants/config.ts`**: Fallback client values are provided so the app never initializes with empty credentials.
3. **`src/services/auth.ts`**: `initializeApp` and `initializeAuth` are wrapped in defensive `try / catch` blocks to prevent uncaught runtime exceptions during app boot.

### Security Clarification
- **Firebase Client Keys are NOT Secret**: In Firebase architecture, client identifiers (`apiKey`, `projectId`, `appId`) are public values embedded into client bundles by design. They identify the client to Google services.
- **Backend Security**: Real secrets (Azure Function keys, Cosmos DB connection strings, and Firebase Admin SDK credentials) reside **only** in the backend Azure Function App (`personalFinanceGX`) and are never exposed to the frontend.

## Building Standalone APK (EAS Build)

To build a standalone installable `.apk` for Android:
```bash
npx eas-cli build --platform android --profile preview
```
Once the cloud build finishes, scan the QR code or open the download URL to install the `.apk` on your device.

