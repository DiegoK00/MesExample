namespace Api.DTOs.Programs;

public class CreateProgramRequest
{
    public string Code { get; set; } = null!;
    public string Name { get; set; } = null!;
    public string? Description { get; set; }
}
