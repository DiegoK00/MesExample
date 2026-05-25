class TopArticleResponse {
  final int articleId;
  final String code;
  final String name;
  final String categoryName;
  final int usageCount;
  final double totalQuantity;
  final String umName;

  const TopArticleResponse({
    required this.articleId,
    required this.code,
    required this.name,
    required this.categoryName,
    required this.usageCount,
    required this.totalQuantity,
    required this.umName,
  });

  factory TopArticleResponse.fromJson(Map<String, dynamic> json) => TopArticleResponse(
        articleId:     json['articleId'] as int,
        code:          json['code'] as String,
        name:          json['name'] as String,
        categoryName:  json['categoryName'] as String,
        usageCount:    json['usageCount'] as int,
        totalQuantity: (json['totalQuantity'] as num).toDouble(),
        umName:        json['umName'] as String,
      );
}

class ProductionKpiResponse {
  final int totalArticlesActive;
  final int totalArticlesInactive;
  final int totalBomParents;
  final int totalBomComponents;
  final double avgComponentsPerBom;
  final int articlesCreatedLast30Days;
  final double totalScrapPercentageAvg;
  final List<CategoryKpiItem> articlesByCategory;
  final List<CreationTrendItem> creationTrend;

  const ProductionKpiResponse({
    required this.totalArticlesActive,
    required this.totalArticlesInactive,
    required this.totalBomParents,
    required this.totalBomComponents,
    required this.avgComponentsPerBom,
    required this.articlesCreatedLast30Days,
    required this.totalScrapPercentageAvg,
    required this.articlesByCategory,
    required this.creationTrend,
  });

  factory ProductionKpiResponse.fromJson(Map<String, dynamic> json) => ProductionKpiResponse(
        totalArticlesActive:       json['totalArticlesActive'] as int,
        totalArticlesInactive:     json['totalArticlesInactive'] as int,
        totalBomParents:           json['totalBomParents'] as int,
        totalBomComponents:        json['totalBomComponents'] as int,
        avgComponentsPerBom:       (json['avgComponentsPerBom'] as num).toDouble(),
        articlesCreatedLast30Days: json['articlesCreatedLast30Days'] as int,
        totalScrapPercentageAvg:   (json['totalScrapPercentageAvg'] as num).toDouble(),
        articlesByCategory: (json['articlesByCategory'] as List)
            .map((e) => CategoryKpiItem.fromJson(e as Map<String, dynamic>))
            .toList(),
        creationTrend: (json['creationTrend'] as List)
            .map((e) => CreationTrendItem.fromJson(e as Map<String, dynamic>))
            .toList(),
      );
}

class CategoryKpiItem {
  final String categoryName;
  final int articleCount;
  final int bomCount;

  const CategoryKpiItem({
    required this.categoryName,
    required this.articleCount,
    required this.bomCount,
  });

  factory CategoryKpiItem.fromJson(Map<String, dynamic> json) => CategoryKpiItem(
        categoryName: json['categoryName'] as String,
        articleCount: json['articleCount'] as int,
        bomCount:     json['bomCount'] as int,
      );
}

class CreationTrendItem {
  final String month;
  final int count;

  const CreationTrendItem({required this.month, required this.count});

  factory CreationTrendItem.fromJson(Map<String, dynamic> json) => CreationTrendItem(
        month: json['month'] as String,
        count: json['count'] as int,
      );
}
