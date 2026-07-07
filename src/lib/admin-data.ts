// Mock admin data for The Scent Lab dashboard.
// All numbers are illustrative — no backend required.

import { products, brands } from './data'
import type { Product, Brand } from './data'

export { products, brands }
export type { Product, Brand }

// ---------- Types ----------

export type OrderStatus = 'Delivered' | 'Shipped' | 'Processing' | 'Cancelled'
export type PaymentMethod = 'Visa' | 'Mastercard' | 'Amex' | 'PayPal' | 'Apple Pay'
export type CouponStatus = 'Active' | 'Expired'

export interface Order {
  id: string
  number: string
  customerName: string
  email: string
  date: string
  status: OrderStatus
  items: number
  total: number
  payment: PaymentMethod
}

export interface Customer {
  id: string
  name: string
  email: string
  orders: number
  totalSpent: number
  joined: string
  initials: string
  location: string
}

export interface Coupon {
  code: string
  discount: number
  uses: number
  maxUses: number
  status: CouponStatus
  expires: string
}

export interface RevenuePoint {
  month: string
  revenue: number
  orders: number
}

export interface TopProduct {
  name: string
  brand: string
  units: number
  revenue: number
}

export interface ActivityItem {
  id: string
  type: 'order' | 'customer' | 'product' | 'review'
  text: string
  time: string
}

export interface CustomerGrowthPoint {
  month: string
  total: number
  new: number
}

// ---------- Orders ----------

export const orders: Order[] = [
  {
    id: 'o1',
    number: '#SL-1024',
    customerName: 'Eleanor Whitfield',
    email: 'eleanor.w@example.com',
    date: 'Nov 24, 2024',
    status: 'Delivered',
    items: 2,
    total: 312,
    payment: 'Visa',
  },
  {
    id: 'o2',
    number: '#SL-1023',
    customerName: 'Marcus Tanaka',
    email: 'marcus.t@example.com',
    date: 'Nov 24, 2024',
    status: 'Shipped',
    items: 1,
    total: 245,
    payment: 'Mastercard',
  },
  {
    id: 'o3',
    number: '#SL-1022',
    customerName: 'Priya Nair',
    email: 'priya.n@example.com',
    date: 'Nov 23, 2024',
    status: 'Processing',
    items: 3,
    total: 528,
    payment: 'Amex',
  },
  {
    id: 'o4',
    number: '#SL-1021',
    customerName: 'Diego Fernández',
    email: 'diego.f@example.com',
    date: 'Nov 23, 2024',
    status: 'Delivered',
    items: 1,
    total: 175,
    payment: 'PayPal',
  },
  {
    id: 'o5',
    number: '#SL-1020',
    customerName: 'Yuki Tanaka',
    email: 'yuki.t@example.com',
    date: 'Nov 22, 2024',
    status: 'Cancelled',
    items: 2,
    total: 295,
    payment: 'Apple Pay',
  },
  {
    id: 'o6',
    number: '#SL-1019',
    customerName: 'Camille Beaumont',
    email: 'camille.b@example.com',
    date: 'Nov 22, 2024',
    status: 'Delivered',
    items: 1,
    total: 195,
    payment: 'Visa',
  },
  {
    id: 'o7',
    number: '#SL-1018',
    customerName: 'Theo Pappas',
    email: 'theo.p@example.com',
    date: 'Nov 21, 2024',
    status: 'Shipped',
    items: 4,
    total: 642,
    payment: 'Mastercard',
  },
  {
    id: 'o8',
    number: '#SL-1017',
    customerName: 'Inés Delgado',
    email: 'ines.d@example.com',
    date: 'Nov 21, 2024',
    status: 'Processing',
    items: 1,
    total: 88,
    payment: 'Visa',
  },
]

// ---------- Customers ----------

export const customers: Customer[] = [
  {
    id: 'c1',
    name: 'Eleanor Whitfield',
    email: 'eleanor.w@example.com',
    orders: 14,
    totalSpent: 3842,
    joined: 'Mar 12, 2023',
    initials: 'EW',
    location: 'London, UK',
  },
  {
    id: 'c2',
    name: 'Marcus Tanaka',
    email: 'marcus.t@example.com',
    orders: 9,
    totalSpent: 2156,
    joined: 'Jun 03, 2023',
    initials: 'MT',
    location: 'Tokyo, JP',
  },
  {
    id: 'c3',
    name: 'Priya Nair',
    email: 'priya.n@example.com',
    orders: 22,
    totalSpent: 6198,
    joined: 'Jan 21, 2023',
    initials: 'PN',
    location: 'Mumbai, IN',
  },
  {
    id: 'c4',
    name: 'Diego Fernández',
    email: 'diego.f@example.com',
    orders: 5,
    totalSpent: 924,
    joined: 'Sep 14, 2023',
    initials: 'DF',
    location: 'Madrid, ES',
  },
  {
    id: 'c5',
    name: 'Yuki Tanaka',
    email: 'yuki.t@example.com',
    orders: 11,
    totalSpent: 2731,
    joined: 'Apr 28, 2023',
    initials: 'YT',
    location: 'Osaka, JP',
  },
  {
    id: 'c6',
    name: 'Camille Beaumont',
    email: 'camille.b@example.com',
    orders: 7,
    totalSpent: 1487,
    joined: 'Jul 19, 2023',
    initials: 'CB',
    location: 'Paris, FR',
  },
]

