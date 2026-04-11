using System.Security.Claims;
using Api.DTOs.Account;
using Api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Api.Controllers;

[ApiController]
[Route("account")]
[Authorize]
public class AccountController(UserService userService) : ControllerBase
{
    [HttpGet("me")]
    public async Task<IActionResult> GetMe()
    {
        var userId = GetCurrentUserId();
        if (userId == 0)
            return Unauthorized();

        var result = await userService.GetCurrentUserAsync(userId);
        if (result is null)
            return Unauthorized();

        return Ok(result);
    }

    [HttpPut("password")]
    public async Task<IActionResult> ChangePassword([FromBody] ChangePasswordRequest request)
    {
        var userId = GetCurrentUserId();
        if (userId == 0)
            return Unauthorized();

        var success = await userService.ChangePasswordAsync(userId, request.CurrentPassword, request.NewPassword);

        if (!success)
            return BadRequest(new ProblemDetails { Title = "Password attuale non corretta." });

        return NoContent();
    }

    private int GetCurrentUserId()
    {
        var sub = User.FindFirstValue(ClaimTypes.NameIdentifier)
               ?? User.FindFirstValue("sub");
        return int.TryParse(sub, out var id) ? id : 0;
    }
}
