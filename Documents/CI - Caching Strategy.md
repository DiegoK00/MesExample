# CI - Caching Strategy

Strategia di caching adottata nella pipeline GitHub Actions per ridurre i tempi di build.

---

## Stato attuale

| Job | Cache attiva | Meccanismo |
|-----|-------------|-----------|
| `api-build` | No | `dotnet restore` senza cache |
| `api-test` | No | `dotnet restore` senza cache |
| `api-playwright` | No | `dotnet restore` senza cache |
| `web-test` | Sì | `actions/setup-node` con `cache: "npm"` |
| `web-playwright` | Sì | `actions/setup-node` con `cache: "npm"` |
| `mobile-test` | No | `subosito/flutter-action` senza cache Flutter pub |

Il job web è l'unico con caching attiva. I job .NET e Flutter ripetono ogni volta `dotnet restore` e `flutter pub get` da zero.

---

## Cache npm (web) — attiva

```yaml
- name: Setup Node.js 20
  uses: actions/setup-node@v4
  with:
    node-version: "20"
    cache: "npm"
    cache-dependency-path: web/package-lock.json
```

`actions/setup-node` gestisce automaticamente la cache di `~/.npm` usando `package-lock.json` come chiave. Se il lockfile non cambia, `npm ci` recupera i pacchetti dalla cache senza scaricarli.

---

## Cache .NET — non attiva (valutazione)

Per aggiungere caching al restore NuGet si usa `actions/cache` manualmente:

```yaml
- name: Cache NuGet packages
  uses: actions/cache@v4
  with:
    path: ~/.nuget/packages
    key: ${{ runner.os }}-nuget-${{ hashFiles('**/*.csproj') }}
    restore-keys: |
      ${{ runner.os }}-nuget-
```

**Perché non è attiva**: i job API (`api-build`, `api-test`, `api-playwright`) eseguono `dotnet restore` su progetti diversi. Il beneficio è reale ma richiede di aggiungere lo step cache in tutti e tre i job o di estrarre un job di restore condiviso. Il runner ubuntu-latest ripristina i pacchetti NuGet abbastanza velocemente da NuGet.org (~20-30s) — il guadagno netto per un progetto di questa dimensione è limitato.

**Come abilitare** (aggiungere prima di ogni step `dotnet restore`):

```yaml
- name: Cache NuGet packages
  uses: actions/cache@v4
  with:
    path: ~/.nuget/packages
    key: ${{ runner.os }}-nuget-${{ hashFiles('**/*.csproj', '**/*.props') }}
    restore-keys: ${{ runner.os }}-nuget-
```

---

## Cache Flutter — non attiva (valutazione)

`subosito/flutter-action` supporta caching del SDK Flutter via parametro `cache: true`, ma non mette in cache i pacchetti Pub (`~/.pub-cache`):

```yaml
- name: Setup Flutter
  uses: subosito/flutter-action@v2
  with:
    flutter-version: "3.x"
    channel: "stable"
    cache: true   # cache del SDK Flutter — riduce download SDK
```

Per cacheare anche i pacchetti Pub:

```yaml
- name: Cache Pub packages
  uses: actions/cache@v4
  with:
    path: ~/.pub-cache
    key: ${{ runner.os }}-pub-${{ hashFiles('mobile/pubspec.lock') }}
    restore-keys: ${{ runner.os }}-pub-
```

---

## Playwright browser cache

I browser Chromium installati con `playwright install` non vengono cachati — vengono riscaricati ad ogni run. Per caching:

```yaml
- name: Cache Playwright browsers
  uses: actions/cache@v4
  with:
    path: ~/.cache/ms-playwright
    key: ${{ runner.os }}-playwright-${{ hashFiles('web/package-lock.json') }}
```

Lo step `npx playwright install chromium --with-deps` si può saltare se la cache è hit, ma richiede verifica che i browser siano già installati prima di tentare il salto.

---

## Regola generale per le chiavi di cache

| Tecnologia | File di lock usato come chiave |
|-----------|-------------------------------|
| npm | `package-lock.json` |
| NuGet | `**/*.csproj` + `**/*.props` |
| Pub (Flutter) | `pubspec.lock` |
| Playwright browsers | `package-lock.json` (versione Playwright) |

Usare sempre il file di lock, non `pubspec.yaml` o `package.json` — il lock garantisce dipendenze esatte e invalida la cache solo quando le versioni cambiano davvero.
