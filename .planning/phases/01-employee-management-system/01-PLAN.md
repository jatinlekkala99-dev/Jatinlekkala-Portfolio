# Phase 01 Plan: Enterprise Employee Management System

## Objective
Build a complete enterprise-grade Employee Management System featuring:
- **Backend:** ASP.NET Core 8 Web API, Entity Framework Core 8, Microsoft SQL Server, Custom Middleware (`RequestLoggingMiddleware`, `ExceptionHandlingMiddleware`), Service layer pattern (`IEmployeeService`), DTOs, Fluent Entity Configuration, centralized logging, and xUnit testing.
- **Frontend:** React + Vite, responsive enterprise UI, Axios API client with centralized interceptors & correlation ID tracking, controlled form validation, live search, department/status filtering, optimistic UI updates, delete confirmations, and demo mode for static Cloudflare Pages hosting.
- **Integration:** Integrated under `jatinlekkala.com/projects/employeeManagementSystem` route on Cloudflare Pages and highlighted in the main portfolio's Projects section.
- **Documentation:** Complete `README.md` and `INTERVIEW_GUIDE.md` containing 20+ interview questions and comprehensive technical explanations.

## Tasks
1. Scaffold backend structure:
   - Solution `EmployeeManagement.sln`
   - Project `EmployeeManagement.Api` (net8.0)
   - Packages: `Microsoft.EntityFrameworkCore.SqlServer`, `Microsoft.EntityFrameworkCore.Design`, `Swashbuckle.AspNetCore`
2. Implement Data & Models:
   - `Employee.cs`
   - `AppDbContext.cs`
   - `EmployeeConfiguration.cs` with unique index on normalized email, decimal precision, string lengths.
   - Initial migration `InitialCreate`.
3. Implement DTOs & Exceptions:
   - `CreateEmployeeRequest.cs`, `UpdateEmployeeRequest.cs`, `EmployeeResponse.cs`
   - `DuplicateEmailException.cs`, `NotFoundException.cs`
4. Implement Service Layer:
   - `IEmployeeService.cs` & `EmployeeService.cs` with business rules, normalized email uniqueness check, valid salary check, and DTO mappings.
5. Implement Custom Middleware:
   - `RequestLoggingMiddleware.cs` (Stopwatch, correlation ID generation & response header, safe logging)
   - `ExceptionHandlingMiddleware.cs` (ProblemDetails JSON response, 500 status, correlation ID inclusion)
6. Implement Controller Layer:
   - `EmployeesController.cs` with CRUD endpoints, async actions, CreatedAtAction, and HTTP status codes.
7. Implement xUnit Backend Tests:
   - `EmployeeManagement.Tests.csproj`
   - Unit tests for `EmployeeService` business rules (create, update, duplicate email, delete, not found).
8. Implement React Frontend (Vite):
   - Scaffold `employee-management-ui`
   - Build `employeeApi.js`, `EmployeeTable.jsx`, `EmployeeForm.jsx`, `LoadingIndicator.jsx`, `ErrorMessage.jsx`, `EmployeesPage.jsx`.
   - Setup styling in `styles.css`.
   - Add dual-mode: Real API client + in-browser fallback simulation for live Cloudflare demo.
9. Portfolio Deployment:
   - Build React production bundle and output to `projects/employeeManagementSystem/`.
   - Update portfolio `index.html` projects section to feature Employee Management System linking to `/projects/employeeManagementSystem`.
10. Documentation & Interview Preparation:
    - Author `README.md` and `INTERVIEW_GUIDE.md` with in-depth questions and answers.
    - Test execution, git commit, and push to GitHub.