// ---------- Coupons ----------

export const coupons: Coupon[] = [
  {
    code: 'SCENT10',
    discount: 10,
    uses: 412,
    maxUses: 1000,
    status: 'Active',
    expires: 'Dec 31, 2024',
  },
  {
    code: 'WELCOME15',
    discount: 15,
    uses: 286,
    maxUses: 500,
    status: 'Active',
    expires: 'Jan 31, 2025',
  },
  {
    code: 'FREESHIP',
    discount: 0,
    uses: 1024,
    maxUses: 2000,
    status: 'Active',
    expires: 'Dec 31, 2024',
  },
  {
    code: 'SUMMER25',
    discount: 25,
    uses: 500,
    maxUses: 500,
    status: 'Expired',
    expires: 'Aug 31, 2024',
  },
]

// ---------- Analytics ----------

export const revenueByMonth: RevenuePoint[] = [
  { month: 'Jan', revenue: 18420, orders: 92 },
  { month: 'Feb', revenue: 21380, orders: 108 },
  { month: 'Mar', revenue: 24190, orders: 121 },
  { month: 'Apr', revenue: 22870, orders: 117 },
  { month: 'May', revenue: 26540, orders: 132 },
  { month: 'Jun', revenue: 29820, orders: 148 },
  { month: 'Jul', revenue: 31250, orders: 156 },
  { month: 'Aug', revenue: 28960, orders: 144 },
  { month: 'Sep', revenue: 32140, orders: 161 },
  { month: 'Oct', revenue: 35780, orders: 178 },
  { month: 'Nov', revenue: 39820, orders: 198 },
  { month: 'Dec', revenue: 23350, orders: 119 },
]

export const topProducts: TopProduct[] = [
  { name: 'Baccarat Rouge 540 EDP', brand: 'Maison Francis Kurkdjian', units: 184, revenue: 44160 },
  { name: 'Sauvage EDT', brand: 'Dior', units: 162, revenue: 21924 },
  { name: 'Aventus', brand: 'Creed', units: 98, revenue: 36910 },
  { name: 'Santal 33', brand: 'Le Labo', units: 124, revenue: 29760 },
  { name: 'Bleu de Chanel EDP', brand: 'Chanel', units: 87, revenue: 18615 },
  { name: 'Black Opium EDP', brand: 'YSL', units: 76, revenue: 11856 },
  { name: 'Tobacco Vanille', brand: 'Tom Ford', units: 54, revenue: 16470 },
]

export const customerGrowth: CustomerGrowthPoint[] = [
  { month: 'Jan', total: 412, new: 28 },
  { month: 'Feb', total: 438, new: 26 },
  { month: 'Mar', total: 471, new: 33 },
  { month: 'Apr', total: 498, new: 27 },
  { month: 'May', total: 532, new: 34 },
  { month: 'Jun', total: 578, new: 46 },
  { month: 'Jul', total: 619, new: 41 },
  { month: 'Aug', total: 654, new: 35 },
  { month: 'Sep', total: 701, new: 47 },
  { month: 'Oct', total: 762, new: 61 },
  { month: 'Nov', total: 838, new: 76 },
  { month: 'Dec', total: 892, new: 54 },
]

export const ordersByStatus: { name: OrderStatus; value: number; color: string }[] = [
  { name: 'Delivered', value: 1042, color: 'var(--success)' },
  { name: 'Shipped', value: 138, color: 'var(--brand)' },
  { name: 'Processing', value: 64, color: '#d97706' },
  { name: 'Cancelled', value: 40, color: 'var(--danger)' },
]

export const recentActivity: ActivityItem[] = [
  { id: 'a1', type: 'order', text: 'New order #SL-1024 from Eleanor Whitfield', time: '2 min ago' },
  { id: 'a2', type: 'customer', text: 'Camille Beaumont created an account', time: '18 min ago' },
  { id: 'a3', type: 'order', text: 'Order #SL-1022 marked as Processing', time: '41 min ago' },
  { id: 'a4', type: 'review', text: 'New 5-star review on Santal 33', time: '1 hr ago' },
  { id: 'a5', type: 'product', text: 'Low stock alert: Baccarat Rouge 540 (12 left)', time: '2 hr ago' },
  { id: 'a6', type: 'order', text: 'Order #SL-1020 was cancelled', time: '3 hr ago' },
  { id: 'a7', type: 'customer', text: 'Diego Fernández placed their 5th order', time: '5 hr ago' },
]

// ---------- Summary stats (used on Dashboard) ----------

export const summaryStats = {
  totalRevenue: 284520,
  orders: 1284,
  customers: 892,
  avgOrderValue: 221,
  revenueTrend: 12.4,
  ordersTrend: 8.2,
  customersTrend: 15.6,
  aovTrend: -2.1,
}

// ---------- Helpers ----------

export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value)
}

export function formatNumber(value: number): string {
  return new Intl.NumberFormat('en-US').format(value)
}
