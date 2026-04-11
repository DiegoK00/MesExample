using Api.DTOs.Users;
using Api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Api.Controllers;

[ApiController]
[Route("users")]
[Authorize]
public class UsersController(UserService userService) : ControllerBase
{
    [HttpGet]
    [Authorize(Roles = "SuperAdmin,Admin")]
    public async Task<IActionResult> GetAll(
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20,
        [FromQuery] string? search = null)
    {
        if (page < 1 || pageSize < 1 || pageSize > 100)
            return BadRequest(new ProblemDetails { Title = "Parametri di paginazione non validi." });

        var result = await userService.GetAllAsync(page, pageSize, search);
        return Ok(result);
    }

    [HttpGet("{id:int}")]
    [Authorize(Roles = "SuperAdmin,Admin")]
    public async Task<IActionResult> GetById(int id)
    {
        var user = await userService.GetByIdAsync(id);
        if (user is null)
            return NotFound(new ProblemDetails { Title = $"Utente {id} non trovato." });

        return Ok(user);
    }

    [HttpPost]
    [Authorize(Roles = "SuperAdmin,Admin")]
    public async Task<IActionResult> Create([FromBody] CreateUserRequest request)
    {
        var (user, error) = await userService.CreateAsync(request);

        if (error is not null)
            return Conflict(new ProblemDetails { Title = error });

        return CreatedAtAction(nameof(GetById), new { id = user!.Id }, user);
    }

    [HttpPut("{id:int}")]
    [Authorize(Roles = "SuperAdmin,Admin")]
    public async Task<IActionResult> Update(int id, [FromBody] UpdateUserRequest request)
    {
        var (user, error) = await userService.UpdateAsync(id, request);

        if (user is null && error is null)
            return NotFound(new ProblemDetails { Title = $"Utente {id} non trovato." });

        if (error is not null)
            return Conflict(new ProblemDetails { Title = error });

        return Ok(user);
    }

    [HttpDelete("{id:int}")]
    [Authorize(Roles = "SuperAdmin")]
    public async Task<IActionResult> Deactivate(int id)
    {
        var success = await userService.DeactivateAsync(id);
        if (!success)
            return NotFound(new ProblemDetails { Title = $"Utente {id} non trovato." });

        return NoContent();
    }
}
