class AuditLogEntry {
  final int id;
  final String timestamp;
  final String? username;
  final String action;
  final String? entityName;
  final int? entityId;
  final String? ipAddress;
  final String? newValues;

  const AuditLogEntry({
    required this.id,
    required this.timestamp,
    this.username,
    required this.action,
    this.entityName,
    this.entityId,
    this.ipAddress,
    this.newValues,
  });

  factory AuditLogEntry.fromJson(Map<String, dynamic> json) => AuditLogEntry(
        id: json['id'] as int,
        timestamp: json['timestamp'] as String,
        username: json['username'] as String?,
        action: json['action'] as String,
        entityName: json['entityName'] as String?,
        entityId: json['entityId'] as int?,
        ipAddress: json['ipAddress'] as String?,
        newValues: json['newValues'] as String?,
      );
}

class AuditLogsPageResponse {
  final List<AuditLogEntry> items;
  final int totalCount;
  final int page;
  final int pageSize;

  const AuditLogsPageResponse({
    required this.items,
    required this.totalCount,
    required this.page,
    required this.pageSize,
  });

  factory AuditLogsPageResponse.fromJson(Map<String, dynamic> json) => AuditLogsPageResponse(
        items: (json['items'] as List)
            .map((e) => AuditLogEntry.fromJson(e as Map<String, dynamic>))
            .toList(),
        totalCount: json['totalCount'] as int,
        page: json['page'] as int,
        pageSize: json['pageSize'] as int,
      );
}
