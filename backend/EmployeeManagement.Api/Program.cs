using EmployeeManagement.Api.Data;
using EmployeeManagement.Api.Middleware;
using EmployeeManagement.Api.Services;
using Microsoft.EntityFrameworkCore;

var builder = WebApplication.CreateBuilder(args);

// ==========================================
// 1. Service Registrations & Dependency Injection
// ==========================================

// Add Controllers with centralized model validation behavior
builder.Services.AddControllers();

// Configure EF Core with SQL Server (Scoped Lifetime)
var connectionString = builder.Configuration.GetConnectionString("DefaultConnection")
    ?? "Server=(localdb)\\mssqllocaldb;Database=EmployeeManagementDb;Trusted_Connection=True;MultipleActiveResultSets=true;TrustServerCertificate=True";

builder.Services.AddDbContext<AppDbContext>(options =>
{
    options.UseSqlServer(connectionString);
});

// Register Application Service with Scoped Lifetime
// (Scoped matches the DbContext lifetime: one instance per HTTP request)
builder.Services.AddScoped<IEmployeeService, EmployeeService>();

// Configure CORS for React frontend (Vite default: http://localhost:5173)
const string corsPolicyName = "AllowFrontend";
builder.Services.AddCors(options =>
{
    options.AddPolicy(corsPolicyName, policy =>
    {
        policy.WithOrigins("http://localhost:5173", "http://localhost:3000", "https://jatinlekkala.com")
              .AllowAnyHeader()
              .AllowAnyMethod()
              .WithExposedHeaders(RequestLoggingMiddleware.CorrelationIdHeader);
    });
});

// Configure Swagger / OpenAPI documentation
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new Microsoft.OpenApi.Models.OpenApiInfo
    {
        Title = "Employee Management API",
        Version = "v1",
        Description = "Enterprise-style ASP.NET Core Web API with EF Core, SQL Server, custom middleware, and clean architecture."
    });
});

var app = builder.Build();

// ==========================================
// 2. HTTP Request Pipeline & Middleware Ordering
// ==========================================

// Order 1: Centralized Exception Handling Middleware
// Placed first so it wraps the ENTIRE pipeline and intercepts all unhandled exceptions
// originating from downstream middleware, controllers, services, or EF Core.
app.UseMiddleware<ExceptionHandlingMiddleware>();

// Order 2: Request Logging Middleware
// Placed immediately after ExceptionHandlingMiddleware to generate/accept the Correlation ID,
// record the start time, and log the final HTTP status code and elapsed duration upon return.
app.UseMiddleware<RequestLoggingMiddleware>();

// Order 3: Swagger UI (accessible in Development and Staging for interview demos)
app.UseSwagger();
app.UseSwaggerUI(c =>
{
    c.SwaggerEndpoint("/swagger/v1/swagger.json", "Employee Management API v1");
    c.RoutePrefix = "swagger";
});

// Order 4: CORS (must run before Authorization and endpoint routing)
app.UseCors(corsPolicyName);

// Order 5: Authorization (if authentication is integrated later)
app.UseAuthorization();

// Order 6: Map Controller Endpoints
app.MapControllers();

// Controlled test endpoint for Scenario E (Demonstrating Centralized Exception Handling & Correlation ID)
if (app.Environment.IsDevelopment())
{
    app.MapGet("/api/test/error", () =>
    {
        throw new InvalidOperationException("Demonstration test exception triggered to verify centralized error logging and correlation ID propagation.");
    });
}

app.Run();
