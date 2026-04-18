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

class BillOfMaterialResponse {
  final int parentArticleId;
  final String parentArticleCode;
  final String parentArticleName;
  final int componentArticleId;
  final String componentArticleCode;
  final String componentArticleName;
  final double quantity;
  final String quantityType; // 'PHYSICAL' o 'PERCENTAGE'
  final int umId;
  final String umName;
  final double scrapPercentage;
  final double scrapFactor;
  final double fixedScrap;

  BillOfMaterialResponse({
    required this.parentArticleId,
    required this.parentArticleCode,
    required this.parentArticleName,
    required this.componentArticleId,
    required this.componentArticleCode,
    required this.componentArticleName,
    required this.quantity,
    required this.quantityType,
    required this.umId,
    required this.umName,
    required this.scrapPercentage,
    required this.scrapFactor,
    required this.fixedScrap,
  });

  factory BillOfMaterialResponse.fromJson(Map<String, dynamic> json) => BillOfMaterialResponse(
        parentArticleId: json['parentArticleId'] as int,
        parentArticleCode: json['parentArticleCode'] as String,
        parentArticleName: json['parentArticleName'] as String,
        componentArticleId: json['componentArticleId'] as int,
        componentArticleCode: json['componentArticleCode'] as String,
        componentArticleName: json['componentArticleName'] as String,
        quantity: (json['quantity'] as num).toDouble(),
        quantityType: json['quantityType'] as String,
        umId: json['umId'] as int,
        umName: json['umName'] as String,
        scrapPercentage: (json['scrapPercentage'] as num).toDouble(),
        scrapFactor: (json['scrapFactor'] as num).toDouble(),
        fixedScrap: (json['fixedScrap'] as num).toDouble(),
      );
}

class CreateBillOfMaterialRequest {
  final int parentArticleId;
  final int componentArticleId;
  final double quantity;
  final String quantityType;
  final int umId;
  final double scrapPercentage;
  final double scrapFactor;
  final double fixedScrap;

  const CreateBillOfMaterialRequest({
    required this.parentArticleId,
    required this.componentArticleId,
    required this.quantity,
    required this.quantityType,
    required this.umId,
    required this.scrapPercentage,
    required this.scrapFactor,
    required this.fixedScrap,
  });

  Map<String, dynamic> toJson() => {
        'parentArticleId': parentArticleId,
        'componentArticleId': componentArticleId,
        'quantity': quantity,
        'quantityType': quantityType,
        'umId': umId,
        'scrapPercentage': scrapPercentage,
        'scrapFactor': scrapFactor,
        'fixedScrap': fixedScrap,
      };
}

class UpdateBillOfMaterialRequest {
  final double quantity;
  final String quantityType;
  final int umId;
  final double scrapPercentage;
  final double scrapFactor;
  final double fixedScrap;

  const UpdateBillOfMaterialRequest({
    required this.quantity,
    required this.quantityType,
    required this.umId,
    required this.scrapPercentage,
    required this.scrapFactor,
    required this.fixedScrap,
  });

  Map<String, dynamic> toJson() => {
        'quantity': quantity,
        'quantityType': quantityType,
        'umId': umId,
        'scrapPercentage': scrapPercentage,
        'scrapFactor': scrapFactor,
        'fixedScrap': fixedScrap,
      };
}
