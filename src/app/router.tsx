import { lazy, Suspense, type ReactNode } from 'react';
import { createBrowserRouter, Navigate } from 'react-router-dom';
import { MainLayout } from '../layouts/MainLayout';
import { AdminLayout } from '../layouts/AdminLayout';
import { ProtectedRoute } from '../layouts/ProtectedRoute';
import { UserRole } from '../types/enums';

const HomePage = lazy(() => import('../pages/HomePage').then((m) => ({ default: m.HomePage })));
const ProductsPage = lazy(() => import('../features/products/pages/ProductsPage').then((m) => ({ default: m.ProductsPage })));
const ProductDetailPage = lazy(() => import('../features/products/pages/ProductDetailPage').then((m) => ({ default: m.ProductDetailPage })));
const CartPage = lazy(() => import('../features/cart/pages/CartPage').then((m) => ({ default: m.CartPage })));
const CheckoutPage = lazy(() => import('../features/checkout/pages/CheckoutPage').then((m) => ({ default: m.CheckoutPage })));
const CheckoutSuccessPage = lazy(() => import('../features/checkout/pages/CheckoutSuccessPage').then((m) => ({ default: m.CheckoutSuccessPage })));
const MyOrdersPage = lazy(() => import('../features/orders/pages/MyOrdersPage').then((m) => ({ default: m.MyOrdersPage })));
const LoginPage = lazy(() => import('../features/auth/pages/LoginPage').then((m) => ({ default: m.LoginPage })));
const RegisterPage = lazy(() => import('../features/auth/pages/RegisterPage').then((m) => ({ default: m.RegisterPage })));
const ForgotPasswordPage = lazy(() => import('../features/auth/pages/ForgotPasswordPage').then((m) => ({ default: m.ForgotPasswordPage })));
const ResetPasswordPage = lazy(() => import('../features/auth/pages/ResetPasswordPage').then((m) => ({ default: m.ResetPasswordPage })));
const ProfilePage = lazy(() => import('../features/account/pages/ProfilePage').then((m) => ({ default: m.ProfilePage })));
const ContactPage = lazy(() => import('../pages/ContactPage').then((m) => ({ default: m.ContactPage })));

const AdminDashboardPage = lazy(() => import('../features/admin/pages/AdminDashboardPage').then((m) => ({ default: m.AdminDashboardPage })));
const AdminOrdersPage = lazy(() => import('../features/admin/pages/AdminOrdersPage').then((m) => ({ default: m.AdminOrdersPage })));
const AdminProductsPage = lazy(() => import('../features/admin/pages/AdminProductsPage').then((m) => ({ default: m.AdminProductsPage })));
const AdminCategoriesPage = lazy(() => import('../features/admin/pages/AdminCategoriesPage').then((m) => ({ default: m.AdminCategoriesPage })));
const AdminCouponsPage = lazy(() => import('../features/admin/pages/AdminCouponsPage').then((m) => ({ default: m.AdminCouponsPage })));
const AdminReviewsPage = lazy(() => import('../features/admin/pages/AdminReviewsPage').then((m) => ({ default: m.AdminReviewsPage })));
const AdminUsersPage = lazy(() => import('../features/admin/pages/AdminUsersPage').then((m) => ({ default: m.AdminUsersPage })));
const AdminShippingZonesPage = lazy(() => import('../features/admin/pages/AdminShippingZonesPage').then((m) => ({ default: m.AdminShippingZonesPage })));
const AdminInventoryPage = lazy(() => import('../features/admin/pages/AdminInventoryPage').then((m) => ({ default: m.AdminInventoryPage })));

function PageLoader() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center py-20">
      <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary/30 border-t-primary" />
    </div>
  );
}

const withSuspense = (element: ReactNode) => (
  <Suspense fallback={<PageLoader />}>{element}</Suspense>
);

export const router = createBrowserRouter([
  {
    path: '/',
    element: <MainLayout />,
    children: [
      { index: true, element: withSuspense(<HomePage />) },
      { path: 'products', element: withSuspense(<ProductsPage />) },
      { path: 'products/:slug', element: withSuspense(<ProductDetailPage />) },
      { path: 'cart', element: withSuspense(<CartPage />) },
      { path: 'checkout', element: withSuspense(<CheckoutPage />) },
      { path: 'checkout/success', element: withSuspense(<CheckoutSuccessPage />) },
      { path: 'contact', element: withSuspense(<ContactPage />) },
      { path: 'login', element: withSuspense(<LoginPage />) },
      { path: 'register', element: withSuspense(<RegisterPage />) },
      { path: 'forgot-password', element: withSuspense(<ForgotPasswordPage />) },
      { path: 'reset-password', element: withSuspense(<ResetPasswordPage />) },
      {
        path: 'account',
        element: <ProtectedRoute allowedRoles={[UserRole.CUSTOMER, UserRole.ADMIN, UserRole.STAFF]} />,
        children: [
          { path: 'profile', element: withSuspense(<ProfilePage />) },
          { path: 'orders', element: withSuspense(<MyOrdersPage />) },
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
          { index: true, element: withSuspense(<AdminDashboardPage />) },
          { path: 'orders', element: withSuspense(<AdminOrdersPage />) },
          { path: 'products', element: withSuspense(<AdminProductsPage />) },
          { path: 'inventory', element: withSuspense(<AdminInventoryPage />) },
          { path: 'categories', element: withSuspense(<AdminCategoriesPage />) },
          { path: 'coupons', element: withSuspense(<AdminCouponsPage />) },
          { path: 'reviews', element: withSuspense(<AdminReviewsPage />) },
          { path: 'users', element: withSuspense(<AdminUsersPage />) },
          { path: 'shipping-zones', element: withSuspense(<AdminShippingZonesPage />) },
        ],
      },
    ],
  },
  { path: '*', element: <Navigate to="/" replace /> },
]);
