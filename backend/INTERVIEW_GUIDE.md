# Full-Stack .NET & React Technical Interview Guide
## Enterprise Employee Management System Case Study (25 In-Depth Questions & Model Answers)

---

### Category 1: Middleware & ASP.NET Core Pipeline

#### Q1: What is ASP.NET Core middleware and why did we build custom middleware instead of relying solely on Action Filters?
**Model Answer:**  
Middleware is software assembled into an application's HTTP pipeline to handle requests and responses in a bidirectional chain. Each component chooses whether to pass the request to the next component in the pipeline and can perform work before and after the next delegate.
We chose custom middleware for **Request Logging** and **Exception Handling** because:
1. **Pipeline Scope:** Middleware executes for *all* HTTP requests—including invalid routes (404s), static files, and authentication rejections—whereas Action Filters only execute after routing has matched a controller action.
2. **Global Error Catching:** `ExceptionHandlingMiddleware` wraps every downstream component (routing, model binding, authorization, controllers, services, database queries), guaranteeing that an unhandled error anywhere in the pipeline returns an RFC 7807 `ProblemDetails` response.
3. **End-to-End Latency Measurement:** `RequestLoggingMiddleware` wraps the entire downstream execution with a `Stopwatch`, accurately capturing total round-trip processing time.

---

#### Q2: Why is middleware ordering so critical in `Program.cs`? What happens if you swap `ExceptionHandlingMiddleware` and `RequestLoggingMiddleware`?
**Model Answer:**  
Middleware executes in the exact order of registration for incoming requests and in reverse order for outgoing responses:
```
Request  ---> [ExceptionHandling] ---> [RequestLogging] ---> [CORS] ---> [Routing] ---> [Controller]
Response <--- [ExceptionHandling] <--- [RequestLogging] <--- [CORS] <--- [Routing] <--- [Controller]
```
If we place `RequestLoggingMiddleware` before `ExceptionHandlingMiddleware`, any exception thrown inside `RequestLoggingMiddleware` itself could escape uncaught. More importantly, when placed as `[ExceptionHandling]` then `[RequestLogging]`, any error thrown downstream is caught by `ExceptionHandling`, translated into an HTTP status (like 409 or 500), and passed back up through `RequestLogging`, allowing `RequestLogging` to log the final HTTP status code and execution duration cleanly.

---

#### Q3: What is a Correlation ID (Request ID) and how does our `RequestLoggingMiddleware` implement distributed tracing?
**Model Answer:**  
A Correlation ID is a unique token (typically a GUID) associated with a single HTTP transaction as it travels across client applications, reverse proxies, APIs, and microservices.
In our implementation:
1. The middleware checks for an incoming `X-Correlation-ID` header. If supplied, it sanitizes it (enforcing character and length boundaries to prevent log forging). If missing, it generates a new `Guid.NewGuid().ToString("D")`.
2. It stores the ID in `HttpContext.Items["CorrelationId"]` so controllers, services, and logger scopes can access it during the request lifetime.
3. It hooks `context.Response.OnStarting` to append `X-Correlation-ID` to the outgoing response headers.
4. When errors occur, `ExceptionHandlingMiddleware` embeds the correlation ID inside the `ProblemDetails` JSON body, allowing the user to report the exact correlation ID to technical support for instant log lookup.

---

#### Q4: Why must `context.Response.HasStarted` be checked in `ExceptionHandlingMiddleware`?
**Model Answer:**  
Once the HTTP response status code and headers have been flushed over the network socket to the client, the response has "started". At that point, attempting to set `context.Response.StatusCode = 500` or modifying headers will throw an `InvalidOperationException`. Checking `if (context.Response.HasStarted)` prevents secondary pipeline crashes and warns the server that streaming had already commenced when the error occurred.

---

### Category 2: Architecture & Dependency Injection

#### Q5: Explain the difference between Transient, Scoped, and Singleton service lifetimes in ASP.NET Core. Why is `DbContext` registered as Scoped?
**Model Answer:**  
- **Transient (`AddTransient`)**: Created every time they are requested from the service container. Best for lightweight, stateless services.
- **Scoped (`AddScoped`)**: Created once per client request (per HTTP request lifetime) and shared across all dependencies resolved during that single request.
- **Singleton (`AddSingleton`)**: Created the first time they are requested and live for the entire life of the web application.
`DbContext` is **Scoped** because:
1. It maintains an in-memory change tracker (`ChangeTracker`) and cache of loaded entities. If it were Singleton, memory would grow unbounded and concurrent requests across threads would corrupt the non-thread-safe `DbContext` instance.
2. If it were Transient, each injected service or repository in the same request would get a different DbContext instance, preventing unified transactions across `SaveChangesAsync()`.

