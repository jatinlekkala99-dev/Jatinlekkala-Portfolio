using System.Diagnostics;

namespace EmployeeManagement.Api.Middleware;

public class RequestLoggingMiddleware
{
    private readonly RequestDelegate _next;
    private readonly ILogger<RequestLoggingMiddleware> _logger;
    public const string CorrelationIdHeader = "X-Correlation-ID";
    public const string CorrelationIdItemKey = "CorrelationId";

    public RequestLoggingMiddleware(RequestDelegate next, ILogger<RequestLoggingMiddleware> logger)
    {
        _next = next ?? throw new ArgumentNullException(nameof(next));
        _logger = logger ?? throw new ArgumentNullException(nameof(logger));
    }

    public async Task InvokeAsync(HttpContext context)
    {
        var stopwatch = Stopwatch.StartNew();

        // Validate or generate Correlation ID
        string correlationId = GetOrGenerateCorrelationId(context);

        // Store in HttpContext.Items for downstream services/middleware
        context.Items[CorrelationIdItemKey] = correlationId;

        // Append to Response headers so client can trace requests
        context.Response.OnStarting(() =>
        {
            if (!context.Response.Headers.ContainsKey(CorrelationIdHeader))
            {
                context.Response.Headers.Append(CorrelationIdHeader, correlationId);
            }
            return Task.CompletedTask;
        });

        var requestMethod = context.Request.Method;
        var requestPath = context.Request.Path.Value;

        _logger.LogInformation(
            "Incoming HTTP {Method} {Path} [CorrelationId: {CorrelationId}]",
            requestMethod, requestPath, correlationId);

        try
        {
            await _next(context);
        }
        finally
        {
            stopwatch.Stop();
            var statusCode = context.Response.StatusCode;

            _logger.LogInformation(
                "Completed HTTP {Method} {Path} with StatusCode {StatusCode} in {ElapsedMilliseconds}ms [CorrelationId: {CorrelationId}]",
                requestMethod, requestPath, statusCode, stopwatch.ElapsedMilliseconds, correlationId);
        }
    }

    private static string GetOrGenerateCorrelationId(HttpContext context)
    {
        if (context.Request.Headers.TryGetValue(CorrelationIdHeader, out var headerValue) &&
            !string.IsNullOrWhiteSpace(headerValue))
        {
            // Sanitize client-supplied correlation ID to prevent log forging
            var candidate = headerValue.ToString().Trim();
            if (candidate.Length <= 64 && candidate.All(c => char.IsLetterOrDigit(c) || c == '-' || c == '_'))
            {
                return candidate;
            }
        }

        return Guid.NewGuid().ToString("D");
    }
}
