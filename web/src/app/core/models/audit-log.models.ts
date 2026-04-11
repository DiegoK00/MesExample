export interface AuditLogResponse {
  id: number;
  userId: number | null;
  username: string | null;
  action: string;
  entityName: string | null;
  entityId: string | null;
  oldValues: string | null;
  newValues: string | null;
  ipAddress: string | null;
  timestamp: string;
}

export interface AuditLogsPageResponse {
  items: AuditLogResponse[];
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
}