---

#### Q6: Why did we build a Service layer (`EmployeeService`) instead of placing EF Core queries directly in `EmployeesController`?
**Model Answer:**  
Placing database logic inside controllers violates the Single Responsibility Principle (SRP) and creates severe technical debt:
1. **Thin Controllers:** The controller's only responsibility is HTTP protocol translation: parsing incoming route/query parameters, model validation triggers, and returning standard HTTP responses (`200`, `201 CreatedAtAction`, `404`, `409`).
2. **Business Rule Encapsulation:** Business invariants (normalizing email strings, ensuring salary > 0, verifying duplicate email conflicts across concurrent updates) belong in the domain/service layer.
3. **Testability:** In our `EmployeeManagement.Tests` suite, we wrote 11 unit tests against `EmployeeService` in milliseconds using an In-Memory DbContext without needing to spin up an HTTP test server or mock `HttpContext`.

---

#### Q7: Why didn't we add a generic Repository and Unit of Work layer on top of EF Core?
**Model Answer:**  
In enterprise .NET architecture, adding generic repositories (`IRepository<T>`) over EF Core is often an **anti-pattern**:
- `DbSet<T>` *is* already an implementation of the Repository pattern.
- `DbContext` *is* already an implementation of the Unit of Work pattern (`SaveChangesAsync()` commits all changes atomically).
Wrapping EF Core in an abstraction often strips away powerful features like `AsNoTracking()`, eager/explicit loading (`Include`), projection queries (`Select`), and cancellation tokens, leading to either an anemic repository or leaky abstractions. Direct usage of `DbContext` inside domain services provides optimal clarity and performance.

---

### Category 3: Entity Framework Core & SQL Server

#### Q8: What does `AsNoTracking()` do, and when should you use it?
**Model Answer:**  
By default, EF Core tracks all entities retrieved via LINQ queries in its `ChangeTracker`. The tracker retains snapshots of property values to detect modifications when `SaveChangesAsync()` is called.
When `AsNoTracking()` is applied:
1. EF Core skips snapshot creation and tracker registration.
2. It dramatically reduces memory allocation and CPU overhead.
3. It should **always** be used for read-only queries (like `GET /api/employees`).
In write scenarios (like `UpdateEmployeeAsync` or `DeleteEmployeeAsync`), we fetch with tracking (`FindAsync`) because we intend to mutate and persist the entity.

