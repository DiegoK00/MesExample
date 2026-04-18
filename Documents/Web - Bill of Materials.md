# Web — Gestione Bill of Materials (Angular 19)

## Routes aggiunte (`admin.routes.ts`)

```
/admin/articles/:parentArticleId/bom  → BillOfMaterialsComponent
```

Protetta dal guard admin (`adminGuard`).

> **Nota**: Il parametro di rotta deve chiamarsi `:parentArticleId` (non `:id`) per corrispondere all'input signal `parentArticleId = input.required<number>()` del componente. Con `withComponentInputBinding()` il binding avviene per nome esatto — un mismatch causa la mancata ricezione del valore.

---

## Components

### BillOfMaterialsComponent

**Path**: `features/admin/bill-of-materials/bill-of-materials.component.ts`

**Input signals**:
- `parentArticleId: number` (richiesto) — Articolo padre, estratto dalla rotta

**Features**:
- Carica articolo padre e lista BOM via `forkJoin`
- Tabella con colonne: Codice Componente, Nome, Quantità (con tipo e UM), Scarto, Azioni
- FAB (Floating Action Button) → apre dialog per creare nuovo componente
- Bottone "Modifica" (matita) → pre-popola dialog con i dati
- Bottone "Elimina" (cestino) → soft delete con conferma
- Bottone "Indietro" → torna alla lista articoli
- Chip per visualizzare tipo quantità (PHYSICAL/PERCENTAGE) e UM
- Gestione scarto a display: percentuale, fattore, fisso

**Dialogs**:
- `BillOfMaterialDialogComponent` per create/edit

---

### BillOfMaterialDialogComponent

**Path**: `features/admin/bill-of-materials/bill-of-material-dialog.component.ts`

**Dialog data**:
```typescript
{
  parentArticleId: number;
  bom?: BillOfMaterialResponse;  // Se presente, è edit instead create
}
```

> **Nota**: Il dato di dialogo viene iniettato con `data = inject<DialogData>(MAT_DIALOG_DATA)` (funzione `inject()`). **Non usare** `@Inject(MAT_DIALOG_DATA) data!: DialogData` come property decorator — funziona in TestBed ma non nel runtime Angular reale tramite `MatDialog.open()`, lasciando `data` undefined e causando crash nel template.

**Form fields**:
- **Articolo Componente** (dropdown) — Lista articoli (esclude padre)
  - Disabilitato dopo creazione per preservare la chiave primaria
- **Quantità** (number) — Step 0.0001, min 0.0001
- **Tipo Quantità** (select) — PHYSICAL o PERCENTAGE
- **Unità di Misura** (select) — Carica via `MeasureUnitsService`
- **Scarto Percentuale** (number) — 0-100, step 0.01
- **Scarto Fattore** (number) — 0-1, step 0.0001
- **Scarto Fisso** (number) — min 0, step 0.0001

**Validazioni**:
- Articolo componente: required
- Quantità: required, min 0.0001
- Tipo quantità: required
- UM: required
- Scarto campi: range validation

---

## Services

### BillOfMaterialsService

**Metodi**:
- `getByParentArticle(parentArticleId)` → Observable<BillOfMaterialResponse[]>
- `get(parentArticleId, componentArticleId)` → Observable<BillOfMaterialResponse>
- `create(request)` → Observable<BillOfMaterialResponse>
- `update(parentArticleId, componentArticleId, request)` → Observable<BillOfMaterialResponse>
- `delete(parentArticleId, componentArticleId)` → Observable<void>

---

## Models (`core/models/article.models.ts`)

### BillOfMaterialResponse
Risposta con dati completi di BOM (codici e nomi articoli, UM, etc.).

### CreateBillOfMaterialRequest
Richiesta per creare BOM (solo scrap opzionali con default 0).

### UpdateBillOfMaterialRequest
Richiesta per aggiornare BOM (non contiene le chiavi).

---

## Routes Updates

### articles.component.ts

Aggiunto:
- Import di `Router`
- Bottone "Build" (icona build) nella colonna Actions → naviga a `/admin/articles/:id/bom`
- Metodo `viewBOM(article)` per navigare

---

## Integrazione nel Layout Admin

Il BOM é accessibile dalla lista articoli tramite il bottone Build nella colonna Actions. Non è necessario aggiungere un nav item separato (viene raggiunto dalla lista articoli).

---

## Test (`bill-of-materials.component.spec.ts`) — 25 test

| Gruppo | Test | Cosa verifica |
|--------|------|---------------|
| Component initialization | 3 | creazione componente, caricamento dati all'init, codice articolo padre nell'header |
| Data loading | 8 | spinner di caricamento, tabella dopo load, 2 righe BOM, codice componente, nome componente, tipo quantità (PHYSICAL/PERCENTAGE), UM, messaggio "Nessun componente trovato" |
| Scrap display | 3 | scrap percentage (es: "10%"), scrap factor (prefisso "F:"), trattino ("—") quando tutti gli scarti sono 0 |
| Dialog interactions | 5 | openCreateDialog() apre dialog senza BOM, openEditDialog() apre dialog con BOM, snackbar "Componente aggiunto" dopo create, snackbar "Componente aggiornato" dopo edit, ricarica dati dopo dialog |
| Delete functionality | 4 | nessuna chiamata senza conferma, delete() dopo conferma, snackbar "Componente eliminato", snackbar di errore da API |
| Navigation | 1 | goBack() naviga a `/admin/articles` |
| Error handling | 1 | snackbar "Errore nel caricamento" se forkJoin fallisce |
| Column structure | 1 | columns = `['componentCode', 'componentName', 'quantity', 'scrap', 'actions']` |
