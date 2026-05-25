using Api.Data;
using Api.DTOs.Reports;
using ClosedXML.Excel;
using Microsoft.EntityFrameworkCore;
using QuestPDF.Fluent;
using QuestPDF.Helpers;
using QuestPDF.Infrastructure;

namespace Api.Services;

public class ReportService(AppDbContext db)
{
    public async Task<List<TopArticleResponse>> GetTopArticlesAsync(int top = 10)
    {
        return await db.BillOfMaterials
            .GroupBy(b => new
            {
                b.ComponentArticleId,
                b.ComponentArticle.Code,
                ArticleName  = b.ComponentArticle.Name,
                CategoryName = b.ComponentArticle.Category.Name,
                UMName       = b.ComponentArticle.UM.Name
            })
            .Select(g => new TopArticleResponse
            {
                ArticleId     = g.Key.ComponentArticleId,
                Code          = g.Key.Code,
                Name          = g.Key.ArticleName,
                CategoryName  = g.Key.CategoryName,
                UsageCount    = g.Count(),
                TotalQuantity = g.Sum(b => b.Quantity),
                UMName        = g.Key.UMName
            })
            .OrderByDescending(r => r.UsageCount)
            .ThenByDescending(r => r.TotalQuantity)
            .Take(top)
            .ToListAsync();
    }

    public async Task<ProductionKpiResponse> GetProductionKpiAsync()
    {
        var cutoff30 = DateTime.UtcNow.AddDays(-30);
        var cutoff6m = DateTime.UtcNow.AddMonths(-6);

        var totalActive   = await db.Articles.CountAsync(a => a.IsActive);
        var totalInactive = await db.Articles.CountAsync(a => !a.IsActive);

        var bomParents    = await db.BillOfMaterials.Select(b => b.ParentArticleId).Distinct().CountAsync();
        var bomComponents = await db.BillOfMaterials.Select(b => b.ComponentArticleId).Distinct().CountAsync();
        var avgComponents = bomParents > 0
            ? await db.BillOfMaterials
                .GroupBy(b => b.ParentArticleId)
                .Select(g => (double)g.Count())
                .AverageAsync()
            : 0;

        var recentCount = await db.Articles.CountAsync(a => a.CreatedAt >= cutoff30);

        var scrapAvg = await db.BillOfMaterials.AnyAsync()
            ? await db.BillOfMaterials.AverageAsync(b => b.ScrapPercentage)
            : 0;

        var byCategory = await db.Categories
            .Select(c => new CategoryKpiItem
            {
                CategoryName = c.Name,
                ArticleCount = c.Articles.Count(a => a.IsActive),
                BomCount     = c.Articles.Count(a => a.AsParentArticle.Any())
            })
            .Where(c => c.ArticleCount > 0)
            .OrderByDescending(c => c.ArticleCount)
            .ToListAsync();

        var trend = await db.Articles
            .Where(a => a.CreatedAt >= cutoff6m)
            .GroupBy(a => new { a.CreatedAt.Year, a.CreatedAt.Month })
            .Select(g => new CreationTrendItem
            {
                Month = $"{g.Key.Year}-{g.Key.Month:D2}",
                Count = g.Count()
            })
            .OrderBy(t => t.Month)
            .ToListAsync();

        return new ProductionKpiResponse
        {
            TotalArticlesActive       = totalActive,
            TotalArticlesInactive     = totalInactive,
            TotalBomParents           = bomParents,
            TotalBomComponents        = bomComponents,
            AvgComponentsPerBom       = Math.Round(avgComponents, 2),
            ArticlesCreatedLast30Days = recentCount,
            TotalScrapPercentageAvg   = Math.Round(scrapAvg, 2),
            ArticlesByCategory        = byCategory,
            CreationTrend             = trend
        };
    }

