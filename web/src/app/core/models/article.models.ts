export interface CategoryResponse {
  id: number;
  name: string;
  description: string | null;
}

export interface CreateCategoryRequest {
  name: string;
  description?: string;
}

export interface UpdateCategoryRequest {
  name: string;
  description?: string;
}

export interface MeasureUnitResponse {
  id: number;
  name: string;
  description: string | null;
}

export interface CreateMeasureUnitRequest {
  name: string;
  description?: string;
}

export interface UpdateMeasureUnitRequest {
  name: string;
  description?: string;
}

export interface ArticleResponse {
  id: number;
  code: string;
  name: string;
  description: string | null;
  categoryId: number;
  categoryName: string;
  price: number;
  umId: number;
  umName: string;
  um2Id: number | null;
  um2Name: string | null;
  measures: string | null;
  composition: string | null;
  isActive: boolean;
  createdAt: string;
  createdByUsername: string;
  deletedAt: string | null;
  deletedByUsername: string | null;
}

export interface CreateArticleRequest {
  code: string;
  name: string;
  description?: string;
  categoryId: number;
  price: number;
  umId: number;
  um2Id?: number;
  measures?: string;
  composition?: string;
}

export interface UpdateArticleRequest {
  name: string;
  description?: string;
  categoryId: number;
  price: number;
  umId: number;
  um2Id?: number;
  measures?: string;
  composition?: string;
  isActive: boolean;
}

export interface BillOfMaterialResponse {
  parentArticleId: number;
  parentArticleCode: string;
  parentArticleName: string;
  componentArticleId: number;
  componentArticleCode: string;
  componentArticleName: string;
  quantity: number;
  quantityType: 'PHYSICAL' | 'PERCENTAGE';
  umId: number;
  umName: string;
  scrapPercentage: number;
  scrapFactor: number;
  fixedScrap: number;
}

export interface CreateBillOfMaterialRequest {
  parentArticleId: number;
  componentArticleId: number;
  quantity: number;
  quantityType: 'PHYSICAL' | 'PERCENTAGE';
  umId: number;
  scrapPercentage?: number;
  scrapFactor?: number;
  fixedScrap?: number;
}

export interface UpdateBillOfMaterialRequest {
  quantity: number;
  quantityType: 'PHYSICAL' | 'PERCENTAGE';
  umId: number;
  scrapPercentage?: number;
  scrapFactor?: number;
  fixedScrap?: number;
}

