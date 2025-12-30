// Menu permissions for roles
export type MenuPermission = 
  | 'dashboard'
  | 'products'
  | 'categories'
  | 'sales'
  | 'brilink'
  | 'reports'
  | 'users'
  | 'roles'
  | 'audit_logs';

export const ALL_MENU_PERMISSIONS: { key: MenuPermission; label: string; path: string }[] = [
  { key: 'dashboard', label: 'Dashboard', path: '/' },
  { key: 'products', label: 'Produk', path: '/products' },
  { key: 'categories', label: 'Kategori', path: '/categories' },
  { key: 'sales', label: 'Penjualan', path: '/sales' },
  { key: 'brilink', label: 'BRILink', path: '/brilink' },
  { key: 'reports', label: 'Laporan', path: '/reports' },
  { key: 'users', label: 'Pengguna', path: '/users' },
  { key: 'roles', label: 'Role', path: '/roles' },
  { key: 'audit_logs', label: 'Audit Log', path: '/audit-logs' },
];

// Role types
export interface Role {
  id: string;
  name: string;
  description?: string;
  permissions: MenuPermission[];
  isSystem?: boolean; // System roles cannot be deleted
  createdAt: Date;
  updatedAt: Date;
}

// User types
export interface User {
  id: string;
  email: string;
  name: string;
  roleId: string;
  roleName?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt?: Date;
}

// Category types
export interface Category {
  id: string;
  name: string;
  description?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// Product types
export interface Product {
  id: string;
  name: string;
  sku: string;
  categoryId: string;
  categoryName?: string;
  price: number;
  buyPrice: number;
  stock: number;
  minStock: number;
  unit: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// Transaction types
export interface CartItem {
  product: Product;
  quantity: number;
  subtotal: number;
}

export interface Transaction {
  id: string;
  type: 'sale';
  items: TransactionItem[];
  subtotal: number;
  discount: number;
  total: number;
  paymentMethod: 'cash' | 'transfer' | 'qris';
  amountPaid: number;
  change: number;
  cashierId: string;
  cashierName: string;
  createdAt: Date;
}

export interface TransactionItem {
  productId: string;
  productName: string;
  categoryId?: string;
  categoryName?: string;
  quantity: number;
  price: number;
  buyPrice: number;
  subtotal: number;
}

// BRILink types
export type BRILinkTransactionType = 
  | 'transfer'
  | 'cash_deposit'
  | 'cash_withdrawal'
  | 'payment'
  | 'topup'
  | 'griya_bayar'
  | 'propana';

export type BRILinkProfitCategory = 'brilink' | 'griya_bayar' | 'propana';

export interface BRILinkTransaction {
  id: string;
  transactionType: BRILinkTransactionType;
  profitCategory: BRILinkProfitCategory;
  description: string; // legacy - for backward compatibility
  accountName?: string;
  accountNumber?: string;
  amount: number;
  adminFee: number;
  profit: number;
  endingBalance?: number;
  customerName?: string;
  customerPhone?: string;
  referenceNo?: string; // legacy - for backward compatibility
  operatorId: string;
  operatorName: string;
  createdAt: Date;
}

// Report types
export interface DailySummary {
  date: string;
  totalSales: number;
  totalTransactions: number;
  totalBRILink: number;
  totalBRILinkProfit: number;
  totalRevenue: number;
}

// Form types
export interface LoginFormData {
  email: string;
  password: string;
}

export interface ProductFormData {
  name: string;
  sku: string;
  categoryId: string;
  price: number;
  buyPrice: number;
  stock: number;
  minStock: number;
  unit: string;
  isActive: boolean;
}

export interface BRILinkFormData {
  transactionType: BRILinkTransactionType;
  profitCategory: BRILinkProfitCategory;
  accountName: string;
  accountNumber: string;
  amount: number;
  adminFee: number;
  profit: number;
  endingBalance?: number;
  customerName?: string;
  customerPhone?: string;
  saveAccount?: boolean;
}

export interface SavedBRILinkAccount {
  id: string;
  accountName: string;
  accountNumber: string;
  createdAt: Date;
}

export interface RoleFormData {
  name: string;
  description?: string;
  permissions: MenuPermission[];
}

export interface UserFormData {
  email: string;
  password?: string;
  name: string;
  roleId: string;
  isActive: boolean;
}

export interface CategoryFormData {
  name: string;
  description?: string;
  isActive: boolean;
}

// Audit Log types
export type AuditModule = 
  | 'products'
  | 'categories'
  | 'sales'
  | 'brilink'
  | 'users'
  | 'roles';

export type AuditAction = 'create' | 'update' | 'delete';

export interface AuditLog {
  id: string;
  module: AuditModule;
  action: AuditAction;
  entityId: string;
  entityName: string;
  userId: string;
  userName: string;
  beforeData: Record<string, unknown> | null;
  afterData: Record<string, unknown> | null;
  createdAt: Date;
}
