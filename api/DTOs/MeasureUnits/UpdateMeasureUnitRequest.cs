namespace Api.DTOs.MeasureUnits;

public class UpdateMeasureUnitRequest
{
    public string Name { get; set; } = null!;
    public string? Description { get; set; }
}
