# CI - Pipeline

Pipeline di Continuous Integration configurata in `.github/workflows/ci.yml`.
Si attiva automaticamente su ogni **push** e **pull request** verso `main`.

---

## Job overview

| Job | Cosa fa | Runner |
|-----|---------|--------|
| `api-test` | Unit test xUnit (123) + E2E WebApplicationFactory (38) | ubuntu-latest |
| `api-playwright` | Playwright HTTP reale su Kestrel in-process (77) | ubuntu-latest |
| `web-test` | Jasmine/Karma unit test + build Angular | ubuntu-latest |
| `web-playwright` | Playwright E2E Angular con `ng serve` (79 passed, 3 skipped) | ubuntu-latest |
| `mobile-test` | `flutter test` unit (123) + `flutter build apk --debug` | ubuntu-latest |

---

## Note tecniche

**API Playwright** — usa il dual-host pattern (`WebApplicationFactory` + Kestrel in-process su porta dinamica, InMemory database). Non richiede un server separato: `dotnet test` è sufficiente.

**Web Playwright** — i test usano `page.route()` per mockare tutte le chiamate API; non è necessaria un'istanza API reale o Docker. I 3 test skippati (`retry_logic`, `service_unavailable_503`, `timeout`) restano skippati intenzionalmente perché coprono funzionalità non implementate — non bloccano la pipeline.

**Mobile** — i `flutter test` (unit + widget) girano senza device. Il build APK debug verifica che il codice compili correttamente su CI.

**Mobile integration_test (emulatore) — NON incluso in CI.** I test in `integration_test/` richiedono un emulatore Android reale (`reactivecircus/android-emulator-runner`), che aumenta significativamente i tempi di CI (~10 min aggiuntivi). La scelta è stata di escluderli dalla pipeline automatica; vanno eseguiti manualmente su device/emulatore locale prima del merge.

---

## yml completo

```yaml
name: CI

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  api-test:
    name: API Tests
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v4

      - name: Setup .NET 10
        uses: actions/setup-dotnet@v4
        with:
          dotnet-version: "10.0.x"

      - name: Restore dependencies
        run: dotnet restore Api_Test/Api.Tests.csproj

      - name: Build
        run: dotnet build Api_Test/Api.Tests.csproj --no-restore --configuration Release

      - name: Run unit tests
        run: dotnet test Api_Test/Api.Tests.csproj --no-build --configuration Release --logger "console;verbosity=minimal"

      - name: Restore E2E dependencies
        run: dotnet restore Api_E2E/Api.E2E.csproj

      - name: Build E2E
        run: dotnet build Api_E2E/Api.E2E.csproj --no-restore --configuration Release

      - name: Run E2E tests
        run: dotnet test Api_E2E/Api.E2E.csproj --no-build --configuration Release --logger "console;verbosity=minimal"

  api-playwright:
    name: API Playwright Tests
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v4

      - name: Setup .NET 10
        uses: actions/setup-dotnet@v4
        with:
          dotnet-version: "10.0.x"

      - name: Restore dependencies
        run: dotnet restore Api_Playwright/Api.Playwright.csproj

      - name: Build
        run: dotnet build Api_Playwright/Api.Playwright.csproj --no-restore --configuration Release

      - name: Install Playwright browsers
        run: pwsh Api_Playwright/bin/Release/net10.0/playwright.ps1 install chromium --with-deps

      - name: Run Playwright tests
        run: dotnet test Api_Playwright/Api.Playwright.csproj --no-build --configuration Release --logger "console;verbosity=minimal"

  web-test:
    name: Web Tests
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js 20
        uses: actions/setup-node@v4
        with:
          node-version: "20"
          cache: "npm"
          cache-dependency-path: web/package-lock.json

      - name: Install dependencies
        run: npm ci
        working-directory: web

      - name: Run unit tests
        run: npx ng test --watch=false --browsers=ChromeHeadless
        working-directory: web

      - name: Build
        run: npm run build
        working-directory: web

  web-playwright:
    name: Web Playwright E2E
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js 20
        uses: actions/setup-node@v4
        with:
          node-version: "20"
          cache: "npm"
          cache-dependency-path: web/package-lock.json

      - name: Install dependencies
        run: npm ci
        working-directory: web

      - name: Install Playwright browsers
        run: npx playwright install chromium --with-deps
        working-directory: web

      - name: Run Playwright E2E tests
        run: npx playwright test
        working-directory: web

  mobile-test:
    name: Mobile Flutter Tests
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v4

      - name: Setup Flutter
        uses: subosito/flutter-action@v2
        with:
          flutter-version: "3.x"
          channel: "stable"

      - name: Install dependencies
        run: flutter pub get
        working-directory: mobile

      - name: Run unit tests
        run: flutter test
        working-directory: mobile

      - name: Build APK (debug)
        run: flutter build apk --debug
        working-directory: mobile
```
