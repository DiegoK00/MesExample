# API — Gestione Bill of Materials (BOM)

## Routes aggiunte (`BillOfMaterialsController`)

| Metodo | Endpoint | Protezione | Descrizione |
|--------|----------|-----------|-------------|
| GET | `/bill-of-materials/by-parent/{parentArticleId}` | Autenticato | Ottiene tutti i componenti di un articolo padre |
| GET | `/bill-of-materials/{parentArticleId}/{componentArticleId}` | Autenticato | Ottiene una relazione BOM specifica |
| POST | `/bill-of-materials` | Admin, SuperAdmin | Crea una nuova relazione BOM |
| PUT | `/bill-of-materials/{parentArticleId}/{componentArticleId}` | Admin, SuperAdmin | Aggiorna una relazione BOM |
| DELETE | `/bill-of-materials/{parentArticleId}/{componentArticleId}` | Admin, SuperAdmin | Elimina una relazione BOM |

---

## Endpoints

### GET `/bill-of-materials/by-parent/{parentArticleId}`

Ottiene tutti i componenti di un articolo padre.

**Response** (200 OK):
```json
[
  {
    "parentArticleId": 1,
    "parentArticleCode": "ART001",
    "parentArticleName": "Prodotto Finito",
    "componentArticleId": 2,
    "componentArticleCode": "COMP001",
    "componentArticleName": "Componente 1",
    "quantity": 5.0000,
    "quantityType": "PHYSICAL",
    "umId": 1,
    "umName": "PZ",
    "scrapPercentage": 2.50,
    "scrapFactor": 0.0250,
    "fixedScrap": 0.5000
  }
]
```

---

### GET `/bill-of-materials/{parentArticleId}/{componentArticleId}`

Ottiene una relazione BOM specifica.

**Response** (200 OK): Come il singolo elemento dell'array GET precedente

**Response** (404 Not Found): Se la relazione non esiste

---

### POST `/bill-of-materials`

Crea una nuova relazione BOM. Solo Admin e SuperAdmin.

**Request**:
```json
{
  "parentArticleId": 1,
  "componentArticleId": 2,
  "quantity": 5.0,
  "quantityType": "PHYSICAL",
  "umId": 1,
  "scrapPercentage": 2.50,
  "scrapFactor": 0.0250,
  "fixedScrap": 0.5
}
```

**Notes**:
- `parentArticleId` e `componentArticleId` devono essere diversi (un articolo non può essere componente di se stesso)
- `quantityType` deve essere `"PHYSICAL"` o `"PERCENTAGE"`
- `scrapPercentage`: percentuale di scarto (es: 5.00 per il 5%)
- `scrapFactor`: moltiplicatore di scarto (es: 0.05 per il 5%)
- `fixedScrap`: quantità fissa scartata (es: 0.5 kg)

**Response** (201 Created):
```json
{
  "parentArticleId": 1,
  "parentArticleCode": "ART001",
  "parentArticleName": "Prodotto Finito",
  "componentArticleId": 2,
  "componentArticleCode": "COMP001",
  "componentArticleName": "Componente 1",
  "quantity": 5.0000,
  "quantityType": "PHYSICAL",
  "umId": 1,
  "umName": "PZ",
  "scrapPercentage": 2.50,
  "scrapFactor": 0.0250,
  "fixedScrap": 0.5000
}
```

**Response** (409 Conflict): Se il componente è già associato al padre, oppure validazioni falliscono

---

### PUT `/bill-of-materials/{parentArticleId}/{componentArticleId}`

Aggiorna una relazione BOM. Solo Admin e SuperAdmin.

**Request**:
```json
{
  "quantity": 10.0,
  "quantityType": "PHYSICAL",
  "umId": 1,
  "scrapPercentage": 3.00,
  "scrapFactor": 0.0300,
  "fixedScrap": 1.0
}
```

**Response** (200 OK): Oggetto BillOfMaterialResponse aggiornato

**Response** (404 Not Found): Se la relazione non esiste

**Response** (409 Conflict): Se la validazione fallisce

---

### DELETE `/bill-of-materials/{parentArticleId}/{componentArticleId}`

Elimina una relazione BOM. Solo Admin e SuperAdmin.

**Response** (204 No Content): Eliminazione riuscita

**Response** (404 Not Found): Se la relazione non esiste

---

## Modello

### BillOfMaterial

| Colonna | Tipo | Note |
|---------|------|------|
| `ParentArticleId` | INT (FK) | Articolo padre (chiave primaria) |
| `ComponentArticleId` | INT (FK) | Articolo componente (chiave primaria) |
| `Quantity` | DECIMAL(18,4) | Quantità del componente |
| `QuantityType` | VARCHAR(20) | `'PHYSICAL'` o `'PERCENTAGE'` (vincolo CHECK) |
| `UmId` | INT (FK) | Unità di misura del componente |
| `ScrapPercentage` | DECIMAL(5,2) | Percentuale di scarto (default: 0) |
| `ScrapFactor` | DECIMAL(5,4) | Moltiplicatore di scarto (default: 0) |
| `FixedScrap` | DECIMAL(18,4) | Quantità fissa scartata (default: 0) |

**Chiave Primaria**: Composta da `(ParentArticleId, ComponentArticleId)`

**Vincoli**:
- CHECK: `QuantityType IN ('PHYSICAL', 'PERCENTAGE')`
- FK su `Article` (ParentArticleId) → DELETE RESTRICT
- FK su `Article` (ComponentArticleId) → DELETE RESTRICT
- FK su `MeasureUnit` (UmId) → DELETE RESTRICT

---

## Servizio (`BillOfMaterialService`)

| Metodo | Signature | Descrizione |
|--------|-----------|-------------|
| `GetByParentArticleAsync` | `(int parentArticleId)` → `List<BillOfMaterialResponse>` | Ottiene tutti i componenti di un articolo |
| `GetAsync` | `(int parentArticleId, int componentArticleId)` → `BillOfMaterialResponse?` | Ottiene una relazione specifica |
| `CreateAsync` | `(CreateBillOfMaterialRequest request, int createdByUserId)` → `(Data, Error)` | Crea una nuova relazione |
| `UpdateAsync` | `(int parentArticleId, int componentArticleId, UpdateBillOfMaterialRequest request)` → `(Data, Error)` | Aggiorna una relazione |
| `DeleteAsync` | `(int parentArticleId, int componentArticleId)` → `bool` | Elimina una relazione |

---

## DTOs

### `BillOfMaterialResponse`
Risposta quando si ottiene una relazione BOM con i dati delle tabelle correlate (nomi articoli, UM, ecc).

### `CreateBillOfMaterialRequest`
Richiesta per creare una nuova relazione BOM.

### `UpdateBillOfMaterialRequest`
Richiesta per aggiornare una relazione BOM (non ha ParentArticleId e ComponentArticleId perché già nella route).

---

## Nota sulla gestione dello scarto

Lo schema supporta tre modi di gestire lo scarto:

1. **ScrapPercentage**: Percentuale (es: 5% = 5.00)
2. **ScrapFactor**: Moltiplicatore decimale (es: 5% = 0.05)
3. **FixedScrap**: Quantità fissa (es: 0.5 kg di scarto fisso per lotto)

Possono essere usati singolarmente o in combinazione a seconda della logica aziendale.

Esempio di calcolo:
```
Quantità needed = Quantity + (Quantity * ScrapPercentage / 100) + (Quantity * ScrapFactor) + FixedScrap
```