#### Q9: How does EF Core translate LINQ into SQL? What is client evaluation vs server evaluation?
**Model Answer:**  
EF Core uses an expression tree parser. When a LINQ query is executed:
1. The C# compiler creates an `IQueryable` expression tree.
2. EF Core's query pipeline translates this tree into a relational SQL abstract syntax tree (AST).
3. The SQL generation provider emits dialect-specific SQL (e.g. `SELECT [e].[Id], [e].[FullName] FROM [Employees] AS [e] WHERE LOWER([e].[Email]) = @__email_0`).
4. **Server vs. Client Evaluation:** Server evaluation executes filtering and sorting in SQL Server before sending rows over the network. If a method cannot be translated to SQL (like a custom C# method inside `.Where()`), modern EF Core throws an exception rather than silently loading all table rows into memory (which was an older risk called client evaluation).

---

#### Q10: How do database unique indexes work, and why isn't an application-level duplicate check sufficient?
**Model Answer:**  
In `EmployeeService.cs`, we check `AnyAsync(e => e.Email == normalizedEmail)` before inserting. However, in high-concurrency systems, two identical POST requests can execute the `AnyAsync` check simultaneously, both finding that the email does not yet exist. Both threads then issue an `INSERT`.
This is a classic **race condition**. The only definitive safeguard is a **unique index constraint in SQL Server**:
```csharp
builder.HasIndex(e => e.Email)
    .IsUnique()
    .HasDatabaseName("IX_Employees_Email_Unique");
```
When the second transaction attempts to commit, SQL Server throws an error. In `EmployeeService.cs`, we catch `DbUpdateException` and rethrow `DuplicateEmailException`, guaranteeing consistent 409 Conflict responses under concurrency.

---

#### Q11: Explain how `SaveChangesAsync` works internally.
**Model Answer:**  
When `SaveChangesAsync()` is invoked:
1. **DetectChanges:** The `ChangeTracker` compares the current entity property values against original values recorded during query time to determine states (`Added`, `Modified`, `Deleted`, `Unchanged`).
2. **Transaction Scoping:** EF Core opens a database transaction if one is not already active.
3. **SQL Command Generation:** EF Core batches DML commands (`INSERT`, `UPDATE`, `DELETE`) into parameterized statements.
4. **Execution:** It sends the batched commands to SQL Server, updates generated keys (such as `Id` generated via identity column), updates entity states to `Unchanged`, and commits the transaction.

---

### Category 4: Security, Validation & API Design

#### Q12: How does this application protect against SQL Injection?
**Model Answer:**  
The application uses Entity Framework Core LINQ queries for all database interactions. EF Core automatically utilizes parameterized queries (`sp_executesql` in SQL Server). Input strings are sent as parameters (`@p0`, `@p1`) rather than concatenated into the SQL statement, ensuring SQL Server compiles the query plan independently of user input and treats input strictly as literal values.

---

#### Q13: What is the difference between DTO validation and Service-level validation?
**Model Answer:**  
- **DTO Validation (Syntactic / Structural):** Handled via Data Annotations (`[Required]`, `[EmailAddress]`, `[StringLength]`, `[Range]`). This validates format, presence, and length at the boundary before the controller action executes. Invalid requests are rejected immediately with HTTP 400 `ValidationProblemDetails`.
- **Service-level Validation (Semantic / Business):** Requires business context or database state. For example, verifying whether an email is already taken by another employee, enforcing role-based limits, or ensuring salary meets department thresholds.

---

#### Q14: What is RFC 7807 (ProblemDetails) and why is it preferred over arbitrary error JSON?
**Model Answer:**  
RFC 7807 defines a standardized machine-readable format for HTTP API error responses. Instead of clients having to guess whether an error is under `error`, `message`, `errMsg`, or `errors`, RFC 7807 provides consistent fields:
- `title`: Short human-readable summary.
- `status`: The HTTP status code.
- `detail`: Human-readable explanation specific to this occurrence.
- `instance`: URI reference of the offending endpoint.
- Custom extensions (e.g. `correlationId`, `timestampUtc`).

---

#### Q15: Why is `CreatedAtAction` preferred over returning `Ok` for `POST` endpoints?
**Model Answer:**  
Per HTTP/1.1 REST specifications (RFC 7231):
- A successful resource creation should return `201 Created` rather than `200 OK`.
- The response must include a `Location` header pointing to the URI where the newly created resource can be fetched (`/api/employees/12`).
`CreatedAtAction(nameof(GetEmployeeById), new { id = created.Id }, created)` sets status 201, computes the canonical URI, and returns the response DTO in the body.

---

### Category 5: React Frontend Architecture

#### Q16: How does the React application handle centralized API error handling and double submission prevention?
**Model Answer:**  
1. **Centralized Error Parsing:** In `employeeApi.js`, an exported helper `parseApiError` inspects the error structure. If it detects `error.response.data.errors` (ASP.NET validation failure), it extracts and concatenates the validation messages. If it detects RFC 7807 `detail`, it returns that message directly.
2. **Double Submission Prevention:** In `EmployeeForm.jsx`, the submit button and inputs are disabled when `isSubmitting` is true. The button renders a loading spinner, preventing accidental double-clicks from issuing duplicate POST requests.

---

#### Q17: Why do we use controlled components in `EmployeeForm.jsx`?
**Model Answer:**  
In controlled components, the input's value is driven by React component state (`formData.fullName`), with changes handled by `onChange`.
Benefits:
- Instant client-side validation as the user types.
- Predictable form reset and population during edit mode (`useEffect`).
- Easy sanitization (trimming whitespace, lowercasing emails) before submission.

---

#### Q18: What is the purpose of the cleanup function in `useEffect` when searching or fetching data?
**Model Answer:**  
In `EmployeesPage.jsx`, search inputs trigger debounced fetching. If a user types "John" quickly, multiple state updates occur. The cleanup function:
```javascript
useEffect(() => {
  const timer = setTimeout(() => fetchEmployees(), 200);
  return () => clearTimeout(timer);
}, [fetchEmployees]);
```
cancels preceding pending timeouts, preventing unnecessary network spam and avoiding race conditions where an earlier slow request overwrites a newer fast request.

---

### Category 6: Performance, Diagnostics & Production Readiness

#### Q19: How would you diagnose an API endpoint that takes 4 seconds to respond?
**Model Answer:**  
1. **Trace with Correlation ID:** Check server logs using `RequestLoggingMiddleware` output to verify if the 4 seconds was spent inside the API or upstream in network latency.
2. **Database Query Profiling:** Inspect EF Core SQL logging or use SQL Server Extended Events / Profiler. Check if the query is executing an unindexed table scan (`Index Scan` vs `Clustered Index Seek`).
3. **N+1 Query Problem:** Check if the endpoint is executing queries inside a loop instead of performing a single query.
4. **Connection Pool Exhaustion:** Check if database connections are being exhausted due to slow async operations or blocked threads (`.Result` / `.Wait()` anti-patterns).
5. **APM Tooling:** Use Application Insights, OpenTelemetry, or MiniProfiler to identify exact hotspots.

---

#### Q20: What architectural changes would you implement before deploying this solution to a mission-critical enterprise production environment?
**Model Answer:**  
1. **Authentication & Authorization:** Add ASP.NET Core Identity with JWT Bearer tokens and Role-Based / Policy-Based Access Control (`[Authorize(Roles = "HRAdmin")]`).
2. **Caching:** Integrate distributed caching with Redis for frequent queries (e.g. department lists) using `IDistributedCache`.
3. **Rate Limiting:** Add built-in .NET 8 Rate Limiting middleware (`builder.Services.AddRateLimiter`) to prevent brute-force attacks and resource exhaustion.
4. **Structured Logging & APM:** Replace default console logging with Serilog and sink logs into Elasticsearch/Seq with OpenTelemetry distributed tracing.
5. **Database Resiliency:** Enable EF Core execution strategies (`EnableRetryOnFailure`) to handle transient SQL network hiccups.
6. **Containerization & CI/CD:** Package the API into a multi-stage Docker container and deploy via Kubernetes with blue-green deployment pipelines.
7. **Health Checks:** Expose `/healthz` endpoints for liveness and readiness probes checking SQL Server connectivity.

---

### Additional High-Impact Interview Questions

#### Q21: What is the difference between `IEnumerable<T>`, `ICollection<T>`, and `IQueryable<T>`?
**Answer:** `IEnumerable<T>` is for in-memory iteration. `ICollection<T>` adds count and mutation methods. `IQueryable<T>` holds an expression tree that translates into database queries (SQL) *before* rows are fetched into memory.

#### Q22: Can you explain async/await in ASP.NET Core and why we use `ConfigureAwait(false)` in libraries but not in ASP.NET Core controllers?
**Answer:** `async/await` yields the thread back to the thread pool while awaiting I/O (like database or network calls), maximizing server throughput. In ASP.NET Core, there is no `SynchronizationContext`, so `ConfigureAwait(false)` is not required in controllers/middleware.

#### Q23: What are DTOs and why should you never return EF Core entities directly from controller actions?
**Answer:** Returning entities directly exposes database schemas, creates security risks (over-posting / mass assignment), causes serialization issues (circular references), and couples API contracts to database tables.

#### Q24: How does CORS work, and why is CORS not a security feature against malicious attackers?
**Answer:** CORS is a browser-enforced security mechanism preventing malicious websites from making unauthorized cross-origin requests using user cookies. It does not protect APIs from non-browser clients (like Postman or curl).

#### Q25: Why did our tests use EF Core In-Memory database, and what are its limitations compared to real SQL Server?
**Answer:** In-Memory is fast and requires no external setup, ideal for verifying business logic in unit tests. However, it does not enforce relational constraints, foreign keys, or SQL Server transaction locking behavior. For integration testing, Testcontainers with a real SQL Server container is the gold standard.
