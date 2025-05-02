export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  imageUrl: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateProductData {
  name: string;
  description: string;
  price: number;
  imageUrl: string;
}

export interface UpdateProductData extends Partial<CreateProductData> {
  id: string;
} 