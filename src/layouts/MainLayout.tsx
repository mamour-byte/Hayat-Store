import React, { useState } from 'react';
import { Link, Outlet, useNavigate } from 'react-router-dom';
import {
  ShoppingCart,
  Search,
  User,
  LogOut,
  Package,
  ChevronDown,
  Menu,
  X,
} from 'lucide-react';
import { useAuth } from '../app/providers/AuthProvider';
import { useCart } from '../app/providers/CartProvider';
import { CartDrawer } from '../features/cart/components/CartDrawer';
import { Input } from '../components/ui/Input';

export const MainLayout: React.FC = () => {
  const { user, isAuthenticated, logout } = useAuth();
  const { itemCount } = useCart();
  const navigate = useNavigate();

  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/products?search=${encodeURIComponent(searchQuery.trim())}`);
      setSearchQuery('');
    }
  };

  const handleLogout = async () => {
    setIsUserMenuOpen(false);
    await logout();
    navigate('/');
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#f6f6f7] text-[#1a1a1a]">
      {/* Top Banner */}
      <div className="bg-[#008060] text-white text-xs py-2 px-4 text-center font-medium tracking-wide">
        Livraison gratuite à partir de 25 000 FCFA partout à Dakar — Paiement Wave & Orange Money
      </div>

      {/* Header */}
      <header className="sticky top-0 z-30 bg-white border-b border-[#e1e3e5]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between gap-6 h-16">
            {/* Logo */}
            <Link to="/" className="flex items-center gap-2 font-bold text-xl tracking-tight text-[#1a1a1a] flex-shrink-0">
              <span className="w-3 h-3 bg-[#008060] rounded-full inline-block" />
              <span>HAYAT</span>
              <span className="text-[#008060] font-normal">STORE</span>
            </Link>

            {/* Nav Links (Desktop) */}
            <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-[#1a1a1a]">
              <Link to="/" className="hover:text-[#008060] transition-colors">Accueil</Link>
              <Link to="/products" className="hover:text-[#008060] transition-colors">Catalogue</Link>
              <Link to="/contact" className="hover:text-[#008060] transition-colors">Contact</Link>
            </nav>

            {/* Search */}
            <form onSubmit={handleSearch} className="flex-1 max-w-md hidden sm:block">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#6d7175] pointer-events-none" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchQuery(e.target.value)}
                  placeholder="Rechercher un produit..."
                  className="w-full pl-9 pr-4 py-1.5 rounded-lg border border-[#e1e3e5] bg-[#f6f6f7] text-sm text-[#1a1a1a] placeholder:text-[#8c9196] focus:outline-none focus:bg-white focus:ring-2 focus:ring-[#008060]/30 focus:border-[#008060] transition-all"
                />
              </div>
            </form>

            {/* Right Actions */}
            <div className="flex items-center gap-3">
              {/* Cart */}
              <button
                id="cart-button"
                onClick={() => setIsCartOpen(true)}
                className="relative p-2 rounded-lg hover:bg-[#f6f6f7] text-[#1a1a1a] transition-colors cursor-pointer flex items-center gap-2"
                aria-label="Panier"
              >
                <ShoppingCart className="w-5 h-5 text-[#1a1a1a]" />
                <span className="hidden sm:inline text-xs font-semibold">Panier</span>
                {itemCount > 0 && (
                  <span className="bg-[#008060] text-white text-[11px] font-bold px-2 py-0.5 rounded-full">
                    {itemCount}
                  </span>
                )}
              </button>

              {/* User Menu */}
              {isAuthenticated ? (
                <div className="relative hidden sm:block">
                  <button
                    id="user-menu-button"
                    onClick={() => setIsUserMenuOpen((v) => !v)}
                    className="flex items-center gap-2 py-1.5 px-3 rounded-lg border border-[#e1e3e5] bg-white hover:bg-[#f6f6f7] text-[#1a1a1a] text-sm font-medium transition-colors cursor-pointer"
                  >
                    <User className="w-4 h-4 text-[#008060]" />
                    <span className="max-w-[110px] truncate">
                      {user?.firstName ?? user?.email}
                    </span>
                    <ChevronDown className={`w-3.5 h-3.5 transition-transform ${isUserMenuOpen ? 'rotate-180' : ''}`} />
                  </button>

                  {isUserMenuOpen && (
                    <>
                      <div className="fixed inset-0 z-10" onClick={() => setIsUserMenuOpen(false)} />
                      <div className="absolute right-0 top-full mt-1 w-52 bg-white rounded-xl border border-[#e1e3e5] shadow-lg z-20 overflow-hidden">
                        <div className="p-3 border-b border-[#e1e3e5] bg-[#f6f6f7]">
                          <p className="text-xs text-[#6d7175]">Compte client</p>
                          <p className="font-medium text-[#1a1a1a] text-sm truncate">{user?.email}</p>
                        </div>
                        <div className="p-1 space-y-0.5">
                          <Link to="/account/profile" onClick={() => setIsUserMenuOpen(false)} className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-[#1a1a1a] hover:bg-[#f6f6f7] transition-colors">
                            <User className="w-4 h-4 text-[#6d7175]" /> Mon profil
                          </Link>
                          <Link to="/account/orders" onClick={() => setIsUserMenuOpen(false)} className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-[#1a1a1a] hover:bg-[#f6f6f7] transition-colors">
                            <Package className="w-4 h-4 text-[#6d7175]" /> Mes commandes
                          </Link>
                          <button onClick={handleLogout} className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-[#d82c0d] hover:bg-[#fdf2f2] transition-colors cursor-pointer">
                            <LogOut className="w-4 h-4" /> Déconnexion
                          </button>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              ) : (
                <div className="hidden sm:flex items-center gap-2">
                  <Link to="/login" className="text-sm font-medium text-[#1a1a1a] hover:text-[#008060] px-3 py-1.5 transition-colors">
                    Se connecter
                  </Link>
                  <Link to="/register" className="text-sm font-medium bg-[#008060] hover:bg-[#006e52] text-white px-4 py-1.5 rounded-lg transition-colors">
                    Créer un compte
                  </Link>
                </div>
              )}

              {/* Mobile hamburger */}
              <button
                onClick={() => setIsMobileMenuOpen((v) => !v)}
                className="md:hidden p-2 rounded-lg hover:bg-[#f6f6f7] text-[#1a1a1a] transition-colors cursor-pointer"
              >
                {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            </div>
          </div>

          {/* Mobile menu */}
          {isMobileMenuOpen && (
            <div className="md:hidden py-3 border-t border-[#e1e3e5] space-y-2">
              <form onSubmit={handleSearch} className="px-2 pb-2">
                <Input
                  placeholder="Rechercher un produit..."
                  value={searchQuery}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchQuery(e.target.value)}
                  leftIcon={<Search className="w-4 h-4" />}
                />
              </form>
              <Link to="/products" onClick={() => setIsMobileMenuOpen(false)} className="block px-3 py-2 text-sm font-medium text-[#1a1a1a] hover:bg-[#f6f6f7] rounded-lg">
                Catalogue produits
              </Link>
              <Link to="/contact" onClick={() => setIsMobileMenuOpen(false)} className="block px-3 py-2 text-sm font-medium text-[#1a1a1a] hover:bg-[#f6f6f7] rounded-lg">
                Contact
              </Link>
              {isAuthenticated ? (
                <>
                  <Link to="/account/profile" onClick={() => setIsMobileMenuOpen(false)} className="block px-3 py-2 text-sm font-medium text-[#1a1a1a] hover:bg-[#f6f6f7] rounded-lg">
                    Mon profil
                  </Link>
                  <Link to="/account/orders" onClick={() => setIsMobileMenuOpen(false)} className="block px-3 py-2 text-sm font-medium text-[#1a1a1a] hover:bg-[#f6f6f7] rounded-lg">
                    Mes commandes
                  </Link>
                  <button onClick={handleLogout} className="w-full text-left px-3 py-2 text-sm font-medium text-[#d82c0d] hover:bg-[#fdf2f2] rounded-lg cursor-pointer">
                    Déconnexion
                  </button>
                </>
              ) : (
                <div className="pt-2 border-t border-[#e1e3e5] flex flex-col gap-2 px-2">
                  <Link to="/login" onClick={() => setIsMobileMenuOpen(false)} className="text-center py-2 text-sm font-medium text-[#1a1a1a] border border-[#e1e3e5] rounded-lg bg-white">
                    Se connecter
                  </Link>
                  <Link to="/register" onClick={() => setIsMobileMenuOpen(false)} className="text-center py-2 text-sm font-medium text-white bg-[#008060] rounded-lg">
                    Créer un compte
                  </Link>
                </div>
              )}
            </div>
          )}
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1">
        <Outlet />
      </main>

      {/* Footer Minimalist */}
      <footer className="bg-white border-t border-[#e1e3e5] mt-16 text-[#1a1a1a]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="space-y-3 md:col-span-2">
              <div className="flex items-center gap-2 font-bold text-lg text-[#1a1a1a]">
                <span className="w-3 h-3 bg-[#008060] rounded-full inline-block" />
                HAYAT STORE
              </div>
              <p className="text-sm text-[#6d7175] max-w-md leading-relaxed">
                Boutique en ligne épurée au Sénégal. Produits rigoureusement sélectionnés, livraison rapide et service client dédié.
              </p>
            </div>

            <div className="space-y-3">
              <h3 className="text-xs font-semibold text-[#1a1a1a] uppercase tracking-wider">Navigation</h3>
              <ul className="space-y-2 text-sm text-[#6d7175]">
                <li><Link to="/products" className="hover:text-[#008060] transition-colors">Tous les produits</Link></li>
                <li><Link to="/contact" className="hover:text-[#008060] transition-colors">Contact</Link></li>
                <li><Link to="/account/orders" className="hover:text-[#008060] transition-colors">Espace client</Link></li>
              </ul>
            </div>

            <div className="space-y-3">
              <h3 className="text-xs font-semibold text-[#1a1a1a] uppercase tracking-wider">Contact & Support</h3>
              <ul className="space-y-2 text-sm text-[#6d7175]">
                <li>support@hayatstore.sn</li>
                <li>+221 77 000 00 00</li>
                <li>Dakar, Sénégal</li>
              </ul>
            </div>
          </div>

          <div className="border-t border-[#e1e3e5] mt-10 pt-6 flex flex-col sm:flex-row justify-between items-center text-xs text-[#6d7175] gap-4">
            <p>© {new Date().getFullYear()} Hayat Store. Tous droits réservés.</p>
            <div className="flex items-center gap-4">
              <span>Paiement sécurisé : Wave · Orange Money · Cash à la livraison</span>
            </div>
          </div>
        </div>
      </footer>

      <CartDrawer isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} />
    </div>
  );
};
