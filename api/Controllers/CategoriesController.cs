using Api.DTOs.Categories;
using Api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Api.Controllers;

[ApiController]
[Route("categories")]
[Authorize]
public class CategoriesController(CategoryService categoryService) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> GetAll()
    {
        var result = await categoryService.GetAllAsync();
        return Ok(result);
    }

    [HttpGet("{id:int}")]
    public async Task<IActionResult> GetById(int id)
    {
        var category = await categoryService.GetByIdAsync(id);
        if (category is null)
            return NotFound(new ProblemDetails { Title = $"Categoria {id} non trovata." });

        return Ok(category);
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateCategoryRequest request)
    {
        var (category, error) = await categoryService.CreateAsync(request);

        if (error is not null)
            return Conflict(new ProblemDetails { Title = error });

        return CreatedAtAction(nameof(GetById), new { id = category!.Id }, category);
    }

    [HttpPut("{id:int}")]
    [Authorize(Roles = "SuperAdmin,Admin,Configurator")]
    public async Task<IActionResult> Update(int id, [FromBody] UpdateCategoryRequest request)
    {
        var (category, error) = await categoryService.UpdateAsync(id, request);

        if (category is null && error is null)
            return NotFound(new ProblemDetails { Title = $"Categoria {id} non trovata." });

        if (error is not null)
            return Conflict(new ProblemDetails { Title = error });

        return Ok(category);
    }

    [HttpDelete("{id:int}")]
    [Authorize(Roles = "SuperAdmin,Admin,Configurator")]
    public async Task<IActionResult> Delete(int id)
    {
        var success = await categoryService.DeleteAsync(id);
        if (!success)
            return NotFound(new ProblemDetails { Title = $"Categoria {id} non trovata." });

        return NoContent();
    }
}
