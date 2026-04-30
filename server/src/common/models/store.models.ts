export enum RoleName {
  GUEST = 'GUEST',
  USER = 'USER',
  ADMIN = 'ADMIN',
  CONTENT_MANAGER = 'CONTENT_MANAGER',
}

export enum MediaType {
  IMAGE = 'IMAGE',
  VIDEO = 'VIDEO',
}

export enum OrderStatus {
  NEW = 'NEW',
  CONFIRMED = 'CONFIRMED',
  ASSEMBLING = 'ASSEMBLING',
  SHIPPED = 'SHIPPED',
  DELIVERED = 'DELIVERED',
  CANCELLED = 'CANCELLED',
}

export type ContrastMode = 'default' | 'high';
export type LineSpacing = 'normal' | 'wide';

export interface AccessibilitySettings {
  id: number;
  userId: number;
  fontScale: number;
  contrastMode: ContrastMode;
  lineSpacing: LineSpacing;
  hideImages: boolean;
  reducedMotion: boolean;
  voiceHints: boolean;
  captionsDefault: boolean;
  focusHighlight: boolean;
}

export interface User {
  id: number;
  role: RoleName;
  email: string;
  passwordHash: string;
  fullName: string;
  phone?: string;
  createdAt: string;
  isActive: boolean;
}

export interface Category {
  id: number;
  parentId: number | null;
  name: string;
  slug: string;
  sortOrder: number;
}

export interface ProductMedia {
  id: number;
  productId: number;
  mediaType: MediaType;
  fileUrl: string;
  altText: string;
  captionUrl?: string;
  transcriptUrl?: string;
  sortOrder: number;
}

export interface Review {
  id: number;
  productId: number;
  userId: number;
  rating: number;
  advantages?: string;
  disadvantages?: string;
  comment: string;
  authorName: string;
}

export interface Product {
  id: number;
  categoryId: number;
  sku: string;
  name: string;
  description: string;
  price: number;
  stockQty: number;
  isActive: boolean;
  characteristics: Record<string, string>;
  mediaIds: number[];
  reviewIds: number[];
  badge?: string;
}

export interface Favorite {
  id: number;
  userId: number;
  productId: number;
  createdAt: string;
}

export interface CartItem {
  id: number;
  cartId: number;
  productId: number;
  quantity: number;
  priceAtAdd: number;
}

export interface Cart {
  id: number;
  userId: number | null;
  sessionId: string | null;
  createdAt: string;
  updatedAt: string;
  itemIds: number[];
}

export interface DeliveryMethod {
  id: number;
  name: string;
  description: string;
  price: number;
  isActive: boolean;
}

export interface PaymentMethod {
  id: number;
  name: string;
  description: string;
  isActive: boolean;
}

export interface OrderItem {
  id: number;
  orderId: number;
  productId: number;
  quantity: number;
  unitPrice: number;
}

export interface Order {
  id: number;
  userId: number | null;
  deliveryMethodId: number;
  paymentMethodId: number;
  status: OrderStatus;
  totalAmount: number;
  recipientName: string;
  recipientPhone: string;
  deliveryAddress: string;
  comment?: string;
  createdAt: string;
  itemIds: number[];
}

export interface JwtPayload {
  sub: number;
  email: string;
  role: RoleName;
}
