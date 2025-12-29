export interface Item {
  name: string;
  price: number;
  category: string;
  subCategory: string;
  labels: string[];
  notes?: string;
  gst?: number;
}

export interface Receipt {
  id: string;
  date: string;
  shop: string;
  items: Item[];
  paymentMode?: string;
  gst?: number;
}

export interface CategoryData {
  categories: { [key: string]: string[] }; // category -> subCategories
  labels: string[];
  paymentModes: string[];
}