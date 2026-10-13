using System.Net;
using System.Text.Json;
using EmployeeManagement.Api.Exceptions;
using Microsoft.AspNetCore.Mvc;

namespace EmployeeManagement.Api.Middleware;

public class ExceptionHandlingMiddleware
{
    private readonly RequestDelegate _next;
    private readonly ILogger<ExceptionHandlingMiddleware> _logger;
    private readonly IHostEnvironment _environment;

    public ExceptionHandlingMiddleware(
        RequestDelegate next,
        ILogger<ExceptionHandlingMiddleware> logger,
        IHostEnvironment environment)
    {
        _next = next ?? throw new ArgumentNullException(nameof(next));
        _logger = logger ?? throw new ArgumentNullException(nameof(logger));
        _environment = environment ?? throw new ArgumentNullException(nameof(environment));
    }

    public async Task InvokeAsync(HttpContext context)
    {
        try
        {
            await _next(context);
        }
        catch (Exception ex)
        {
            if (context.Response.HasStarted)
            {
                _logger.LogWarning("The response has already started, skipping custom exception handling middleware.");
                throw;
            }

            await HandleExceptionAsync(context, ex);
        }
    }

    private async Task HandleExceptionAsync(HttpContext context, Exception exception)
    {
        var correlationId = context.Items[RequestLoggingMiddleware.CorrelationIdItemKey]?.ToString()
            ?? Guid.NewGuid().ToString("D");

        int statusCode;
        string title;
        string detail;

        switch (exception)
        {
            case DuplicateEmailException duplicateEx:
                statusCode = (int)HttpStatusCode.Conflict;
                title = "Conflict - Duplicate Email";
                detail = duplicateEx.Message;
                _logger.LogWarning("Handled DuplicateEmailException [CorrelationId: {CorrelationId}]: {Message}", correlationId, detail);
                break;

            case NotFoundException notFoundEx:
                statusCode = (int)HttpStatusCode.NotFound;
                title = "Resource Not Found";
                detail = notFoundEx.Message;
                _logger.LogWarning("Handled NotFoundException [CorrelationId: {CorrelationId}]: {Message}", correlationId, detail);
                break;

            case ArgumentException argEx:
                statusCode = (int)HttpStatusCode.BadRequest;
                title = "Invalid Request Parameters";
                detail = argEx.Message;
                _logger.LogWarning("Handled ArgumentException [CorrelationId: {CorrelationId}]: {Message}", correlationId, detail);
                break;

            default:
                statusCode = (int)HttpStatusCode.InternalServerError;
                title = "An unexpected server error occurred.";
                detail = _environment.IsDevelopment()
                    ? $"{exception.Message} ({exception.GetType().Name})"
                    : "An internal server error occurred. Please contact support with the provided correlation ID.";
                _logger.LogError(exception, "Unhandled Exception caught in ExceptionHandlingMiddleware [CorrelationId: {CorrelationId}]", correlationId);
                break;
        }

        var problemDetails = new ProblemDetails
        {
            Status = statusCode,
            Title = title,
            Detail = detail,
            Instance = context.Request.Path,
            Extensions =
            {
                ["correlationId"] = correlationId,
                ["timestampUtc"] = DateTime.UtcNow
            }
        };

        context.Response.ContentType = "application/problem+json";
        context.Response.StatusCode = statusCode;

        var jsonOptions = new JsonSerializerOptions { PropertyNamingPolicy = JsonNamingPolicy.CamelCase };
        var json = JsonSerializer.Serialize(problemDetails, jsonOptions);

        await context.Response.WriteAsync(json);
    }
}
