namespace Api.DTOs.Programs;

public class UserProgramResponse
{
    public int ProgramId { get; set; }
    public string Code { get; set; } = null!;
    public string Name { get; set; } = null!;
    public DateTime GrantedAt { get; set; }
    public string? GrantedByUsername { get; set; }
}
