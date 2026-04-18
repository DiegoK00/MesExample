using Api.DTOs.BillOfMaterials;
using Api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Api.Controllers;

[ApiController]
[Route("bill-of-materials")]
public class BillOfMaterialsController(BillOfMaterialService service) : ControllerBase
{
    /// <summary>
    /// GET /bill-of-materials/by-parent/{parentArticleId}
    /// Ottiene tutti i componenti di un articolo padre
    /// Qualsiasi utente autenticato
    /// </summary>
    [HttpGet("by-parent/{parentArticleId}")]
    [Authorize]
    public async Task<ActionResult<List<BillOfMaterialResponse>>> GetByParentArticle(int parentArticleId)
    {
        var result = await service.GetByParentArticleAsync(parentArticleId);
        return Ok(result);
    }

    /// <summary>
    /// GET /bill-of-materials/{parentArticleId}/{componentArticleId}
    /// Ottiene una relazione BOM specifica
    /// Qualsiasi utente autenticato
    /// </summary>
    [HttpGet("{parentArticleId}/{componentArticleId}")]
    [Authorize]
    public async Task<ActionResult<BillOfMaterialResponse>> Get(int parentArticleId, int componentArticleId)
    {
        var result = await service.GetAsync(parentArticleId, componentArticleId);
        if (result is null)
            return NotFound();
        return Ok(result);
    }

    /// <summary>
    /// POST /bill-of-materials
    /// Crea una nuova relazione BOM
    /// Solo Admin e SuperAdmin
    /// </summary>
    [HttpPost]
    [Authorize(Roles = "SuperAdmin,Admin")]
    public async Task<ActionResult<BillOfMaterialResponse>> Create([FromBody] CreateBillOfMaterialRequest request)
    {
        var userId = int.TryParse(User.FindFirst("sub")?.Value, out var id) ? id : 0;
        var (data, error) = await service.CreateAsync(request, userId);

        if (error != null)
            return Conflict(new ProblemDetails { Title = error, Status = StatusCodes.Status409Conflict });

        return CreatedAtAction(nameof(Get), new { parentArticleId = data!.ParentArticleId, componentArticleId = data.ComponentArticleId }, data);
    }

    /// <summary>
    /// PUT /bill-of-materials/{parentArticleId}/{componentArticleId}
    /// Aggiorna una relazione BOM
    /// Solo Admin e SuperAdmin
    /// </summary>
    [HttpPut("{parentArticleId}/{componentArticleId}")]
    [Authorize(Roles = "SuperAdmin,Admin")]
    public async Task<ActionResult<BillOfMaterialResponse>> Update(int parentArticleId, int componentArticleId, [FromBody] UpdateBillOfMaterialRequest request)
    {
        var (data, error) = await service.UpdateAsync(parentArticleId, componentArticleId, request);

        if (error != null)
            return Conflict(new ProblemDetails { Title = error, Status = StatusCodes.Status409Conflict });

        if (data is null)
            return NotFound();

        return Ok(data);
    }

    /// <summary>
    /// DELETE /bill-of-materials/{parentArticleId}/{componentArticleId}
    /// Elimina una relazione BOM
    /// Solo Admin e SuperAdmin
    /// </summary>
    [HttpDelete("{parentArticleId}/{componentArticleId}")]
    [Authorize(Roles = "SuperAdmin,Admin")]
    public async Task<IActionResult> Delete(int parentArticleId, int componentArticleId)
    {
        var result = await service.DeleteAsync(parentArticleId, componentArticleId);
        if (!result)
            return NotFound();
        return NoContent();
    }
}
