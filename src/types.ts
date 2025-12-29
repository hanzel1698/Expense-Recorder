export interface Item {
  name: string;
  price: number;
  category: string;
  subCategory: string;
  labels: string[];
  notes?: string;
}

export interface Receipt {
  id: string;
  date: string;
  shop: string;
  items: Item[];
}

export interface CategoryData {
  categories: { [key: string]: string[] }; // category -> subCategories
  labels: string[];
}