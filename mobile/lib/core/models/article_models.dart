class CategoryResponse {
  final int id;
  final String name;
  final String? description;

  const CategoryResponse({
    required this.id,
    required this.name,
    this.description,
  });

  factory CategoryResponse.fromJson(Map<String, dynamic> json) => CategoryResponse(
        id: json['id'] as int,
        name: json['name'] as String,
        description: json['description'] as String?,
      );
}

class MeasureUnitResponse {
  final int id;
  final String name;
  final String? description;

  const MeasureUnitResponse({
    required this.id,
    required this.name,
    this.description,
  });

  factory MeasureUnitResponse.fromJson(Map<String, dynamic> json) => MeasureUnitResponse(
        id: json['id'] as int,
        name: json['name'] as String,
        description: json['description'] as String?,
      );
}

class ArticleResponse {
  final int id;
  final String code;
  final String name;
  final String? description;
  final int categoryId;
  final String categoryName;
  final double price;
  final int umId;
  final String umName;
  final int? um2Id;
  final String? um2Name;
  final String? measures;
  final String? composition;
  final bool isActive;
  final String createdAt;
  final String createdByUsername;
  final String? deletedAt;
  final String? deletedByUsername;

  const ArticleResponse({
    required this.id,
    required this.code,
    required this.name,
    this.description,
    required this.categoryId,
    required this.categoryName,
    required this.price,
    required this.umId,
    required this.umName,
    this.um2Id,
    this.um2Name,
    this.measures,
    this.composition,
    required this.isActive,
    required this.createdAt,
    required this.createdByUsername,
    this.deletedAt,
    this.deletedByUsername,
  });

  factory ArticleResponse.fromJson(Map<String, dynamic> json) => ArticleResponse(
        id: json['id'] as int,
        code: json['code'] as String,
        name: json['name'] as String,
        description: json['description'] as String?,
        categoryId: json['categoryId'] as int,
        categoryName: json['categoryName'] as String,
        price: (json['price'] as num).toDouble(),
        umId: json['umId'] as int,
        umName: json['umName'] as String,
        um2Id: json['um2Id'] as int?,
        um2Name: json['um2Name'] as String?,
        measures: json['measures'] as String?,
        composition: json['composition'] as String?,
        isActive: json['isActive'] as bool,
        createdAt: json['createdAt'] as String,
        createdByUsername: json['createdByUsername'] as String,
        deletedAt: json['deletedAt'] as String?,
        deletedByUsername: json['deletedByUsername'] as String?,
      );
}
