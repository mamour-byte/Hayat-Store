import { RouterProvider } from 'react-router-dom';
import { Toaster } from 'sonner';
import { QueryProvider } from './providers/QueryProvider';
import { AuthProvider } from './providers/AuthProvider';
import { CartProvider } from './providers/CartProvider';
import { router } from './router';
import { SiteLoader } from '../components/common/SiteLoader';

function App() {
  return (
    <QueryProvider>
      <AuthProvider>
        <CartProvider>
          <RouterProvider router={router} />
          <SiteLoader />
          <Toaster position="top-right" richColors closeButton />
        </CartProvider>
      </AuthProvider>
    </QueryProvider>
  );
}

export default App;