    public async Task<byte[]> ExportTopArticlesPdfAsync(int top = 10)
    {
        var rows = await GetTopArticlesAsync(top);

        var doc = Document.Create(container =>
        {
            container.Page(page =>
            {
                page.Size(PageSizes.A4.Landscape());
                page.Margin(30);
                page.DefaultTextStyle(x => x.FontSize(10));

                page.Header().Text($"Articoli più richiesti — generato il {DateTime.Now:dd/MM/yyyy HH:mm}")
                    .SemiBold().FontSize(13).FontColor(Colors.Blue.Medium);

                page.Content().PaddingTop(10).Table(table =>
                {
                    table.ColumnsDefinition(c =>
                    {
                        c.ConstantColumn(30);
                        c.RelativeColumn(2);
                        c.RelativeColumn(4);
                        c.RelativeColumn(3);
                        c.ConstantColumn(70);
                        c.ConstantColumn(90);
                        c.ConstantColumn(50);
                    });

                    static IContainer HeaderCell(IContainer c) =>
                        c.Background(Colors.Blue.Medium).Padding(5).DefaultTextStyle(x => x.FontColor(Colors.White).SemiBold());

                    table.Header(h =>
                    {
                        h.Cell().Element(HeaderCell).Text("#");
                        h.Cell().Element(HeaderCell).Text("Codice");
                        h.Cell().Element(HeaderCell).Text("Nome");
                        h.Cell().Element(HeaderCell).Text("Categoria");
                        h.Cell().Element(HeaderCell).AlignRight().Text("Utilizzi");
                        h.Cell().Element(HeaderCell).AlignRight().Text("Qtà totale");
                        h.Cell().Element(HeaderCell).Text("UM");
                    });

                    for (var i = 0; i < rows.Count; i++)
                    {
                        var row = rows[i];
                        var bg = i % 2 == 0 ? Colors.White : Colors.Grey.Lighten4;

                        static IContainer DataCell(IContainer c, string bg) =>
                            c.Background(bg).Padding(5);

                        table.Cell().Element(c => DataCell(c, bg)).Text((i + 1).ToString());
                        table.Cell().Element(c => DataCell(c, bg)).Text(row.Code);
                        table.Cell().Element(c => DataCell(c, bg)).Text(row.Name);
                        table.Cell().Element(c => DataCell(c, bg)).Text(row.CategoryName);
                        table.Cell().Element(c => DataCell(c, bg)).AlignRight().Text(row.UsageCount.ToString());
                        table.Cell().Element(c => DataCell(c, bg)).AlignRight().Text(row.TotalQuantity.ToString("N2"));
                        table.Cell().Element(c => DataCell(c, bg)).Text(row.UMName);
                    }
                });

                page.Footer().AlignCenter().Text(x =>
                {
                    x.Span("Pagina ");
                    x.CurrentPageNumber();
                    x.Span(" di ");
                    x.TotalPages();
                });
            });
        });

        return doc.GeneratePdf();
    }

    public async Task<byte[]> ExportTopArticlesExcelAsync(int top = 10)
    {
        var rows = await GetTopArticlesAsync(top);

        using var workbook = new XLWorkbook();
        var ws = workbook.Worksheets.Add("Articoli più richiesti");

        var headers = new[] { "#", "Codice", "Nome", "Categoria", "Utilizzi", "Qtà totale", "UM" };
        for (var c = 0; c < headers.Length; c++)
        {
            var cell = ws.Cell(1, c + 1);
            cell.Value = headers[c];
            cell.Style.Font.Bold = true;
            cell.Style.Fill.BackgroundColor = XLColor.FromHtml("#1565C0");
            cell.Style.Font.FontColor = XLColor.White;
            cell.Style.Alignment.Horizontal = XLAlignmentHorizontalValues.Center;
        }

        for (var i = 0; i < rows.Count; i++)
        {
            var row = rows[i];
            var r = i + 2;
            ws.Cell(r, 1).Value = i + 1;
            ws.Cell(r, 2).Value = row.Code;
            ws.Cell(r, 3).Value = row.Name;
            ws.Cell(r, 4).Value = row.CategoryName;
            ws.Cell(r, 5).Value = row.UsageCount;
            ws.Cell(r, 6).Value = row.TotalQuantity;
            ws.Cell(r, 7).Value = row.UMName;

            if (i % 2 != 0)
                ws.Row(r).Style.Fill.BackgroundColor = XLColor.FromHtml("#F5F5F5");
        }

        ws.Columns().AdjustToContents();

        using var stream = new MemoryStream();
        workbook.SaveAs(stream);
        return stream.ToArray();
    }

