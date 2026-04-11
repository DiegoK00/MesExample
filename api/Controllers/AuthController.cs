using Api.DTOs.Auth;
using Api.Services;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;

namespace Api.Controllers;

[ApiController]
[Route("auth")]
public class AuthController(AuthService authService) : ControllerBase
{
    [HttpPost("login")]
    [EnableRateLimiting("login")]
    public async Task<IActionResult> Login([FromBody] LoginRequest request)
    {
        var result = await authService.LoginAsync(request, GetIpAddress());

        if (result is null)
            return Unauthorized(new ProblemDetails { Title = "Credenziali non valide." });

        return Ok(result);
    }

    [HttpPost("refresh")]
    public async Task<IActionResult> Refresh([FromBody] RefreshTokenRequest request)
    {
        var result = await authService.RefreshAsync(request.RefreshToken, GetIpAddress());

        if (result is null)
            return Unauthorized(new ProblemDetails { Title = "Refresh token non valido o scaduto." });

        return Ok(result);
    }

    [HttpPost("logout")]
    public async Task<IActionResult> Logout([FromBody] LogoutRequest request)
    {
        await authService.LogoutAsync(request.RefreshToken, GetIpAddress());
        return NoContent();
    }

    [HttpPost("forgot-password")]
    [EnableRateLimiting("forgot-password")]
    public async Task<IActionResult> ForgotPassword([FromBody] ForgotPasswordRequest request)
    {
        await authService.ForgotPasswordAsync(request.Email, request.Area);
        // Risposta sempre identica per evitare user enumeration
        return Ok(new { message = "Se l'indirizzo è registrato, riceverai un'email con le istruzioni." });
    }

    [HttpPost("reset-password")]
    public async Task<IActionResult> ResetPassword([FromBody] ResetPasswordRequest request)
    {
        var success = await authService.ResetPasswordAsync(request.Token, request.NewPassword);

        if (!success)
            return BadRequest(new ProblemDetails { Title = "Token non valido o scaduto." });

        return NoContent();
    }

    private string GetIpAddress()
    {
        if (Request.Headers.TryGetValue("X-Forwarded-For", out var forwarded))
            return forwarded.ToString().Split(',')[0].Trim();

        return HttpContext.Connection.RemoteIpAddress?.ToString() ?? "unknown";
    }
}
