using Api.Models.Enums;

namespace Api.DTOs.Account;

public class CurrentUserResponse
{
    public int Id { get; set; }
    public string Email { get; set; } = null!;
    public string Username { get; set; } = null!;
    public LoginArea LoginArea { get; set; }
    public List<string> Roles { get; set; } = [];
    public List<string> Programs { get; set; } = [];
}
