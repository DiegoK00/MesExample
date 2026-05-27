# API - Convenzioni DTOs e Models

Struttura, naming convention e pattern usati per Models e DTOs nell'API.

---

## Models (`api/Models/`)

Le entità EF Core. Rappresentano le tabelle del database.

### Convenzioni

| Aspetto | Regola |
|---------|--------|
| Naming | PascalCase, singolare (`Article`, non `Articles`) |
| PK | Sempre `int Id` |
| Soft delete | Campi `DeletedAt` (DateTime?) e `DeletedFrom` (int?) — usato su `Article`, `User` |
| Audit creazione | `CreatedAt` (DateTime) + `CreatedFrom` (int FK → User) |
| Navigation properties | Sempre dichiarate, inizializzate con `= null!` o `= []` |
| Collezioni | `ICollection<T>` inizializzata con `[]` |
| Enums | In `Models/Enums/`, usati come `int` nel DB |

### Esempio struttura entità

```csharp
public class Article
{
    public int Id { get; set; }
    public string Code { get; set; } = null!;       // obbligatorio
    public string? Description { get; set; }         // nullable = opzionale
    public bool IsActive { get; set; } = true;
    public DateTime CreatedAt { get; set; }
    public int CreatedFrom { get; set; }             // FK → User
    public DateTime? DeletedAt { get; set; }         // soft delete
    public int? DeletedFrom { get; set; }

    public Category Category { get; set; } = null!;  // navigation
    public ICollection<BillOfMaterial> AsParentArticle { get; set; } = [];
}
```

---

## DTOs (`api/DTOs/`)

Separati dalle entità — non espongono mai i modelli EF Core direttamente.  
Organizzati per dominio: `DTOs/Articles/`, `DTOs/Users/`, `DTOs/Programs/`, ecc.

### Tre tipi di DTO per dominio

| Tipo | Suffisso | Direzione | Contiene |
|------|----------|-----------|---------|
| Risposta | `Response` | API → client | Dati letti, include nomi denormalizzati (es. `CategoryName`) |
| Creazione | `CreateXxxRequest` | client → API | Solo campi necessari alla creazione, niente ID |
| Aggiornamento | `UpdateXxxRequest` | client → API | Tutti i campi modificabili, niente ID (nell'URL) |

### Convenzioni Response

- Include i nomi delle FK: `CategoryId` + `CategoryName`, `UMId` + `UMName`
- I campi nullable nel DB sono nullable nel DTO: `string?`, `DateTime?`
- Non include mai `PasswordHash`, `PasswordSalt` o altri campi interni
- `DateTime` restituito in UTC

### Convenzioni Request

- Nessuna annotation di validazione sui DTO — la validazione è delegata a FluentValidation
- I campi opzionali sono nullable: `string? Description`
- Nessun campo di audit (`CreatedAt`, `CreatedFrom`) — impostati dal service

### Mapping

Il mapping da entità a DTO avviene con un metodo statico privato `MapToResponse` nel service:

```csharp
private static ArticleResponse MapToResponse(Article a) => new()
{
    Id = a.Id,
    Code = a.Code,
    CategoryName = a.Category.Name,  // denormalizzato
    ...
};
```

Non si usa AutoMapper — il mapping esplicito è preferito per chiarezza e controllo.

---

## Models Angular (`web/src/app/core/models/`)

Interfacce TypeScript che replicano i DTO dell'API.

| File | Contenuto |
|------|-----------|
| `article.models.ts` | `ArticleResponse`, `CreateArticleRequest`, `UpdateArticleRequest`, `BillOfMaterialResponse`, ecc. |
| `auth.models.ts` | `LoginRequest`, `LoginResponse`, `RefreshTokenRequest` |
| `user.models.ts` | `UserResponse`, `CreateUserRequest`, `UpdateUserRequest` |
| `program.models.ts` | `ProgramResponse`, `CreateProgramRequest`, ecc. |
| `audit-log.models.ts` | `AuditLogResponse`, `AuditLogsPageResponse` |
| `report.models.ts` | `TopArticleResponse`, `ProductionKpiResponse`, ecc. |

**Naming**: stesso del DTO C# ma con camelCase per le proprietà (`categoryName` non `CategoryName`), grazie alla serializzazione JSON di default di ASP.NET Core.

## Models Flutter (`mobile/lib/core/models/`)

Classi Dart con costruttore `const`, factory `fromJson` e opzionalmente `toJson`.

| File | Contenuto |
|------|-----------|
| `article_models.dart` | `ArticleResponse`, `BillOfMaterialResponse`, request classes |
| `auth_models.dart` | `LoginResponse`, `UserInfo` |
| `user_models.dart` | `UserResponse`, request classes |
| `program_models.dart` | `ProgramResponse`, request classes |
| `audit_log_models.dart` | `AuditLogResponse`, `AuditLogsPageResponse` |
| `report_models.dart` | `TopArticleResponse`, `ProductionKpiResponse`, ecc. |

**Naming**: snake_case per file e proprietà Dart (`category_name`), deserializzato da `json['categoryName']`.
