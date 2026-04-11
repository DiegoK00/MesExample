namespace Api.DTOs.Programs;

public class UpdateProgramRequest
{
    public string Name { get; set; } = null!;
    public string? Description { get; set; }
    public bool IsActive { get; set; }
}
