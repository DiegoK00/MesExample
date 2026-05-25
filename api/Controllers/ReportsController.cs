using Api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Api.Controllers;

[ApiController]
[Route("reports")]
[Authorize]
public class ReportsController(ReportService reportService) : ControllerBase
{
    /// <summary>Articoli più usati come componenti nelle distinte base.</summary>
    [HttpGet("articles/top-used")]
    public async Task<IActionResult> GetTopArticles([FromQuery] int top = 10)
    {
        if (top is < 1 or > 100)
            return BadRequest(new ProblemDetails { Title = "Il parametro 'top' deve essere compreso tra 1 e 100." });

        return Ok(await reportService.GetTopArticlesAsync(top));
    }

    /// <summary>KPI di produzione: articoli, distinte base, categorie, trend creazione.</summary>
    [HttpGet("production/kpi")]
    public async Task<IActionResult> GetProductionKpi()
        => Ok(await reportService.GetProductionKpiAsync());

    /// <summary>Export articoli più richiesti in PDF.</summary>
    [HttpGet("articles/top-used/export/pdf")]
    public async Task<IActionResult> ExportTopArticlesPdf([FromQuery] int top = 10)
    {
        if (top is < 1 or > 100)
            return BadRequest(new ProblemDetails { Title = "Il parametro 'top' deve essere compreso tra 1 e 100." });

        var bytes = await reportService.ExportTopArticlesPdfAsync(top);
        return File(bytes, "application/pdf", $"articoli-top-{DateTime.Now:yyyyMMdd}.pdf");
    }

    /// <summary>Export articoli più richiesti in Excel.</summary>
    [HttpGet("articles/top-used/export/excel")]
    public async Task<IActionResult> ExportTopArticlesExcel([FromQuery] int top = 10)
    {
        if (top is < 1 or > 100)
            return BadRequest(new ProblemDetails { Title = "Il parametro 'top' deve essere compreso tra 1 e 100." });

        var bytes = await reportService.ExportTopArticlesExcelAsync(top);
        return File(bytes, "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            $"articoli-top-{DateTime.Now:yyyyMMdd}.xlsx");
    }

    /// <summary>Export KPI di produzione in Excel (3 fogli: KPI, Categorie, Trend).</summary>
    [HttpGet("production/kpi/export/excel")]
    public async Task<IActionResult> ExportKpiExcel()
    {
        var bytes = await reportService.ExportKpiExcelAsync();
        return File(bytes, "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            $"kpi-produzione-{DateTime.Now:yyyyMMdd}.xlsx");
    }
}
