# Web - Audit Log e Bill of Materials

Documentazione delle schermate `AuditLogsComponent` e `BillOfMaterialsComponent` nell'area admin.

---

## Audit Log (`/admin/audit-logs`)

File: `features/admin/audit-logs/audit-logs.component.ts`

### Funzionalità

Visualizza le attività di sistema con paginazione lato server e filtri.

**Colonne tabella**: Timestamp, Utente, Azione (chip colorato), Entità + ID, IP address, Dettagli (troncati a 40 char con tooltip completo).

**Filtri disponibili**:
- Azione — select con tutte le azioni tracciate
- Entità — select (`User`, `Program`, `UserProgram`)
- Reset filtri — riporta alla prima pagina

**Paginazione**: 25 / 50 / 100 righe per pagina, default 50. Lato server tramite `GET /audit-logs?page=&pageSize=&action=&entityName=`.

### Colori chip azione

| Condizione | Colore |
|---|---|
| Contiene `failed`, `deleted`, `deactivated` | `warn` (rosso) |
| Contiene `login` | `primary` (blu) |
| Altro | `accent` |

### Azioni tracciate

```
user.login / user.login_failed / user.logout
user.created / user.updated / user.deactivated
user.password_changed / user.password_reset
program.created / program.updated / program.deleted
program.assigned / program.revoked
```

---

## Bill of Materials (`/admin/articles/:parentArticleId/bom`)

File: `features/admin/bill-of-materials/bill-of-materials.component.ts`

### Funzionalità

Gestisce i componenti della distinta base di un articolo padre.  
Raggiungibile dall'icona `build` nella lista articoli.

**Al caricamento** esegue `forkJoin` parallelo su:
- `GET /articles/{id}` — per mostrare il codice articolo padre nel titolo
- `GET /bill-of-materials/by-parent/{id}` — lista componenti

**Colonne tabella**: Codice componente, Nome componente, Quantità + tipo (PHYSICAL/PERCENTAGE) + UM, Scarto (%, fattore, fisso), Azioni.

### Dialog create/edit (`BillOfMaterialDialogComponent`)

Aperto via `MatDialog` con `width: 600px`.  
Dati passati nel `data`:
- `parentArticleId` — sempre presente
- `bom` — presente solo in modalità modifica

### Tipi quantità

| Valore | Significato |
|---|---|
| `PHYSICAL` | Quantità assoluta nell'unità di misura specificata |
| `PERCENTAGE` | Percentuale rispetto alla quantità dell'articolo padre |

### Gestione scarto

Tre modalità non esclusive visualizzate in colonna:
- `scrapPercentage` — scarto percentuale (es. `5%`)
- `scrapFactor` — fattore moltiplicativo (es. `F:1.0500`)
- `fixedScrap` — quantità fissa scartata (es. `Fix:0.5000`)

Se tutti e tre sono 0 viene mostrato `—`.
