import React, { useState } from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import {
  Package,
  ShoppingCart,
  Tag,
  Star,
  Users,
  LayoutDashboard,
  LogOut,
  Menu,
  X,
  ExternalLink,
  Bell,
  ShieldCheck,
  FolderTree,
  MapPin,
  Boxes,
} from 'lucide-react';
import { useAuth } from '../app/providers/AuthProvider';
import { useAdminOrderNotifications } from '../features/admin/hooks/useAdminOrderNotifications';

const NAV_ITEMS = [
  { to: '/admin', label: 'Vue d\'ensemble', icon: LayoutDashboard, exact: true },
  { to: '/admin/orders', label: 'Commandes', icon: ShoppingCart },
  { to: '/admin/products', label: 'Catalogue & Stocks', icon: Package },
  { to: '/admin/inventory', label: 'Inventaire', icon: Boxes },
  { to: '/admin/categories', label: 'Catégories', icon: FolderTree },
  { to: '/admin/coupons', label: 'Coupons & Promos', icon: Tag },
  { to: '/admin/reviews', label: 'Avis Clients', icon: Star },
  { to: '/admin/users', label: 'Utilisateurs', icon: Users },
  { to: '/admin/shipping-zones', label: 'Zones de livraison', icon: MapPin },
];

export const AdminLayout: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const { notifications, unreadCount, markAllAsRead } = useAdminOrderNotifications();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const isActiveRoute = (item: (typeof NAV_ITEMS)[0]) => {
    if (item.exact) {
      return location.pathname === '/admin';
    }
    return location.pathname.startsWith(item.to);
  };

  const SidebarContent = () => (
    <div className="flex flex-col h-full bg-white text-[#1a1a1a]">
      {/* Brand logo header */}
      <div className="flex items-center gap-3 px-6 py-5 border-b border-[#e1e3e5]">
        <div className="w-9 h-9 bg-[#008060] rounded-xl flex items-center justify-center text-white shadow-xs">
          <span className="font-black text-lg">H</span>
        </div>
        <div>
          <h2 className="font-bold text-[#1a1a1a] text-base tracking-tight leading-none flex items-center gap-1.5">
            HAYAT <span className="text-[#008060] font-semibold">ADMIN</span>
          </h2>
          <p className="text-[11px] text-[#6d7175] mt-1 flex items-center gap-1">
            <ShieldCheck className="w-3 h-3 text-[#008060]" /> Espace Gestion
          </p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-6 space-y-1 overflow-y-auto">
        <p className="px-3 text-[11px] font-bold uppercase tracking-wider text-[#6d7175] mb-2">
          Menu principal
        </p>
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const active = isActiveRoute(item);
          return (
            <Link
              key={item.to}
              to={item.to}
              onClick={() => setIsSidebarOpen(false)}
              className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all ${
                active
                  ? 'bg-[#008060] text-white shadow-sm shadow-[#008060]/20'
                  : 'text-[#6d7175] hover:bg-[#f6f6f7] hover:text-[#1a1a1a]'
              }`}
            >
              <Icon className={`w-4 h-4 ${active ? 'text-white' : 'text-[#6d7175]'}`} />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Footer Profile & Logout */}
      <div className="p-4 border-t border-[#e1e3e5] bg-[#f6f6f7]">
        <div className="flex items-center gap-3 px-2 py-2 mb-2 bg-white rounded-xl border border-[#e1e3e5]">
          <div className="w-8 h-8 rounded-full bg-[#f0f9f6] text-[#008060] flex items-center justify-center font-bold text-xs border border-[#008060]/20">
            {user?.firstName ? user.firstName[0].toUpperCase() : 'A'}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-semibold text-[#1a1a1a] truncate">
              {user?.firstName ? `${user.firstName} ${user.lastName || ''}` : 'Admin'}
            </p>
            <p className="text-[10px] text-[#6d7175] truncate">{user?.email}</p>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-xs font-medium text-[#d82c0d] hover:bg-[#fdf2f2] border border-[#d82c0d]/20 transition-colors cursor-pointer"
        >
          <LogOut className="w-3.5 h-3.5" /> Se déconnecter
        </button>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen bg-[#f6f6f7] text-[#1a1a1a] overflow-hidden">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex lg:flex-col w-64 bg-white border-r border-[#e1e3e5] shrink-0">
        <SidebarContent />
      </aside>

      {/* Mobile Drawer */}
      {isSidebarOpen && (
        <>
          <div
            className="fixed inset-0 bg-black/40 z-40 lg:hidden backdrop-blur-xs"
            onClick={() => setIsSidebarOpen(false)}
          />
          <aside className="fixed left-0 top-0 h-full w-64 bg-white border-r border-[#e1e3e5] z-50 flex flex-col lg:hidden">
            <div className="absolute right-3 top-4">
              <button
                onClick={() => setIsSidebarOpen(false)}
                className="p-1 rounded-lg hover:bg-[#f6f6f7] text-[#6d7175]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <SidebarContent />
          </aside>
        </>
      )}

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        {/* Top Header */}
        <header className="flex items-center justify-between px-6 py-4 bg-white border-b border-[#e1e3e5] shrink-0">
          <div className="flex items-center gap-3">
            <button
              className="lg:hidden p-2 rounded-xl border border-[#e1e3e5] text-[#1a1a1a] hover:bg-[#f6f6f7] transition-colors cursor-pointer"
              onClick={() => setIsSidebarOpen(true)}
            >
              <Menu className="w-5 h-5" />
            </button>
            <div>
              <h1 className="font-bold text-[#1a1a1a] text-lg leading-tight">
                {NAV_ITEMS.find((n) => isActiveRoute(n))?.label ?? 'Tableau de bord'}
              </h1>
              {/* <p className="text-xs text-[#6d7175] hidden sm:block">
                Gestion générale des activités de la boutique Hayat Store Dakar
              </p> */}
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* <div className="hidden md:flex items-center gap-2 bg-[#f0f9f6] text-[#008060] px-3 py-1.5 rounded-full text-xs font-semibold border border-[#008060]/20">
              <span className="w-2 h-2 bg-[#008060] rounded-full animate-pulse" />
              Boutique en ligne Active
            </div> */}

            <div className="relative">
              <button
                onClick={() => {
                  window.dispatchEvent(new Event('admin-notification-interaction'));
                  setIsNotificationsOpen((current) => !current);
                  markAllAsRead();
                }}
                aria-label="Notifications"
                aria-expanded={isNotificationsOpen}
                className="p-2 rounded-xl text-[#6d7175] hover:bg-[#f6f6f7] relative cursor-pointer border border-[#e1e3e5]"
              >
                <Bell className={`w-4 h-4 ${unreadCount > 0 ? 'text-[#008060]' : ''}`} />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 min-w-5 h-5 px-1 bg-[#d82c0d] text-white rounded-full text-[10px] font-bold flex items-center justify-center">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </button>

              {isNotificationsOpen && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setIsNotificationsOpen(false)} />
                  <div className="absolute right-0 top-full mt-2 z-20 w-80 max-w-[calc(100vw-2rem)] overflow-hidden rounded-2xl border border-[#e1e3e5] bg-white shadow-xl">
                    <div className="flex items-center justify-between border-b border-[#e1e3e5] bg-[#f6f6f7] px-4 py-3">
                      <div>
                        <h2 className="text-sm font-bold text-[#1a1a1a]">Notifications</h2>
                        <p className="text-[11px] text-[#6d7175]">Nouvelles commandes reçues</p>
                      </div>
                      <Bell className="w-4 h-4 text-[#008060]" />
                    </div>
                    {notifications.length === 0 ? (
                      <p className="px-4 py-8 text-center text-xs text-[#6d7175]">Aucune nouvelle commande.</p>
                    ) : (
                      <div className="max-h-80 overflow-y-auto divide-y divide-[#e1e3e5]">
                        {notifications.map((notification) => (
                          <Link
                            key={notification.id}
                            to="/admin/orders"
                            onClick={() => setIsNotificationsOpen(false)}
                            className="block px-4 py-3 hover:bg-[#f6f6f7] transition-colors"
                          >
                            <div className="flex items-start justify-between gap-3">
                              <p className="text-xs font-bold text-[#1a1a1a]">{notification.title || 'Nouvelle commande'}</p>
                              <span className="text-[10px] text-[#6d7175] whitespace-nowrap">
                                {new Date(notification.createdAt).toLocaleDateString('fr-FR')}
                              </span>
                            </div>
                            <p className="mt-1 text-xs text-[#008060] font-semibold">
                              {notification.orderNumber || notification.data?.orderNumber || notification.message || 'Commande reçue'}
                            </p>
                            {(notification.orderId || notification.data?.orderId) && (
                              <p className="mt-0.5 text-[11px] text-[#6d7175] truncate">Référence : {notification.orderId || notification.data?.orderId}</p>
                            )}
                          </Link>
                        ))}
                      </div>
                    )}
                    <Link
                      to="/admin/orders"
                      onClick={() => setIsNotificationsOpen(false)}
                      className="block border-t border-[#e1e3e5] px-4 py-3 text-center text-xs font-semibold text-[#008060] hover:bg-[#f0f9f6]"
                    >
                      Gérer les commandes
                    </Link>
                  </div>
                </>
              )}
            </div>

            <Link
              to="/"
              className="inline-flex items-center gap-1.5 bg-white border border-[#e1e3e5] text-[#1a1a1a] hover:bg-[#f6f6f7] text-xs font-semibold px-3.5 py-2 rounded-xl transition-colors shadow-2xs"
            >
              <span>Voir le site</span>
              <ExternalLink className="w-3.5 h-3.5 text-[#008060]" />
            </Link>
          </div>
        </header>

        {/* Content Body */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 md:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

