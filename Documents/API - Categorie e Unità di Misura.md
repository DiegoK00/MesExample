# API - Categorie e Unità di Misura

Endpoint CRUD per la gestione delle categorie articoli e delle unità di misura.  
Entrambe le risorse sono usate come lookup table da `ArticlesController`.

---

## Categorie — `/categories`

| Metodo | Endpoint | Ruoli | Descrizione |
|--------|----------|-------|-------------|
| GET | `/categories` | Tutti autenticati | Lista tutte le categorie |
| GET | `/categories/{id}` | Tutti autenticati | Singola categoria |
| POST | `/categories` | Tutti autenticati | Crea categoria |
| PUT | `/categories/{id}` | SuperAdmin, Admin, Configurator | Aggiorna categoria |
| DELETE | `/categories/{id}` | SuperAdmin, Admin, Configurator | Elimina categoria |

### DTOs

**Request (create/update)**
```json
{ "name": "Materie prime", "description": "Opzionale" }
```

**Response**
```json
{ "id": 1, "name": "Materie prime", "description": null }
```

### Errori
- `404` — categoria non trovata
- `409` — nome già in uso (duplicate check nel service)

---

## Unità di Misura — `/measure-units`

| Metodo | Endpoint | Ruoli | Descrizione |
|--------|----------|-------|-------------|
| GET | `/measure-units` | Tutti autenticati | Lista tutte le UM |
| GET | `/measure-units/{id}` | Tutti autenticati | Singola UM |
| POST | `/measure-units` | Tutti autenticati | Crea UM |
| PUT | `/measure-units/{id}` | SuperAdmin, Admin, Configurator | Aggiorna UM |
| DELETE | `/measure-units/{id}` | SuperAdmin, Admin, Configurator | Elimina UM |

### DTOs

**Request (create/update)**
```json
{ "name": "kg", "description": "Chilogrammo" }
```

**Response**
```json
{ "id": 3, "name": "kg", "description": "Chilogrammo" }
```

### Errori
- `404` — unità non trovata
- `409` — nome già in uso

---

## Note

- Entrambe le risorse richiedono autenticazione JWT (`[Authorize]`).
- `DELETE` è una eliminazione fisica — verificare che non ci siano articoli collegati prima di eliminare.
- Le operazioni di scrittura (`POST`, `PUT`, `DELETE`) sono riservate ai ruoli `SuperAdmin`, `Admin`, `Configurator`; la lettura è aperta a tutti gli utenti autenticati.
