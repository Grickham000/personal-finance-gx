# Project Rules

- The Azure Function App name is `personalFinanceGX`. When publishing or running deployment/azure operations, always use the name `personalFinanceGX`. Do not use any auto-inferred names or values found in config files.
- To publish mobile APK builds to Expo (EAS Build), run from `frontend/`:
  `npx eas-cli build --platform android --profile production --non-interactive --no-wait`
  (or `npm run build:production`). Do not run interactive prompts or wait synchronously. To check status, use `npx eas-cli build:list --limit 1` or `npx eas-cli build:view <BUILD_ID>`.

