import React, { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { useAuth } from '../../../app/providers/auth-context';
import { authService } from '../api/auth.service';

export const AppleCallbackPage: React.FC = () => {
  const navigate = useNavigate();
  const { loginWithSocial } = useAuth();
  const handled = useRef(false);

  useEffect(() => {
    if (handled.current) return;
    handled.current = true;

    const params = new URLSearchParams(window.location.search);
    const code = params.get('code');
    const error = params.get('error');

    if (error || !code) {
      toast.error('Authentification Apple échouée. Veuillez réessayer.');
      navigate('/login', { replace: true });
      return;
    }

    authService
      .exchangeAppleCode(code)
      .then((session) => loginWithSocial(session))
      .then(() => navigate('/', { replace: true }))
      .catch(() => {
        toast.error('Connexion Apple impossible. Veuillez réessayer.');
        navigate('/login', { replace: true });
      });
  }, [navigate, loginWithSocial]);

  return (
    <div className="min-h-[80vh] flex items-center justify-center">
      <span className="h-6 w-6 animate-spin rounded-full border-2 border-[#008060] border-t-transparent" />
    </div>
  );
};
