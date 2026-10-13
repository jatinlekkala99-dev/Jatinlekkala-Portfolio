# Enterprise Employee Management System

> **A production-quality demonstration of modern full-stack development with ASP.NET Core 8 Web API, Entity Framework Core 8, Microsoft SQL Server, custom middleware, and React (Vite).**

---

## Table of Contents
- [Architecture Overview](#architecture-overview)
- [Folder Structure](#folder-structure)
- [Prerequisites](#prerequisites)
- [Database Setup & Migrations](#database-setup--migrations)
- [Running the Backend](#running-the-backend)
- [Running the Frontend](#running-the-frontend)
- [API Endpoints Reference](#api-endpoints-reference)
- [Request & Response Payloads](#request--response-payloads)
- [Error Handling & Problem Details](#error-handling--problem-details)
- [Custom Middleware & Pipeline Ordering](#custom-middleware--pipeline-ordering)
- [Complete Request/Response Lifecycle](#complete-requestresponse-lifecycle)
- [xUnit Test Suite](#xunit-test-suite)
- [Troubleshooting](#troubleshooting)

---

## Architecture Overview

The system strictly adheres to the **Controller → Service → EF Core → SQL Server** separation of concerns:

- **Presentation / API Layer (`EmployeesController`)**: Translates HTTP requests into service method invocations and formats HTTP status codes (200, 201 CreatedAtAction, 204, 400, 404, 409). Thin controllers with zero business or query logic.
- **Business Logic Layer (`EmployeeService`)**: Enforces validation invariants (salary > 0, normalized email deduplication, safe updates), coordinates data operations, and maps entities to response DTOs.
- **Data Access Layer (`AppDbContext`, `EmployeeConfiguration`)**: Configures database constraints (unique indexes, string lengths, decimal precision), executes asynchronous LINQ queries with `AsNoTracking()` for high-throughput reads, and coordinates transactions via `SaveChangesAsync()`.
- **Cross-Cutting Pipeline (Custom Middleware)**:
  - `ExceptionHandlingMiddleware`: Catches all downstream exceptions and formats RFC 7807 `ProblemDetails`.
  - `RequestLoggingMiddleware`: Generates/propagates `X-Correlation-ID` and monitors elapsed execution duration using `Stopwatch`.
- **Frontend Layer (React + Vite)**: Controlled forms, instant search/filtering, optimistic feedback, centralized Axios client, and a simulated fallback mode for static hosting.

---

## Folder Structure

```text
Protfolio website/
├── backend/
│   ├── EmployeeManagement.sln
│   ├── .config/
│   │   └── dotnet-tools.json          # dotnet-ef CLI tool manifest
│   ├── EmployeeManagement.Api/
│   │   ├── Controllers/
│   │   │   └── EmployeesController.cs # RESTful API endpoints
│   │   ├── Middleware/
│   │   │   ├── RequestLoggingMiddleware.cs
│   │   │   └── ExceptionHandlingMiddleware.cs
│   │   ├── Services/
│   │   │   ├── IEmployeeService.cs
│   │   │   └── EmployeeService.cs    # Domain logic & rules
│   │   ├── Data/
│   │   │   ├── AppDbContext.cs
│   │   │   └── Configurations/
│   │   │       └── EmployeeConfiguration.cs # Fluent API mapping
│   │   ├── Models/
│   │   │   └── Employee.cs           # Database entity
│   │   ├── DTOs/
│   │   │   ├── CreateEmployeeRequest.cs
│   │   │   ├── UpdateEmployeeRequest.cs
│   │   │   └── EmployeeResponse.cs
│   │   ├── Exceptions/
│   │   │   ├── DuplicateEmailException.cs
│   │   │   └── NotFoundException.cs
│   │   ├── Migrations/               # EF Core code-first migrations
│   │   ├── Program.cs                # DI & middleware pipeline
│   │   └── appsettings.json          # SQL connection string
│   └── EmployeeManagement.Tests/
│       ├── EmployeeServiceTests.cs    # 11 unit tests for business rules
│       └── EmployeesControllerTests.cs# 5 controller response tests
├── frontend/
│   └── employee-management-ui/
│       ├── src/
│       │   ├── api/employeeApi.js     # Axios client & dual-mode fallback
│       │   ├── components/
│       │   │   ├── EmployeeTable.jsx
│       │   │   ├── EmployeeForm.jsx
│       │   │   ├── LoadingIndicator.jsx
│       │   │   └── ErrorMessage.jsx
│       │   ├── pages/EmployeesPage.jsx
│       │   ├── App.jsx
│       │   ├── main.jsx
│       │   └── styles.css
│       ├── package.json
│       └── vite.config.js
└── projects/
    └── employeeManagementSystem/      # Compiled static production bundle
```

---

## Prerequisites

- **.NET 8 SDK** (verify with `dotnet --version`)
- **SQL Server** (LocalDB, SQL Server Developer Edition, or Azure SQL)
- **Node.js** (v18+ or v20+ or v24+) & **npm**

---

## Database Setup & Migrations

1. Ensure SQL Server LocalDB or an active SQL Server instance is running:
   ```powershell
   sqllocaldb start mssqllocaldb
   ```
2. Verify or modify the connection string in `backend/EmployeeManagement.Api/appsettings.json`:
   ```json
   "ConnectionStrings": {
     "DefaultConnection": "Server=(localdb)\\mssqllocaldb;Database=EmployeeManagementDb;Trusted_Connection=True;MultipleActiveResultSets=true;TrustServerCertificate=True"
   }
   ```
3. Apply the existing EF Core migration:
   ```powershell
   cd backend
   dotnet tool restore
   dotnet ef database update --project EmployeeManagement.Api --startup-project EmployeeManagement.Api
   ```

---

## Running the Backend

```powershell
cd backend/EmployeeManagement.Api
dotnet run
```
- **API Base URL**: `https://localhost:7001` or `http://localhost:5000`
- **Swagger Documentation**: Open `https://localhost:7001/swagger` in your browser.

---

## Running the Frontend

```powershell
cd frontend/employee-management-ui
npm install
npm run dev
```
- Open `http://localhost:5173` in your browser.
- The UI automatically connects to the backend at `https://localhost:7001`. If the backend is offline, it activates **Live Interactive Demo Mode** with full in-browser CRUD persistence.

---

## API Endpoints Reference

| Method | Endpoint | Description | Status Codes |
|---|---|---|---|
| `GET` | `/api/employees` | Search and list employees | `200 OK` |
| `GET` | `/api/employees/{id}` | Retrieve employee by ID | `200 OK`, `404 Not Found` |
| `POST` | `/api/employees` | Create a new employee | `201 Created`, `400 Bad Request`, `409 Conflict` |
| `PUT` | `/api/employees/{id}` | Update existing employee | `200 OK`, `400 Bad Request`, `404 Not Found`, `409 Conflict` |
| `DELETE` | `/api/employees/{id}` | Remove employee | `204 NoContent`, `404 Not Found` |
| `GET` | `/api/test/error` | *Dev Only* trigger exception | `500 InternalServerError` (RFC 7807) |

---

## Request & Response Payloads

### POST `/api/employees`
**Request:**
```json
{
  "fullName": "Marcus Chen",
  "email": "marcus.chen@enterprise.com",
  "department": "Engineering",
  "salary": 115000.00,
  "isActive": true
}
```

**Response (`201 Created` with `Location: /api/employees/1`):**
```json
{
  "id": 1,
  "fullName": "Marcus Chen",
  "email": "marcus.chen@enterprise.com",
  "department": "Engineering",
  "salary": 115000.00,
  "isActive": true,
  "createdAtUtc": "2026-10-13T04:45:00.000Z"
}
```

---

## Error Handling & Problem Details

All error responses strictly follow the **RFC 7807 ProblemDetails** standard:

### Duplicate Email (`409 Conflict`):
```json
{
  "type": null,
  "title": "Conflict - Duplicate Email",
  "status": 409,
  "detail": "An employee with email 'marcus.chen@enterprise.com' already exists.",
  "instance": "/api/employees",
  "correlationId": "a1b2c3d4-e5f6-7890-abcd-ef0123456789",
  "timestampUtc": "2026-10-13T04:45:02.123Z"
}
```

### Validation Error (`400 Bad Request`):
```json
{
  "title": "One or more validation errors occurred.",
  "status": 400,
  "errors": {
    "Email": ["Invalid email format."],
    "Salary": ["Salary must be greater than zero."]
  }
}
```

---

## Custom Middleware & Pipeline Ordering

In `Program.cs`, middleware order is strictly defined:

```csharp
// 1. ExceptionHandlingMiddleware (catches ALL downstream unhandled exceptions)
app.UseMiddleware<ExceptionHandlingMiddleware>();

// 2. RequestLoggingMiddleware (stamps X-Correlation-ID & measures request duration)
app.UseMiddleware<RequestLoggingMiddleware>();

// 3. Swagger (OpenAPI UI)
app.UseSwagger();
app.UseSwaggerUI();

// 4. CORS (allows React frontend origin)
app.UseCors("AllowFrontend");

// 5. Authorization (security filter)
app.UseAuthorization();

// 6. MapControllers (executes controller action)
app.MapControllers();
```

---

## xUnit Test Suite

The solution contains 16 automated tests covering business logic and controller responses:

```powershell
cd backend
dotnet test
```

**Results:**
- `11` Tests in `EmployeeServiceTests`: valid creation, case-insensitive duplicate email rejection, invalid salary rejection, search filtering, department filtering, update conflicts, and delete checks.
- `5` Tests in `EmployeesControllerTests`: HTTP status verification (`200 OK`, `201 CreatedAtAction`, `204 NoContent`, `404 NotFound`).
- **All 16 tests passing.**