    public async Task<byte[]> ExportKpiExcelAsync()
    {
        var kpi = await GetProductionKpiAsync();

        using var workbook = new XLWorkbook();

        // Sheet 1: KPI riepilogo
        var ws1 = workbook.Worksheets.Add("KPI Produzione");
        var summary = new (string Label, object Value)[]
        {
            ("Articoli attivi",           kpi.TotalArticlesActive),
            ("Articoli inattivi",          kpi.TotalArticlesInactive),
            ("Distinte base (padri)",      kpi.TotalBomParents),
            ("Componenti unici in BOM",    kpi.TotalBomComponents),
            ("Media componenti per BOM",   kpi.AvgComponentsPerBom),
            ("Articoli creati (30gg)",     kpi.ArticlesCreatedLast30Days),
            ("Scarto medio %",             kpi.TotalScrapPercentageAvg),
        };

        ws1.Cell(1, 1).Value = "KPI";
        ws1.Cell(1, 2).Value = "Valore";
        ws1.Row(1).Style.Font.Bold = true;
        ws1.Row(1).Style.Fill.BackgroundColor = XLColor.FromHtml("#1565C0");
        ws1.Row(1).Style.Font.FontColor = XLColor.White;

        for (var i = 0; i < summary.Length; i++)
        {
            ws1.Cell(i + 2, 1).Value = summary[i].Label;
            ws1.Cell(i + 2, 2).Value = summary[i].Value.ToString();
            if (i % 2 != 0)
                ws1.Row(i + 2).Style.Fill.BackgroundColor = XLColor.FromHtml("#F5F5F5");
        }
        ws1.Columns().AdjustToContents();

        // Sheet 2: per categoria
        var ws2 = workbook.Worksheets.Add("Per categoria");
        ws2.Cell(1, 1).Value = "Categoria";
        ws2.Cell(1, 2).Value = "Articoli attivi";
        ws2.Cell(1, 3).Value = "Con distinta base";
        ws2.Row(1).Style.Font.Bold = true;
        ws2.Row(1).Style.Fill.BackgroundColor = XLColor.FromHtml("#1565C0");
        ws2.Row(1).Style.Font.FontColor = XLColor.White;

        for (var i = 0; i < kpi.ArticlesByCategory.Count; i++)
        {
            var cat = kpi.ArticlesByCategory[i];
            ws2.Cell(i + 2, 1).Value = cat.CategoryName;
            ws2.Cell(i + 2, 2).Value = cat.ArticleCount;
            ws2.Cell(i + 2, 3).Value = cat.BomCount;
            if (i % 2 != 0)
                ws2.Row(i + 2).Style.Fill.BackgroundColor = XLColor.FromHtml("#F5F5F5");
        }
        ws2.Columns().AdjustToContents();

        // Sheet 3: trend creazione
        var ws3 = workbook.Worksheets.Add("Trend creazione");
        ws3.Cell(1, 1).Value = "Mese";
        ws3.Cell(1, 2).Value = "Articoli creati";
        ws3.Row(1).Style.Font.Bold = true;
        ws3.Row(1).Style.Fill.BackgroundColor = XLColor.FromHtml("#1565C0");
        ws3.Row(1).Style.Font.FontColor = XLColor.White;

        for (var i = 0; i < kpi.CreationTrend.Count; i++)
        {
            ws3.Cell(i + 2, 1).Value = kpi.CreationTrend[i].Month;
            ws3.Cell(i + 2, 2).Value = kpi.CreationTrend[i].Count;
        }
        ws3.Columns().AdjustToContents();

        using var stream = new MemoryStream();
        workbook.SaveAs(stream);
        return stream.ToArray();
    }
}
