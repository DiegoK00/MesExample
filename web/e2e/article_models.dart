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

  factory BillOfMaterialResponse.fromJson(Map<String, dynamic> json) {
    return BillOfMaterialResponse(
      parentArticleId: json['parentArticleId'],
      parentArticleCode: json['parentArticleCode'],
      parentArticleName: json['parentArticleName'],
      componentArticleId: json['componentArticleId'],
      componentArticleCode: json['componentArticleCode'],
      componentArticleName: json['componentArticleName'],
      quantity: (json['quantity'] as num).toDouble(),
      quantityType: json['quantityType'],
      umId: json['umId'],
      umName: json['umName'],
      scrapPercentage: (json['scrapPercentage'] as num).toDouble(),
      scrapFactor: (json['scrapFactor'] as num).toDouble(),
      fixedScrap: (json['fixedScrap'] as num).toDouble(),
    );
  }
}