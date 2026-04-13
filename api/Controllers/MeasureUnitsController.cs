using Api.DTOs.MeasureUnits;
using Api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Api.Controllers;

[ApiController]
[Route("measure-units")]
[Authorize]
public class MeasureUnitsController(MeasureUnitService measureUnitService) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> GetAll()
    {
        var result = await measureUnitService.GetAllAsync();
        return Ok(result);
    }

    [HttpGet("{id:int}")]
    public async Task<IActionResult> GetById(int id)
    {
        var unit = await measureUnitService.GetByIdAsync(id);
        if (unit is null)
            return NotFound(new ProblemDetails { Title = $"Unità di misura {id} non trovata." });

        return Ok(unit);
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateMeasureUnitRequest request)
    {
        var (unit, error) = await measureUnitService.CreateAsync(request);

        if (error is not null)
            return Conflict(new ProblemDetails { Title = error });

        return CreatedAtAction(nameof(GetById), new { id = unit!.Id }, unit);
    }

    [HttpPut("{id:int}")]
    [Authorize(Roles = "SuperAdmin,Admin,Configurator")]
    public async Task<IActionResult> Update(int id, [FromBody] UpdateMeasureUnitRequest request)
    {
        var (unit, error) = await measureUnitService.UpdateAsync(id, request);

        if (unit is null && error is null)
            return NotFound(new ProblemDetails { Title = $"Unità di misura {id} non trovata." });

        if (error is not null)
            return Conflict(new ProblemDetails { Title = error });

        return Ok(unit);
    }

    [HttpDelete("{id:int}")]
    [Authorize(Roles = "SuperAdmin,Admin,Configurator")]
    public async Task<IActionResult> Delete(int id)
    {
        var success = await measureUnitService.DeleteAsync(id);
        if (!success)
            return NotFound(new ProblemDetails { Title = $"Unità di misura {id} non trovata." });

        return NoContent();
    }
}
