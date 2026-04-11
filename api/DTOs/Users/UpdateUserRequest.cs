namespace Api.DTOs.Users;

public class UpdateUserRequest
{
    public string Email { get; set; } = null!;
    public string Username { get; set; } = null!;
    public bool IsActive { get; set; }
    public List<int> RoleIds { get; set; } = [];
}
