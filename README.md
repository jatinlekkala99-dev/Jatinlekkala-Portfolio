# Jatin Lekkala | Software Engineering Portfolio & Enterprise Projects

Welcome to the official portfolio and engineering showcase repository of **Jatin Lekkala** (AI Engineer & .NET Full-Stack Developer).

- **Live Portfolio**: [https://jatinlekkala.com/](https://jatinlekkala.com/)
- **Featured Live App**: [Enterprise Employee Management System](https://jatinlekkala.com/projects/employeeManagementSystem/)

---

## 🌟 Featured Enterprise Project: Employee Management System

A production-ready full-stack enterprise application designed for interview preparation and architectural reference:
- **Backend**: ASP.NET Core 8 Web API, Entity Framework Core 8, Microsoft SQL Server
- **Architecture**: Controller &rarr; Service &rarr; EF Core, Fluent Entity Configuration, DTOs & Validation
- **Custom Middleware**:
  - `RequestLoggingMiddleware`: Distributed tracing with correlation ID (`X-Correlation-ID`) & Stopwatch performance tracking
  - `ExceptionHandlingMiddleware`: Centralized error handling formatted as RFC 7807 `ProblemDetails`
- **Testing**: 16 automated xUnit tests covering business rules and controller status codes
- **Frontend**: High-performance React (Vite) dashboard with live search, department/status filtering, controlled form validation, and dual-mode simulation for static Cloudflare Pages hosting.

### 📚 Documentation & Technical Guides
- [Backend Architecture & Setup Guide](./backend/README.md)
- [Comprehensive Full-Stack Interview Guide (25 Questions & Model Answers)](./backend/INTERVIEW_GUIDE.md)

---

## 📂 Project Structure

```text
├── index.html                           # Main Portfolio Landing Page
├── assets/                              # CSS, JS, motion graphics, and particles
├── projects/
│   └── employeeManagementSystem/        # Production bundle hosted on Cloudflare Pages
├── backend/
│   ├── EmployeeManagement.sln
│   ├── EmployeeManagement.Api/          # .NET 8 Web API & Custom Middleware
│   ├── EmployeeManagement.Tests/        # xUnit Test Suite (16 Passed)
│   ├── README.md                        # Full Backend Documentation
│   └── INTERVIEW_GUIDE.md               # 25 In-Depth Interview Questions
└── frontend/
    └── employee-management-ui/          # Complete React + Vite Source Code
```

---

## 🚀 Running Locally

### Backend (.NET 8 Web API)
```powershell
cd backend/EmployeeManagement.Api
dotnet run
```
Open Swagger UI: `https://localhost:7001/swagger`

### Tests (xUnit)
```powershell
cd backend
dotnet test
```

### Frontend (React + Vite)
```powershell
cd frontend/employee-management-ui
npm install
npm run dev
```
Open in browser: `http://localhost:5173`
