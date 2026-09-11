# Personal Finance App API (Azure Functions)

This project provides a robust backend API for a personal finance application. It is built using **Python on Azure Functions** and integrates with **Firebase** for both Authentication and Database (Firestore) operations.

## Architecture & Design Pattern

The application follows an **N-Tier Layered Architecture** to enforce separation of concerns, improve maintainability, and ensure scalability. 

The core layers are:

1. **API Layer (`API/`)**: 
   - Acts as the presentation tier for HTTP requests.
   - Responsible for authenticating users (via bearer tokens), parsing HTTP payloads into API Models (`Common/Models/`), converting them into Data Transfer Objects (DTOs), and returning appropriate HTTP responses.
   - Example components: `expenses_controller.py`, `user_registration_controller.py`.

2. **Business Logic Layer (`BL/`)**:
   - Contains the core domain logic and rules (e.g., verifying tokens via Firebase Admin SDK).
   - Receives DTOs from the API layer, applies business rules, and interacts with the Data Access Layer using Transfer Object Assemblers (TOA) to map DTOs to Database Entities.
   - Example components: `expense_service.py`, `fixed_expense_service.py`.

3. **Data Access Layer (`DL/`)**:
   - Responsible for direct communication with the database (Firestore).
   - Uses Data Access Objects (DAOs) to perform CRUD operations.
   - Defines `Entities` which are objects directly mapping to the database schema.
   - Example components: `expense_dao.py`, `expense_entity.py`.

4. **Common Layer (`Common/`)**:
   - Contains cross-cutting concerns, utilities, shared models, and configuration.
   - Example components: `firebase_config.py`, DTOs/ApiModels representing data structures.

## Core Components Overview

- **User Registration**: `API/user_registration_controller.py` creates users in Firebase Auth, creates custom tokens, and sends verification emails.
- **User Profile Management**: CRUD operations for the user profile (`user_profile_controller.py`, `user_profile_service.py`, `user_profile_dao.py`).
- **Expenses Management**: CRUD operations for variable expenses (`expenses_controller.py`, `expense_service.py`, `expense_dao.py`).
- **Fixed Expenses Management**: CRUD operations for recurring/fixed expenses (`fixed_expenses_controller.py`, `fixed_expense_service.py`, `fixed_expense_dao.py`).
- **Authentication**: Bearer tokens from Firebase Auth are intercepted in the Controllers and validated by the Services using the Firebase Admin SDK.

## Setup & Local Development

### Prerequisites

- Python 3.9, 3.10, or 3.11.
- Azure Functions Core Tools installed.
- A Firebase project with Firestore and Authentication enabled.
- A Firebase Admin SDK Service Account JSON key (e.g., `personalfinance-a0728-firebase-adminsdk-vr1aa-826b24ddc7.json`).

### Running Locally

1. Create a Python virtual environment and activate it:
   ```bash
   python -m venv .venv
   .venv\Scripts\activate # On Windows
   ```

2. Install the dependencies:
   ```bash
   pip install -r requirements.txt
   ```

3. Configure local settings:
   Ensure `local.settings.json` exists and is properly configured for Azure Functions local runtime. **Crucially, you must add `FIREBASE_API_KEY` to this file** for user registration to work:
   ```json
   {
     "IsEncrypted": false,
     "Values": {
       "AzureWebJobsStorage": "",
       "FUNCTIONS_WORKER_RUNTIME": "python",
       "FIREBASE_API_KEY": "YOUR_FIREBASE_WEB_API_KEY_HERE"
     }
   }
   ```

4. Ensure your Firebase Service Account JSON file is at the root of the project (as defined in `Common/firebase_config.py`).

### Deployment Configuration (Azure Portal)

