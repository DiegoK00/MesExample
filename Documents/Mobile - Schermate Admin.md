# Mobile - Schermate Admin

Documentazione delle schermate nell'area backoffice mobile (`/admin/*`).

---

## AdminHomeScreen (`/admin`)

File: `features/admin/admin_home_screen.dart`

Schermata iniziale del backoffice. Griglia di card di navigazione (`_NavCard`) verso tutte le sezioni admin.

**Card disponibili** (in ordine):

| Card | Route | Colore |
|------|-------|--------|
| Utenti | `/admin/users` | Indigo |
| Programmi | `/admin/programs` | Teal |
| Articoli | `/admin/articles` | Purple |
| Categorie | `/admin/categories` | Blue |
| Unità di Misura | `/admin/measure-units` | Green |
| Audit Log | `/admin/audit-logs` | Orange |
| Report & KPI | `/admin/reports` | Deep Purple |

**AppBar**: titolo "Backoffice", toggle dark/light mode, pulsante logout.

---

## AdminUsersScreen (`/admin/users`)

File: `features/admin/users/admin_users_screen.dart`

Lista utenti con CRUD completo. Operazioni: crea, modifica, disattiva, gestisci programmi assegnati.

---

## AdminArticlesScreen (`/admin/articles`)

File: `features/admin/articles/admin_articles_screen.dart`

Lista articoli con filtro attivi/tutti. Operazioni: crea, modifica, disattiva, naviga alla distinta base.

### AdminArticleBOMScreen (`/admin/articles/:id/bom`)

File: `features/admin/articles/admin_article_bom_screen.dart`

Distinta base di un articolo specifico. Parametro route: `id` (int).  
Operazioni: aggiungi componente (dialog), modifica componente, elimina componente.

---

## AdminCategoriesScreen (`/admin/categories`)

File: `features/admin/categories/admin_categories_screen.dart`

Lista categorie. Operazioni: crea, modifica, elimina.

---

## AdminMeasureUnitsScreen (`/admin/measure-units`)

File: `features/admin/measure_units/admin_measure_units_screen.dart`

Lista unità di misura. Operazioni: crea, modifica, elimina.

---

## AdminProgramsScreen (`/admin/programs`)

File: `features/admin/programs/admin_programs_screen.dart`

Lista programmi dell'applicazione. Operazioni: crea, modifica, elimina.

---

## AdminAuditLogsScreen (`/admin/audit-logs`)

File: `features/admin/audit_logs/admin_audit_logs_screen.dart`

Log delle attività di sistema con filtri e paginazione.  
Filtri: azione, entità, utente, intervallo date.

---

## AdminReportsScreen (`/admin/reports`)

File: `features/admin/reports/admin_reports_screen.dart`

KPI di produzione e articoli più richiesti. Vedi [Mobile - Reports.md](Mobile%20-%20Reports.md) per dettagli.

---

## Pattern comune a tutte le schermate admin

- `StatefulWidget` con `Future` per il caricamento dati
- `FutureBuilder` per gestire loading / error / data
- `RefreshIndicator` per il pull-to-refresh
- `ScaffoldMessenger.showSnackBar` per feedback operazioni
- Dialog di conferma prima delle operazioni distruttive
- Navigazione via `GoRouter` (`context.go(...)`)
