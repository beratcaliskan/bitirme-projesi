interface StockVariant {
  price: number;
  stock: number;
  size_id?: string;
  color_id?: string;
}

export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  brand: string;
  image_url: string;
  stock: StockVariant[]
  created_at: string;
}

export interface CreateProductData {
  name: string;
  description: string;
  price: number;
  image_url: string;
}

export interface UpdateProductData extends Partial<CreateProductData> {
  id: string;
} 