namespace Api.Models;

public class UserProgram
{
    public int UserId { get; set; }
    public int ProgramId { get; set; }
    public DateTime GrantedAt { get; set; }
    public int? GrantedByUserId { get; set; }

    public User User { get; set; } = null!;
    public AppProgram Program { get; set; } = null!;
    public User? GrantedBy { get; set; }
}
