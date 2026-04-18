# Web — Gestione Articoli (Backoffice)

## Routing aggiunto (`features/admin/admin.routes.ts`)

```
/admin/articles       → ArticlesComponent
/admin/categories     → CategoriesComponent
/admin/measure-units  → MeasureUnitsComponent
```

Tutte protette da `adminGuard`.

---

## Nav items aggiunti (AdminLayoutComponent)

| Label | Icon | Route |
|-------|------|-------|
| Articoli | `inventory_2` | `/admin/articles` |
| Categorie | `category` | `/admin/categories` |
| Unità di Misura | `straighten` | `/admin/measure-units` |

---

## CategoriesComponent (`features/admin/categories/`)

Tabella con colonne: **Nome**, Descrizione, Azioni.

- **Crea / Modifica**: `MatDialog` → `CategoryDialogComponent`
- **Elimina**: `DELETE /categories/{id}` + conferma — mostra errore API se la categoria ha articoli

**CategoryDialogComponent:**
- Campi: Nome (required), Descrizione (opzionale)
- Modalità crea e modifica unified (nessun campo readonly)

---

## MeasureUnitsComponent (`features/admin/measure-units/`)

Tabella con colonne: **Nome** (in `<code>`), Descrizione, Azioni.

- **Crea / Modifica**: `MatDialog` → `MeasureUnitDialogComponent`
- **Elimina**: `DELETE /measure-units/{id}` + conferma — mostra errore API se la UM è usata da articoli

**MeasureUnitDialogComponent:**
- Campi: Nome (required, placeholder "Es: PZ, KG, MT"), Descrizione (opzionale)

---

## ArticlesComponent (`features/admin/articles/`)

Tabella con colonne: **Codice**, Nome, Categoria, **Prezzo** (EUR), **UM / UM2**, Stato, Azioni.

- Toggle **"Solo attivi"** → `activeOnly=true`
- **Crea / Modifica**: `MatDialog` → `ArticleDialogComponent`
- **Disattiva** (soft delete): `DELETE /articles/{id}` + conferma — il pulsante elimina è visibile solo se `isActive`

**ArticleDialogComponent:**
- Carica categorie e UM in parallelo via `forkJoin` all'apertura
- Campi:
  - `code` (solo crea, required)
  - `name` (required)
  - `description` (opzionale, textarea)
  - `categoryId` → `mat-select` con lista categorie
  - `price` → input number, step 0.01
  - `umId` → `mat-select` UM
  - `um2Id` → `mat-select` UM opzionale (con opzione "—" per nessuna)
  - `measures` (opzionale, placeholder "Es: S / M / L / XL")
  - `composition` (opzionale, textarea, placeholder "Es: Cotton 70% Elastane 30%")
  - `isActive` → checkbox solo in modifica

---

## Servizi (`core/services/`)

| Servizio | Endpoint |
|---------|---------|
| `CategoriesService` | `GET/POST /categories`, `GET/PUT/DELETE /categories/{id}` |
| `MeasureUnitsService` | `GET/POST /measure-units`, `GET/PUT/DELETE /measure-units/{id}` |
| `ArticlesService` | `GET/POST /articles`, `GET/PUT/DELETE /articles/{id}` |

---

## Modelli (`core/models/article.models.ts`)

| Tipo | Uso |
|------|-----|
| `CategoryResponse` | Risposta GET categorie |
| `CreateCategoryRequest` / `UpdateCategoryRequest` | Body POST/PUT categorie |
| `MeasureUnitResponse` | Risposta GET unità di misura |
| `CreateMeasureUnitRequest` / `UpdateMeasureUnitRequest` | Body POST/PUT UM |
| `ArticleResponse` | Risposta GET articoli (include nomi categoria e UM) |
| `CreateArticleRequest` / `UpdateArticleRequest` | Body POST/PUT articoli |

---

## Ruolo Configurator

Aggiunto `{ id: 4, name: 'Configurator' }` nella lista `ALL_ROLES` di `UserDialogComponent`.
Permette di assegnare il ruolo Configurator agli utenti dal backoffice.

---

## Test

| File | Test | Cosa verifica |
|------|------|---------------|
| `categories.component.spec.ts` | 7 | colonne tabella, dati mock, ngOnInit, delete() con/senza conferma, openCreateDialog(), openEditDialog() |
| `measure-units.component.spec.ts` | 7 | colonne tabella, dati mock, ngOnInit, delete() con/senza conferma, openCreateDialog(), openEditDialog() |
| `article-dialog.component.spec.ts` | 17 | crea: titolo, campo codice, campi obbligatori, form invalido, create(); modifica: titolo, no codice, codice readonly, pre-popola nome/prezzo, update(), checkbox isActive, errore su create() fallito |