> [!NOTE]
> **Authentication Level**: The ASGI function app is configured with `func.AuthLevel.ANONYMOUS` in [function_app.py](file:///c:/Users/gurua/Documents/Repositories/personal-finance-gx/function_app.py). This allows client applications (mobile and web frontends) to connect directly. Security is enforced inside the application controllers by verifying the client's Firebase Bearer Token on every authenticated endpoint, bypassing the need for a system-level Azure Function Key.

When deploying this function to Azure, you **must** configure the same environment variables in the cloud:
1. Go to your Function App in the Azure Portal.
2. Navigate to **Settings > Environment variables** (or **Configuration**).
3. Add a new application setting:
   - **Name:** `FIREBASE_API_KEY`
   - **Value:** `YOUR_FIREBASE_WEB_API_KEY_HERE`
4. Click **Apply/Save**. If you skip this step, features like User Registration (which require the Identity Toolkit API) will fail with "Error signing in with custom token".

5. Run the application:
   ```bash
   func start
   ```

## Testing

The project includes a suite of tests utilizing `pytest`. 

### Prerequisites for Testing
Ensure test requirements are installed:
```bash
pip install -r tests/requirements-test.txt
```

### Unit Tests
Unit tests run in isolation without connecting to actual Firebase services by mocking the DAOs, Services, and Authentication logic.

To run unit tests:
```bash
pytest tests/unit/
```

### API Integration Tests
API tests perform actual HTTP requests against the endpoints. The test suite is now fully automated and will dynamically create a test user in Firebase, obtain an ID token, run the tests, and then securely delete the user upon completion.

**Requirement:** You must set the `FIREBASE_API_KEY` environment variable before running the tests. You can find this key in your Firebase Console -> Project Settings -> General -> Web API Key.

To run local API tests (Make sure `func start` is running in another terminal):
```powershell
# Provide your Firebase Web API Key
$env:FIREBASE_API_KEY="your_firebase_web_api_key_here"

pytest tests/api/ --env=local
```

### Running Online API Tests

When running tests against your deployed Azure Function (`personalfinancegx-cgctcugsgtfgfpew.eastus2-01.azurewebsites.net`), you must also provide your **Azure Function Key** so the tests can bypass the `AuthLevel.FUNCTION` security.

**How to get the Azure Function Key:**
1. Go to your Function App in the Azure Portal.
2. In the left menu, click **App keys**.
3. Under "Host keys", copy the value of the `default` key (or the `master` key).

```powershell
$env:FIREBASE_API_KEY="your_firebase_web_api_key_here"
$env:AZURE_FUNCTION_KEY="your_azure_function_key_here"

pytest tests/api/ --env=online -s
```

---

## Frontend & Mobile App Configuration

The mobile frontend is built with **Expo (React Native)** located in the `frontend/` directory.

### Firebase Client Configuration & Crash Prevention

> [!CAUTION]
> **Critical Requirement — Missing Keys Cause Startup Crashes**:
> The frontend relies on the Firebase Client SDK (`firebase/app`, `firebase/auth`) to manage user authentication and session tokens. If the Firebase configuration is missing or incomplete at build time, `initializeAuth()` will throw an uncaught `FirebaseError: (auth/invalid-api-key)` error during startup, causing the standalone APK to **crash immediately upon launch**.

#### Security Policy: NEVER Commit API Keys to Git
> [!WARNING]
> **Zero-Commit Policy for API Keys**:
> Under NO circumstances should any API key (`AIzaSy...`) be committed or pushed to the remote Git repository. Committing API keys triggers GitHub secret scanning blocks, creates security vulnerabilities, and exposes project quotas to scrapers.
> 
> - **Never hardcode keys** in `eas.json`, `config.ts`, or any other tracked file.
> - **Local Development**: Stored only in `frontend/.env` and `local.settings.json` (both are strictly ignored by `.gitignore`).
> - **EAS Cloud Builds**: Injected securely via **EAS Environment Variables** (`eas env:set`) or the Expo Dashboard under Project Settings -> Environment Variables. The key is injected into the build container during compilation without ever touching Git.
> - **Backend Services**: Configured in Azure Function App application settings (`FIREBASE_API_KEY`) on `personalFinanceGX`.

#### Required Environment Variables (`frontend/.env`):
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

#### Why are these keys needed in builds?
- In Expo / React Native, environment variables prefixed with `EXPO_PUBLIC_` are **inlined into the JavaScript bundle at compile time**.
- When building in the cloud using **EAS Build** (`npx eas-cli build`), the local `.env` file is excluded because it is listed in `.gitignore`.
- If the environment variables are not provided to EAS Build, the compiler inlines empty strings (`""`), which leads to the fatal `auth/invalid-api-key` crash when the APK is launched on a physical device.

#### How this is handled securely:
1. **EAS Environment Variables**: The key is stored in EAS Cloud (`eas env:set preview --name EXPO_PUBLIC_FIREBASE_API_KEY --visibility sensitive`). EAS injects it at build time.
2. **`frontend/eas.json`**: Contains only non-secret project identifiers; sensitive API keys are omitted from `eas.json` so no secrets are committed to Git.
3. **`frontend/src/constants/config.ts`**: Reads from `process.env.EXPO_PUBLIC_FIREBASE_API_KEY` without hardcoded fallback secrets.
4. **`frontend/src/services/auth.ts`**: `initializeApp` and `initializeAuth` are wrapped in defensive `try / catch` blocks to prevent uncaught runtime exceptions during app boot.

#### Security Clarification & Assessment for Developers
- **Firebase Client Keys vs. Backend Secrets**: Firebase client API keys (`apiKey`) are client-side project identifiers, not administrative secrets. When bundled into an APK, any client-side key can be extracted via reverse engineering.
- **Is building with this API key secure?**: Yes, **provided that**:
  1. **Google Cloud Restrictions**: Restrict the API key in the [Google Cloud Console](https://console.cloud.google.com/apis/credentials) to the Android package `com.personalfinance.gx` and its release SHA-1 signing fingerprint.
  2. **Firebase Security Rules**: All database and storage operations must enforce strict authentication rules. Never rely on API key secrecy for authorization.
  3. **Backend Isolation**: Real secrets (Azure Function master keys, Cosmos DB credentials, Firebase Admin SDK service account JSON) reside **only** in the backend Azure Function App (`personalFinanceGX`) and are never exposed to the frontend.

### Building the Mobile App (Android APK)

To build a standalone installable `.apk` for Android using EAS Build (no Android Studio required):
```bash
cd frontend
npx eas-cli build --platform android --profile preview
```
Once the cloud build finishes, scan the QR code or click the download link to install the `.apk` on your Android device.

