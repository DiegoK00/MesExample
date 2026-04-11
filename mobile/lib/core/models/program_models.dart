class ProgramResponse {
  final int id;
  final String code;
  final String name;
  final String? description;
  final bool isActive;

  const ProgramResponse({
    required this.id,
    required this.code,
    required this.name,
    this.description,
    required this.isActive,
  });

  factory ProgramResponse.fromJson(Map<String, dynamic> json) => ProgramResponse(
        id: json['id'] as int,
        code: json['code'] as String,
        name: json['name'] as String,
        description: json['description'] as String?,
        isActive: json['isActive'] as bool,
      );
}
