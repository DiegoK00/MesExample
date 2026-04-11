# Comandi di Avvio

## API (.NET)

```bash
cd C:/Personal/Workspace/MesClaude/api
dotnet run

# Test unitari
cd C:/Personal/Workspace/MesClaude/Api_Test
dotnet test

# Test E2E (WebApplicationFactory)
cd C:/Personal/Workspace/MesClaude/Api_E2E
dotnet test

# Test E2E (Playwright + Kestrel reale)
cd C:/Personal/Workspace/MesClaude/Api_Playwright
dotnet test
```

---

## Web (Angular)

```bash
cd C:/Personal/Workspace/MesClaude/web

# Avvio dev server
npx ng serve

# Test unitari
npx ng test --watch=false --browsers=ChromeHeadless

# Test E2E Playwright
npm run e2e

# Report HTML dopo E2E
npm run e2e:report
```

---

## Mobile (Flutter)

```bash
cd C:/Personal/Workspace/MesClaude/mobile

# Installazione dipendenze
flutter pub get
flutter pub run build_runner build --delete-conflicting-outputs

# Avvio DEV — Android emulator
flutter run --dart-define-from-file=config/env.dev.android.json

# Avvio DEV — iOS simulator
flutter run --dart-define-from-file=config/env.dev.ios.json

# Avvio senza file (usa default: Android emulator http://10.0.2.2:5260)
flutter run

# Build RELEASE produzione
flutter build apk --dart-define-from-file=config/env.prod.json
flutter build ipa --dart-define-from-file=config/env.prod.json

# Test unitari e widget
flutter test

# Test E2E integration (richiede emulatore/device)
flutter test integration_test/app_test.dart

# Rigenera i mock mockito (dopo modifiche a @GenerateMocks)
flutter pub run build_runner build --delete-conflicting-outputs
```

> Le configurazioni VS Code sono in `mobile/.vscode/launch.json` (Dev Android, Dev iOS, Prod Release).
