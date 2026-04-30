export type FavoriteItem = {
  id: number;
  productId: number;
  createdAt: string;
  product: {
    id: number;
    name: string;
    description: string;
    price: number;
    stockQty?: number;
    badge?: string;
    category?: { id: number; name: string; slug: string };
    media?: Array<{ fileUrl: string; altText: string }>;
  };
};
