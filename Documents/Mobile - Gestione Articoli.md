# Mobile — Gestione Articoli (Flutter)

## Route aggiunte (`main.dart`)

```
/admin/articles       → AdminArticlesScreen
/admin/categories     → AdminCategoriesScreen
/admin/measure-units  → AdminMeasureUnitsScreen
```

Tutte protette dal redirect admin esistente (loginArea == 1).

## Nav Cards aggiunte (AdminHomeScreen)

| Titolo | Icona | Route |
|--------|-------|-------|
| Articoli | `inventory_2` | `/admin/articles` |
| Categorie | `category` | `/admin/categories` |
| Unità di Misura | `straighten` | `/admin/measure-units` |

---

## AdminCategoriesScreen (`features/admin/categories/`)

- Lista categorie con `FutureBuilder` + `RefreshIndicator`
- **FAB** → apre `showModalBottomSheet` per creare
- **Edit** (icona matita) → stesso bottom sheet pre-popolato
- **Delete** (icona cestino) → `showDialog` di conferma → `DELETE /categories/{id}`
- Errori API mostrati nello sheet con testo rosso

---

## AdminMeasureUnitsScreen (`features/admin/measure_units/`)

- Stesso pattern di CategoriesScreen
- Nome mostrato in stile monospace
- **FAB** → bottom sheet create/edit
- **Delete** → dialog conferma → `DELETE /measure-units/{id}`

---

## AdminArticlesScreen + AdminArticleFormScreen (`features/admin/articles/`)

### AdminArticlesScreen (lista)
- Toggle **"Solo attivi"** in AppBar (Switch) → `activeOnly=true`
- **FAB** → push `AdminArticleFormScreen` (crea)
- Card articolo con: codice, nome, badge stato, chip categoria/prezzo/UM
- **Modifica** → push `AdminArticleFormScreen` (edit pre-popolato)
- **Disattiva** (visibile solo se `isActive`) → `showDialog` → soft delete

### AdminArticleFormScreen (form dedicato)
- Screen separato (troppi campi per un bottom sheet)
- Campi: Codice (solo crea), Nome, Descrizione, Categoria (`DropdownButtonFormField`), Prezzo, UM, UM2 (con opzione "—"), Misure, Composizione, Switch Attivo (solo edit)
- Carica categorie e UM via `CategoriesService` e `MeasureUnitsService` prima di mostrare il form
- Ritorna `true` al pop se salvato → la lista si ricarica

---

## Modello (`core/models/article_models.dart`)

| Classe | Uso |
|--------|-----|
| `CategoryResponse` | Risposta GET /categories |
| `MeasureUnitResponse` | Risposta GET /measure-units |
| `ArticleResponse` | Risposta GET /articles |

---

## Servizi (`core/services/`)

| Servizio | Metodi |
|---------|--------|
| `CategoriesService` | `getAll`, `create`, `update`, `delete` |
| `MeasureUnitsService` | `getAll`, `create`, `update`, `delete` |
| `ArticlesService` | `getAll`, `create`, `update`, `delete` |

Tutti registrati come `Provider.value` in `main.dart`.

---

## Test E2E — Integration Test (`integration_test/articles_flow_test.dart`)

**Ultimo aggiornamento:** 2026-04-12

| Test | Verifica |
|------|---------|
| `articles_navigate` | Tap card "Articoli" → apre AdminArticlesScreen |
| `articles_list` | Lista mostra codice, nome, badge Attivo/Inattivo per ogni articolo |
| `articles_list categoria/prezzo` | Card mostra nome categoria e prezzo formattato |
| `articles_list misure` | Chip "Misure" visibile quando presente |
| `articles_create` | Tap FAB → AdminArticleFormScreen in modalità creazione (campo Codice + pulsante "Crea Articolo") |
| `articles_create_validation` | Submit senza campi → "Codice obbligatorio" + "Nome obbligatorio" |
| `articles_edit` | Tap "Modifica" → form pre-popolato con codice non editabile + pulsante "Salva" |

**Mock dati:** `integration_test/helpers/mock_client.dart` aggiornato con:
- `/articles` → 2 articoli (ART001 attivo, ART002 inattivo)
- `/categories` → Abbigliamento, Accessori
- `/measure-units` → Pezzo, Metro

---

## Costanti API (`core/constants/api_constants.dart`)

```dart
static const String categories  = '$baseUrl/categories';
static const String measureUnits = '$baseUrl/measure-units';
static const String articles    = '$baseUrl/articles';
```
