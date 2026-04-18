# Mobile - Flutter

## Setup

```bash
flutter pub get
flutter pub run build_runner build --delete-conflicting-outputs
flutter run --dart-define-from-file=config/env.dev.android.json
```

---

## Convenzioni

- Single codebase per iOS e Android
- Architettura feature-first
- State management: `Provider`
- HTTP: package `http`
- Navigazione: `go_router`
- Token in `flutter_secure_storage`
- Preferenze in `shared_preferences`

---

## Struttura cartelle

```text
mobile/
├── lib/
│   ├── core/
│   │   ├── constants/api_constants.dart
│   │   ├── errors/app_exceptions.dart
│   │   ├── models/
│   │   │   ├── auth_models.dart
│   │   │   ├── user_models.dart
│   │   │   ├── program_models.dart
│   │   │   ├── audit_log_models.dart
│   │   │   └── article_models.dart
│   │   ├── network/app_http_client.dart
│   │   └── services/
│   │       ├── auth_service.dart
│   │       ├── error_notifier.dart
│   │       ├── preferences_service.dart
│   │       ├── users_service.dart
│   │       ├── programs_service.dart
│   │       ├── categories_service.dart
│   │       ├── measure_units_service.dart
│   │       ├── articles_service.dart
│   │       ├── bill_of_materials_service.dart
│   │       └── audit_logs_service.dart
│   ├── features/
│   │   ├── auth/
│   │   ├── home/
│   │   └── admin/
│   │       ├── admin_home_screen.dart
│   │       ├── users/admin_users_screen.dart
│   │       ├── programs/admin_programs_screen.dart
│   │       ├── categories/admin_categories_screen.dart
│   │       ├── measure_units/admin_measure_units_screen.dart
│   │       ├── articles/admin_articles_screen.dart
│   │       ├── articles/admin_article_bom_screen.dart
│   │       ├── articles/admin_article_bom_dialog.dart
│   │       └── audit_logs/admin_audit_logs_screen.dart
│   └── main.dart
└── test/
```

---

## Navigazione

Route principali:

```text
/login
/home
/programs
/admin-login
/admin
/admin/users
/admin/programs
/admin/categories
/admin/measure-units
/admin/articles
/admin/articles/:id/bom
/admin/audit-logs
/change-password
/forgot-password/:area
/reset-password/:area
```

`main.dart` registra i provider applicativi, incluso `BillOfMaterialsService`.

---

## BOM mobile

La feature BOM lato mobile è disponibile in area admin.

Include:

- navigazione da `AdminArticlesScreen`
- route `/admin/articles/:id/bom`
- screen `AdminArticleBOMScreen`
- dialog `AdminArticleBOMDialog`
- service `BillOfMaterialsService`
- CRUD create/update/delete

Metodi del service:

```dart
Future<List<BillOfMaterialResponse>> getByParentArticle(int parentArticleId)
Future<BillOfMaterialResponse> get(int parentArticleId, int componentArticleId)
Future<BillOfMaterialResponse> create(CreateBillOfMaterialRequest request)
Future<BillOfMaterialResponse> update(int parentArticleId, int componentArticleId, UpdateBillOfMaterialRequest request)
Future<void> delete(int parentArticleId, int componentArticleId)
```

---

## Testing

Strumenti:

- `flutter_test`
- `integration_test`
- `mockito + build_runner`

Stato aggiornato 2026-04-17:

- presenti test widget per `AdminArticleBOMScreen`
- presenti test unit per `BillOfMaterialsService`
- presenti mock integration per endpoint BOM in `integration_test/helpers/mock_client.dart`

File BOM principali:

- `mobile/test/admin_article_bom_screen_test.dart`
- `mobile/test/bill_of_materials_service_test.dart`

---

## Note

- Il router usa `AuthService` come `refreshListenable`
- Gli errori rete vengono propagati tramite `ErrorNotifier`
- I test BOM mobile dipendono dal comando `flutter test`, che deve essere disponibile nel `PATH`
