import { createBrowserRouter, Navigate } from 'react-router-dom';
import { MainLayout } from '../layouts/MainLayout';
import { AdminLayout } from '../layouts/AdminLayout';
import { ProtectedRoute } from '../layouts/ProtectedRoute';

import { HomePage } from '../pages/HomePage';
import { ProductsPage } from '../features/products/pages/ProductsPage';
import { ProductDetailPage } from '../features/products/pages/ProductDetailPage';
import { CartPage } from '../features/cart/pages/CartPage';
import { CheckoutPage } from '../features/checkout/pages/CheckoutPage';
import { CheckoutSuccessPage } from '../features/checkout/pages/CheckoutSuccessPage';
import { MyOrdersPage } from '../features/orders/pages/MyOrdersPage';
import { LoginPage } from '../features/auth/pages/LoginPage';
import { RegisterPage } from '../features/auth/pages/RegisterPage';
import { ForgotPasswordPage } from '../features/auth/pages/ForgotPasswordPage';
import { ResetPasswordPage } from '../features/auth/pages/ResetPasswordPage';
import { ProfilePage } from '../features/account/pages/ProfilePage';
import { ContactPage } from '../pages/ContactPage';

import { AdminDashboardPage } from '../features/admin/pages/AdminDashboardPage';
import { AdminOrdersPage } from '../features/admin/pages/AdminOrdersPage';
import { AdminProductsPage } from '../features/admin/pages/AdminProductsPage';
import { AdminCategoriesPage } from '../features/admin/pages/AdminCategoriesPage';
import { AdminCouponsPage } from '../features/admin/pages/AdminCouponsPage';
import { AdminReviewsPage } from '../features/admin/pages/AdminReviewsPage';
import { AdminUsersPage } from '../features/admin/pages/AdminUsersPage';
import { AdminShippingZonesPage } from '../features/admin/pages/AdminShippingZonesPage';
import { AdminInventoryPage } from '../features/admin/pages/AdminInventoryPage';
import { UserRole } from '../types/enums';

export const router = createBrowserRouter([
  {
    path: '/',
    element: <MainLayout />,
    children: [
      { index: true, element: <HomePage /> },
      { path: 'products', element: <ProductsPage /> },
      { path: 'products/:slug', element: <ProductDetailPage /> },
      { path: 'cart', element: <CartPage /> },
      { path: 'checkout', element: <CheckoutPage /> },
      { path: 'checkout/success', element: <CheckoutSuccessPage /> },
      { path: 'contact', element: <ContactPage /> },
      { path: 'login', element: <LoginPage /> },
      { path: 'register', element: <RegisterPage /> },
      { path: 'forgot-password', element: <ForgotPasswordPage /> },
      { path: 'reset-password', element: <ResetPasswordPage /> },
      {
        path: 'account',
        element: <ProtectedRoute allowedRoles={[UserRole.CUSTOMER, UserRole.ADMIN, UserRole.STAFF]} />,
        children: [
          { path: 'profile', element: <ProfilePage /> },
          { path: 'orders', element: <MyOrdersPage /> },
        ],
      },
    ],
  },
  {
    path: '/admin',
    element: <ProtectedRoute allowedRoles={[UserRole.ADMIN, UserRole.STAFF]} />,
    children: [
      {
        element: <AdminLayout />,
        children: [
          { index: true, element: <AdminDashboardPage /> },
          { path: 'orders', element: <AdminOrdersPage /> },
          { path: 'products', element: <AdminProductsPage /> },
          { path: 'inventory', element: <AdminInventoryPage /> },
          { path: 'categories', element: <AdminCategoriesPage /> },
          { path: 'coupons', element: <AdminCouponsPage /> },
          { path: 'reviews', element: <AdminReviewsPage /> },
          { path: 'users', element: <AdminUsersPage /> },
          { path: 'shipping-zones', element: <AdminShippingZonesPage /> },
        ],
      },
    ],
  },
  { path: '*', element: <Navigate to="/" replace /> },
]);

