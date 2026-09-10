export interface Product {
  id: string;
  code: string;
  name: string;
  category: string;
  description?: string;
  benefits?: string[] | string;
  dosage?: string;
  price?: number;
  salesVolume?: number;
  imageUrl: string;
  aClicUrl?: string;
  purchaseUrl?: string;
  [key: string]: any;
}
