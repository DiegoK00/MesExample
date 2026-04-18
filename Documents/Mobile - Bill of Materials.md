# Mobile - Gestione Bill of Materials (Flutter)

## Stato complessivo - 2026-04-17

| Componente | Stato | Note |
|------------|-------|------|
| Modello `BillOfMaterialResponse` | ✅ Implementato | `article_models.dart` |
| Modelli `CreateBillOfMaterialRequest` / `UpdateBillOfMaterialRequest` | ✅ Implementati | `article_models.dart` |
| `BillOfMaterialsService.getByParentArticle()` | ✅ Implementato | GET lista BOM |
| `BillOfMaterialsService.get()` | ✅ Implementato | GET singolo componente |
| `BillOfMaterialsService.create()` | ✅ Implementato | POST create |
| `BillOfMaterialsService.update()` | ✅ Implementato | PUT update |
| `BillOfMaterialsService.delete()` | ✅ Implementato | DELETE |
| `AdminArticleBOMScreen` | ✅ Implementato | Lista, vuoto, errore, pull-to-refresh, FAB, edit, delete |
| Dialog `admin_article_bom_dialog.dart` | ✅ Implementato | Create + edit |
| Bottone `BOM` in `AdminArticlesScreen` | ✅ Implementato | `context.push('/admin/articles/$id/bom')` |
| Rotta `/admin/articles/:id/bom` | ✅ Implementata | `main.dart` |
| Provider `BillOfMaterialsService` | ✅ Implementato | `main.dart` |
| Widget test screen | ✅ Implementati | Include titolo, lista, vuoto, errore, FAB, edit, delete |
| Unit test service | ✅ Implementati | GET lista/vuota/errore rete/non-200 + create/update/delete (10 test) |
| Mock GET/POST/PUT/DELETE in `mock_client.dart` | ✅ Implementati | Supporto integration test |

---

## Cosa fa oggi il mobile

- Navigazione da `AdminArticlesScreen` alla distinta base dell'articolo padre
- Caricamento codice articolo padre per l'AppBar
- Lista componenti BOM con quantità, UM e scarti
- Creazione nuovo componente tramite dialog
- Modifica componente esistente tramite dialog
- Eliminazione con conferma e feedback via SnackBar
- Refresh manuale della lista

## Regole di accesso

- Lettura BOM: consentita a qualsiasi utente autenticato lato API
- Modifica BOM (`create`, `update`, `delete`): consentita solo a `Admin` e `SuperAdmin` lato API
- La UI mobile che modifica la BOM resta nel flusso admin

---

## Route

Registrata in `main.dart`:

```dart
GoRoute(
  path: '/admin/articles/:id/bom',
  builder: (_, state) => AdminArticleBOMScreen(
    articleId: int.parse(state.pathParameters['id']!),
  ),
),
```

---

## Service

File: `mobile/lib/core/services/bill_of_materials_service.dart`

Metodi disponibili:

```dart
Future<List<BillOfMaterialResponse>> getByParentArticle(int parentArticleId)
Future<BillOfMaterialResponse> get(int parentArticleId, int componentArticleId)
Future<BillOfMaterialResponse> create(CreateBillOfMaterialRequest request)
Future<BillOfMaterialResponse> update(int parentArticleId, int componentArticleId, UpdateBillOfMaterialRequest request)
Future<void> delete(int parentArticleId, int componentArticleId)
```

---

## UI

### `AdminArticleBOMScreen`

- AppBar con titolo `Bill of Materials - {ArticleCode}`
- `FutureBuilder` per caricare articolo padre + lista BOM
- `FloatingActionButton` per create
- Azioni `edit` e `delete` per ogni componente
- Stato vuoto: `Nessun componente trovato per questo articolo.`
- Stato errore: `Errore nel caricamento dei componenti`

### `AdminArticleBOMDialog`

- Modalità create e edit
- Campi:
  - Articolo Componente
  - Quantita
  - Tipo Quantita
  - Unita di Misura
  - Scarto Percentuale
  - Scarto Fattore
  - Scarto Fisso
- In edit il componente è bloccato

---

## Test

### Unit test service

File: `mobile/test/bill_of_materials_service_test.dart`

Copertura attuale (10 test):

- `getByParentArticle` -> lista deserializzata
- `getByParentArticle` -> lista vuota
- `getByParentArticle` -> `NetworkException`
- `getByParentArticle` -> risposta non 200
- `create` -> BOM deserializzata su 201
- `create` -> eccezione con messaggio su risposta non 200/201
- `update` -> BOM aggiornata su 200
- `update` -> eccezione su risposta non 200
- `delete` -> completa senza eccezione su 204
- `delete` -> eccezione con messaggio su risposta non 204

### Widget test screen

File: `mobile/test/admin_article_bom_screen_test.dart`

Copertura attuale:

- AppBar mostra codice articolo padre
- Lista mostra codice/nome/quantita/scarto
- Stato vuoto
- Stato errore
- FAB apre dialog creazione
- Edit apre dialog precompilato
- Delete mostra conferma e chiama il service

---

## Mock integration

File: `mobile/integration_test/helpers/mock_client.dart`

Endpoint BOM mockati:

- `GET /bill-of-materials/by-parent/{id}`
- `POST /bill-of-materials`
- `PUT /bill-of-materials/{parent}/{component}`
- `DELETE /bill-of-materials/{parent}/{component}`
- `GET /articles/{id}` per il titolo AppBar

---

## Integration test E2E

File: `mobile/integration_test/bom_flow_test.dart`

Copertura (7 test):

- `bom_navigate` — tap BOM su ART001 apre AdminArticleBOMScreen
- `bom_title` — AppBar mostra il codice articolo padre (ART001)
- `bom_list` — componente visibile con codice, nome, quantità e scarto
- `bom_fab` — FAB apre dialog "Aggiungi Componente" con campi corretti
- `bom_edit` — tap Modifica apre dialog precompilato con quantità e scarto
- `bom_delete_cancel` — tap Annulla mantiene il componente in lista
- `bom_delete_confirm` — conferma elimina mostra snackbar "Componente eliminato"
- `bom_back` — back button torna alla lista articoli

Esecuzione: `flutter test integration_test/bom_flow_test.dart` (richiede emulatore/device).

---

## Residuo

- Nessuno — implementazione e test completi
