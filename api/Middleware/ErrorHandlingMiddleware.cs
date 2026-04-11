using System.Net;
using System.Text.Json;
using Microsoft.AspNetCore.Mvc;

namespace Api.Middleware;

public class ErrorHandlingMiddleware(RequestDelegate next, ILogger<ErrorHandlingMiddleware> logger)
{
    public async Task InvokeAsync(HttpContext context)
    {
        try
        {
            await next(context);
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Unhandled exception for {Method} {Path}", context.Request.Method, context.Request.Path);
            await WriteProblemDetailsAsync(context, ex);
        }
    }

    private static async Task WriteProblemDetailsAsync(HttpContext context, Exception ex)
    {
        context.Response.ContentType = "application/problem+json";

        var (status, title) = ex switch
        {
            ArgumentException => (HttpStatusCode.BadRequest, "Richiesta non valida."),
            UnauthorizedAccessException => (HttpStatusCode.Forbidden, "Accesso negato."),
            KeyNotFoundException => (HttpStatusCode.NotFound, "Risorsa non trovata."),
            _ => (HttpStatusCode.InternalServerError, "Si è verificato un errore interno.")
        };

        context.Response.StatusCode = (int)status;

        var problem = new ProblemDetails
        {
            Title = title,
            Status = (int)status
        };

        await context.Response.WriteAsync(JsonSerializer.Serialize(problem));
    }
}
