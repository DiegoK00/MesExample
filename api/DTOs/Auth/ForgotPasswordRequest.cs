using Api.Models.Enums;

namespace Api.DTOs.Auth;

public class ForgotPasswordRequest
{
    public string Email { get; set; } = null!;
    public LoginArea Area { get; set; }
}
