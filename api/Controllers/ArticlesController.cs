using System.Security.Claims;
using Api.DTOs.Articles;
using Api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Api.Controllers;

[ApiController]
[Route("articles")]
[Authorize]
public class ArticlesController(ArticleService articleService) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> GetAll([FromQuery] bool? activeOnly = null)
    {
        var result = await articleService.GetAllAsync(activeOnly);
        return Ok(result);
    }

    [HttpGet("{id:int}")]
    public async Task<IActionResult> GetById(int id)
    {
        var article = await articleService.GetByIdAsync(id);
        if (article is null)
            return NotFound(new ProblemDetails { Title = $"Articolo {id} non trovato." });

        return Ok(article);
    }

    [HttpPost]
    [Authorize(Roles = "SuperAdmin,Admin")]
    public async Task<IActionResult> Create([FromBody] CreateArticleRequest request)
    {
        var (article, error) = await articleService.CreateAsync(request, GetCurrentUserId());

        if (error is not null)
            return Conflict(new ProblemDetails { Title = error });

        return CreatedAtAction(nameof(GetById), new { id = article!.Id }, article);
    }

    [HttpPut("{id:int}")]
    [Authorize(Roles = "SuperAdmin,Admin")]
    public async Task<IActionResult> Update(int id, [FromBody] UpdateArticleRequest request)
    {
        var (article, error) = await articleService.UpdateAsync(id, request);

        if (article is null && error is null)
            return NotFound(new ProblemDetails { Title = $"Articolo {id} non trovato." });

        if (error is not null)
            return BadRequest(new ProblemDetails { Title = error });

        return Ok(article);
    }

    [HttpDelete("{id:int}")]
    [Authorize(Roles = "SuperAdmin,Admin")]
    public async Task<IActionResult> Delete(int id)
    {
        var success = await articleService.DeleteAsync(id, GetCurrentUserId());
        if (!success)
            return NotFound(new ProblemDetails { Title = $"Articolo {id} non trovato." });

        return NoContent();
    }

    private int GetCurrentUserId()
    {
        var sub = User.FindFirstValue(ClaimTypes.NameIdentifier)
               ?? User.FindFirstValue("sub");
        return int.TryParse(sub, out var id) ? id : 0;
    }
}
