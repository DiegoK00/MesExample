using Api.Models.Enums;

namespace Api.DTOs.Users;

public class CreateUserRequest
{
    public string Email { get; set; } = null!;
    public string Username { get; set; } = null!;
    public string Password { get; set; } = null!;
    public LoginArea LoginArea { get; set; }
    public List<int> RoleIds { get; set; } = [];
}
