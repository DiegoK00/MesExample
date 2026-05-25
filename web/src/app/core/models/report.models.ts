export interface TopArticleResponse {
  articleId: number;
  code: string;
  name: string;
  categoryName: string;
  usageCount: number;
  totalQuantity: number;
  umName: string;
}

export interface ProductionKpiResponse {
  totalArticlesActive: number;
  totalArticlesInactive: number;
  totalBomParents: number;
  totalBomComponents: number;
  avgComponentsPerBom: number;
  articlesCreatedLast30Days: number;
  totalScrapPercentageAvg: number;
  articlesByCategory: CategoryKpiItem[];
  creationTrend: CreationTrendItem[];
}

export interface CategoryKpiItem {
  categoryName: string;
  articleCount: number;
  bomCount: number;
}

export interface CreationTrendItem {
  month: string;
  count: number;
}
