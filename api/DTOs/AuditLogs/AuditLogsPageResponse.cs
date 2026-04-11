namespace Api.DTOs.AuditLogs;

public class AuditLogsPageResponse
{
    public List<AuditLogResponse> Items { get; set; } = [];
    public int TotalCount { get; set; }
    public int Page { get; set; }
    public int PageSize { get; set; }
    public int TotalPages => (int)Math.Ceiling((double)TotalCount / PageSize);
}
