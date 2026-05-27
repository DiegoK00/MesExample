# Web - Standalone Components e Struttura Feature

Architettura Angular 19 del progetto: standalone components, lazy loading e organizzazione dei feature module.

---

## Struttura cartelle

```
web/src/app/
├── app.component.ts          # Root component (standalone)
├── app.config.ts             # Bootstrap configuration (ApplicationConfig)
├── app.routes.ts             # Route radice con lazy loading delle feature
│
├── core/                     # Singleton services, models, interceptors, guards
│   ├── constants/
│   │   └── api.constants.ts  # URL API centralizzati
│   ├── guards/
│   │   └── auth.guard.ts     # Protezione route autenticate
│   ├── interceptors/
│   │   └── auth.interceptor.ts # Aggiunge Bearer token a ogni richiesta HTTP
│   ├── models/               # Interfacce TypeScript (mirror dei DTO C#)
│   └── services/             # HttpClient services (uno per dominio)
│
└── features/                 # Aree funzionali dell'app
    ├── admin/                # Backoffice (area 1 — ruolo Admin/SuperAdmin)
    │   ├── admin.routes.ts   # Route dell'area admin
    │   ├── layout/           # AdminLayoutComponent (sidenav + toolbar)
    │   ├── users/
    │   ├── programs/
    │   ├── categories/
    │   ├── measure-units/
    │   ├── articles/
    │   ├── bill-of-materials/
    │   ├── audit-logs/
    │   └── reports/
    ├── app/                  # Area operatori (area 0 — ruolo User)
    │   ├── app.routes.ts
    │   ├── layout/
    │   └── dashboard/
    └── auth/                 # Schermate autenticazione (condivise tra aree)
        ├── login/
        ├── forgot-password/
        ├── reset-password/
        └── change-password/
```

---

## Nessun NgModule

Il progetto usa esclusivamente **standalone components** — non esistono `NgModule` (nemmeno `AppModule`).

Il bootstrap avviene tramite `ApplicationConfig` in `app.config.ts`:

```typescript
export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes, withComponentInputBinding()),
    provideHttpClient(withInterceptors([authInterceptor])),
    provideAnimationsAsync()
  ]
};
```

Ogni component dichiara esplicitamente le proprie dipendenze nel campo `imports: []`.

---

## Lazy loading delle feature

Le due aree principali vengono caricate lazily dalla route radice:

```typescript
// app.routes.ts
export const routes: Routes = [
  { path: '', redirectTo: 'admin/login', pathMatch: 'full' },
  {
    path: 'admin',
    loadChildren: () => import('./features/admin/admin.routes').then(m => m.ADMIN_ROUTES)
  },
  {
    path: 'app',
    loadChildren: () => import('./features/app/app.routes').then(m => m.APP_ROUTES)
  },
  { path: '**', redirectTo: 'admin/login' }
];
```

All'interno di ogni area, ogni component viene caricato lazily con `loadComponent`:

```typescript
// admin.routes.ts
{
  path: 'categories',
  loadComponent: () =>
    import('./categories/categories.component').then(m => m.CategoriesComponent)
}
```

Ogni route carica solo il component necessario — il bundle iniziale è minimo.

---

## Pattern di un component lista (CRUD standard)

Tutti i component lista seguono lo stesso schema:

```typescript
@Component({
  selector: 'app-categories',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,   // sempre OnPush
  imports: [
    CommonModule, MatTableModule, MatButtonModule,    // solo i moduli usati
    MatIconModule, MatSnackBarModule, MatDialogModule
  ],
  template: `...`,   // template inline (no file .html separato)
  styles: [`...`]    // stili inline (no file .scss separato)
})
export class CategoriesComponent implements OnInit {
  private service = inject(CategoriesService);        // inject() invece di costruttore
  private snackBar = inject(MatSnackBar);
  private dialog = inject(MatDialog);

  loading = signal(false);
  items = signal<CategoryResponse[]>([]);             // signal per lo stato locale

  ngOnInit(): void { this.load(); }

  load(): void {
    this.loading.set(true);
    this.service.getAll().subscribe({
      next: res => { this.items.set(res); this.loading.set(false); },
      error: () => { this.loading.set(false); this.snackBar.open('Errore', 'OK', { duration: 3000 }); }
    });
  }
}
```

### Regole del pattern

| Aspetto | Regola |
|---------|--------|
| Change detection | Sempre `ChangeDetectionStrategy.OnPush` |
| Dependency injection | `inject()` nel corpo della classe, non costruttore |
| Stato locale | `signal<T>()` per dati e boolean di loading |
| Template | Inline nel `@Component`, non file `.html` separato |
| Stili | Inline nel `@Component`, non file `.scss` separato |
| Control flow | `@if` / `@for` (Angular 17+ built-in), non `*ngIf` / `*ngFor` |

---

## Dialog (form create/edit)

I form di creazione e modifica sono in `MatDialog` — component separati nella stessa cartella:

```
categories/
├── categories.component.ts       # lista + delete
└── category-dialog.component.ts  # form create/edit
```

Il dialog riceve dati via `MAT_DIALOG_DATA` e restituisce `true` al parent se il salvataggio ha avuto successo:

```typescript
export class CategoryDialogComponent {
  data = inject<{ category?: CategoryResponse }>(MAT_DIALOG_DATA);
  private ref = inject(MatDialogRef<CategoryDialogComponent>);

  // Alla conferma:
  this.ref.close(true);  // il component padre ricarica la lista
}
```

---

## Guard e interceptor

**`auth.guard.ts`** — funzione guard (non classe), protegge le route che richiedono autenticazione:

```typescript
export const adminGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);
  if (auth.isAuthenticated()) return true;
  return router.createUrlTree(['/admin/login']);
};
```

**`auth.interceptor.ts`** — interceptor funzionale (non classe), aggiunge il Bearer token:

```typescript
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const token = inject(AuthService).getToken();
  if (!token) return next(req);
  return next(req.clone({ setHeaders: { Authorization: `Bearer ${token}` } }));
};
```

Entrambi registrati nell'`app.config.ts` tramite `withInterceptors` e `canActivate`.

---

## Service pattern

Un service per dominio in `core/services/`. Usa `HttpClient` con tipizzazione esplicita:

```typescript
@Injectable({ providedIn: 'root' })
export class CategoriesService {
  private http = inject(HttpClient);

  getAll(): Observable<CategoryResponse[]> {
    return this.http.get<CategoryResponse[]>(ApiConstants.categories);
  }

  create(dto: CreateCategoryRequest): Observable<CategoryResponse> {
    return this.http.post<CategoryResponse>(ApiConstants.categories, dto);
  }

  update(id: number, dto: UpdateCategoryRequest): Observable<CategoryResponse> {
    return this.http.put<CategoryResponse>(ApiConstants.category(id), dto);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(ApiConstants.category(id));
  }
}
```

`providedIn: 'root'` — tutti i service sono singleton a livello di applicazione.  
Gli URL sono definiti in `core/constants/api.constants.ts`, mai inline nei service.
