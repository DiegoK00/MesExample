using Api.Models.Enums;

namespace Api.DTOs.Auth;

public class LoginRequest
{
    public string Email { get; set; } = null!;
    public string Password { get; set; } = null!;
    public LoginArea Area { get; set; }
}
