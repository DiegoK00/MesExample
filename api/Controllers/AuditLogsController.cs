using Api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Api.Controllers;

[ApiController]
[Route("audit-logs")]
[Authorize(Roles = "SuperAdmin,Admin")]
public class AuditLogsController(AuditLogService auditLogService) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> GetLogs(
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 50,
        [FromQuery] int? userId = null,
        [FromQuery] string? action = null,
        [FromQuery] string? entityName = null,
        [FromQuery] DateTime? from = null,
        [FromQuery] DateTime? to = null)
    {
        if (page < 1 || pageSize < 1 || pageSize > 200)
            return BadRequest(new ProblemDetails { Title = "Parametri di paginazione non validi." });

        var result = await auditLogService.GetLogsAsync(page, pageSize, userId, action, entityName, from, to);
        return Ok(result);
    }
}
