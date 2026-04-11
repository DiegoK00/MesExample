# Mobile — Preferenze Utente (SharedPreferences)

## Scopo

`shared_preferences` viene usato per persistere preferenze non sensibili tra le sessioni:

| Chiave | Tipo | Valore default | Descrizione |
|--------|------|----------------|-------------|
| `last_area` | `int` | `2` | Ultima area di login usata (1=Admin, 2=App) |
| `theme_mode` | `String` | — (= system) | Tema scelto: `'dark'` o `'light'` |

> Le credenziali e i token restano in `flutter_secure_storage` (cifratura OS).  
> `shared_preferences` è usato solo per dati non sensibili.

---

## PreferencesService (`core/services/preferences_service.dart`)

`ChangeNotifier` — esposto via `Provider` nel widget tree.

```dart
ThemeMode get themeMode   // ThemeMode.system | .light | .dark
int get lastArea          // 1 o 2

Future<void> init()                       // carica i valori salvati
Future<void> setThemeMode(ThemeMode mode) // salva + notifyListeners()
Future<void> setLastArea(int area)        // salva (no notify)
```

### Inizializzazione

In `main()`, `init()` viene chiamato in parallelo con `AuthService.init()` prima di `runApp`:

```dart
await Future.wait([auth.init(), prefs.init()]);
```

---

## Comportamenti implementati

### 1. Redirect al login dell'ultima area usata

Quando l'utente non è autenticato, `_initialLocation()` usa `prefs.lastArea` per scegliere la pagina di login:

```dart
return prefs.lastArea == 1 ? '/admin-login' : '/login';
```

`lastArea` viene aggiornato dopo ogni login andato a buon fine in `login_screen.dart`.

### 2. Tema dark/light

`MaterialApp.router` usa `themeMode: prefs.themeMode` — il widget tree si ricostruisce tramite `addListener(() => setState(() {}))` in `_MyAppState`.

Il toggle è disponibile nell'AppBar di `HomeScreen` e `AdminHomeScreen`:
- Icona `dark_mode` / `light_mode`
- Tooltip "Modalità scura" / "Modalità chiara"

---

## Test (`test/preferences_service_test.dart` — 9 test)

| Gruppo | Test | Cosa verifica |
|--------|------|---------------|
| `init` | 4 | default system+area2, carica dark, carica light, carica lastArea |
| `setThemeMode` | 3 | aggiorna valore, notifica listener, persiste 'dark', persiste 'light' |
| `setLastArea` | 2 | aggiorna in memoria, persiste in SharedPreferences |

Usa `SharedPreferences.setMockInitialValues({})` per isolare ogni test.
