# API - Gestione Articoli

## Tabelle introdotte

| Tabella | Descrizione |
|---------|-------------|
| `Categories` | Categorie degli articoli |
| `MeasureUnits` | Unità di misura (UM e UM2) |
| `Articles` | Anagrafica articoli |

---

## Categorie — `/categories`

| Metodo | Route | Descrizione | Ruoli |
|--------|-------|-------------|-------|
| GET | `/categories` | Lista tutte le categorie | Qualsiasi autenticato |
| GET | `/categories/{id}` | Dettaglio categoria | Qualsiasi autenticato |
| POST | `/categories` | Crea categoria | Qualsiasi autenticato |
| PUT | `/categories/{id}` | Aggiorna categoria | SuperAdmin, Admin, Configurator |
| DELETE | `/categories/{id}` | Elimina categoria | SuperAdmin, Admin, Configurator |

> DELETE fallisce con `400` se la categoria è associata a uno o più articoli.

---

## Unità di Misura — `/measure-units`

| Metodo | Route | Descrizione | Ruoli |
|--------|-------|-------------|-------|
| GET | `/measure-units` | Lista tutte le UM | Qualsiasi autenticato |
| GET | `/measure-units/{id}` | Dettaglio UM | Qualsiasi autenticato |
| POST | `/measure-units` | Crea UM | Qualsiasi autenticato |
| PUT | `/measure-units/{id}` | Aggiorna UM | SuperAdmin, Admin, Configurator |
| DELETE | `/measure-units/{id}` | Elimina UM | SuperAdmin, Admin, Configurator |

> DELETE fallisce con `400` se la UM è usata come UM o UM2 in uno o più articoli.

---

## Articoli — `/articles`

| Metodo | Route | Descrizione | Ruoli |
|--------|-------|-------------|-------|
| GET | `/articles` | Lista articoli | Qualsiasi autenticato |
| GET | `/articles/{id}` | Dettaglio articolo | Qualsiasi autenticato |
| POST | `/articles` | Crea articolo | SuperAdmin, Admin |
| PUT | `/articles/{id}` | Aggiorna articolo | SuperAdmin, Admin |
| DELETE | `/articles/{id}` | Soft delete articolo | SuperAdmin, Admin |

**Query params GET /articles:**

| Param | Note |
|-------|------|
| `activeOnly` | Se `true`, restituisce solo gli articoli attivi |

---

## POST /articles — Body

```json
{
  "code": "ART001",
  "name": "T-Shirt Bianca",
  "description": "T-shirt in cotone",
  "categoryId": 1,
  "price": 19.99,
  "umId": 1,
  "um2Id": null,
  "measures": "S / M / L / XL",
  "composition": "Cotton 70% Elastane 30%"
}
```

- `code`: univoco — **409 Conflict** se già in uso
- `categoryId`: deve esistere — **409 Conflict** se non trovata
- `umId`: deve esistere — **409 Conflict** se non trovata
- `um2Id`: opzionale

**Risposta 201** con `Location: /articles/{id}`.

---

## PUT /articles/{id} — Body

```json
{
  "name": "T-Shirt Bianca Updated",
  "description": "...",
  "categoryId": 1,
  "price": 24.99,
  "umId": 1,
  "um2Id": null,
  "measures": "S / M / L",
  "composition": "Cotton 100%",
  "isActive": true
}
```

> Il `code` non è modificabile dopo la creazione.

---

## DELETE /articles/{id} — Soft Delete

La DELETE non elimina fisicamente il record ma imposta:
- `IsActive = false`
- `DeletedAt = DateTime.UtcNow`
- `DeletedFrom = userId corrente (dal JWT)`

---

## ArticleResponse

```json
{
  "id": 1,
  "code": "ART001",
  "name": "T-Shirt Bianca",
  "description": "T-shirt in cotone",
  "categoryId": 1,
  "categoryName": "Abbigliamento",
  "price": 19.99,
  "umId": 1,
  "umName": "PZ",
  "um2Id": null,
  "um2Name": null,
  "measures": "S / M / L / XL",
  "composition": "Cotton 70% Elastane 30%",
  "isActive": true,
  "createdAt": "2026-04-11T14:57:10Z",
  "createdByUsername": "admin",
  "deletedAt": null,
  "deletedByUsername": null
}
```

---

## Modello Article — Campi

| Campo | Tipo | Note |
|-------|------|------|
| `Id` | int | PK |
| `Code` | string (50) | Univoco |
| `Name` | string (200) | Obbligatorio |
| `Description` | string? (1000) | Opzionale |
| `CategoryId` | int | FK → Categories |
| `Price` | decimal(18,2) | Obbligatorio |
| `UMId` | int | FK → MeasureUnits |
| `UM2Id` | int? | FK → MeasureUnits, opzionale |
| `Measures` | string? (100) | Testo libero |
| `Composition` | string? (500) | Es. "Cotton 70% Elastane 30%" |
| `IsActive` | bool | True = attivo |
| `CreatedAt` | DateTime | Timestamp creazione |
| `CreatedFrom` | int | FK → Users |
| `DeletedAt` | DateTime? | Soft delete timestamp |
| `DeletedFrom` | int? | FK → Users |
