using System.Security.Claims;
using Api.DTOs.Programs;
using Api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Api.Controllers;

[ApiController]
[Route("programs")]
[Authorize]
public class ProgramsController(ProgramService programService) : ControllerBase
{
    // --- CRUD Programs ---

    [HttpGet]
    public async Task<IActionResult> GetAll([FromQuery] bool? activeOnly = null)
    {
        var result = await programService.GetAllAsync(activeOnly);
        return Ok(result);
    }

    [HttpGet("{id:int}")]
    public async Task<IActionResult> GetById(int id)
    {
        var program = await programService.GetByIdAsync(id);
        if (program is null)
            return NotFound(new ProblemDetails { Title = $"Programma {id} non trovato." });

        return Ok(program);
    }

    [HttpPost]
    [Authorize(Roles = "SuperAdmin,Admin")]
    public async Task<IActionResult> Create([FromBody] CreateProgramRequest request)
    {
        var (program, error) = await programService.CreateAsync(request);

        if (error is not null)
            return Conflict(new ProblemDetails { Title = error });

        return CreatedAtAction(nameof(GetById), new { id = program!.Id }, program);
    }

    [HttpPut("{id:int}")]
    [Authorize(Roles = "SuperAdmin,Admin")]
    public async Task<IActionResult> Update(int id, [FromBody] UpdateProgramRequest request)
    {
        var (program, error) = await programService.UpdateAsync(id, request);

        if (program is null && error is null)
            return NotFound(new ProblemDetails { Title = $"Programma {id} non trovato." });

        return Ok(program);
    }

    [HttpDelete("{id:int}")]
    [Authorize(Roles = "SuperAdmin")]
    public async Task<IActionResult> Delete(int id)
    {
        var success = await programService.DeleteAsync(id);
        if (!success)
            return NotFound(new ProblemDetails { Title = $"Programma {id} non trovato." });

        return NoContent();
    }

    // --- Assegnazione utenti ---

    [HttpGet("/users/{userId:int}/programs")]
    [Authorize(Roles = "SuperAdmin,Admin")]
    public async Task<IActionResult> GetUserPrograms(int userId)
    {
        var result = await programService.GetUserProgramsAsync(userId);
        return Ok(result);
    }

    [HttpPost("/users/{userId:int}/programs")]
    [Authorize(Roles = "SuperAdmin,Admin")]
    public async Task<IActionResult> AssignPrograms(int userId, [FromBody] AssignProgramRequest request)
    {
        var grantedByUserId = GetCurrentUserId();
        var (success, error) = await programService.AssignProgramsAsync(userId, request, grantedByUserId);

        if (!success && error is null)
            return NotFound(new ProblemDetails { Title = $"Utente {userId} non trovato." });

        if (error is not null)
            return BadRequest(new ProblemDetails { Title = error });

        var programs = await programService.GetUserProgramsAsync(userId);
        return Ok(programs);
    }

    [HttpDelete("/users/{userId:int}/programs")]
    [Authorize(Roles = "SuperAdmin,Admin")]
    public async Task<IActionResult> RevokePrograms(int userId, [FromBody] AssignProgramRequest request)
    {
        var (success, _) = await programService.RevokeProgramsAsync(userId, request);

        if (!success)
            return NotFound(new ProblemDetails { Title = $"Utente {userId} non trovato." });

        return NoContent();
    }

    private int GetCurrentUserId()
    {
        var sub = User.FindFirstValue(ClaimTypes.NameIdentifier)
               ?? User.FindFirstValue("sub");
        return int.TryParse(sub, out var id) ? id : 0;
    }
}
