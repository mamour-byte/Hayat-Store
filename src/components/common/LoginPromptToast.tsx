import React, { useEffect, useRef, useState } from 'react';
import { X } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '../../app/providers/auth-context';
import { authService } from '../../features/auth/api/auth.service';

const SESSION_KEY = 'hayat_login_prompt_shown';
const DELAY_MS = 8000;

export const LoginPromptToast: React.FC = () => {
  const { isAuthenticated, isLoading, loginWithSocial } = useAuth();
  const [visible, setVisible] = useState(false);
  const googleButtonRef = useRef<HTMLDivElement>(null);
  const toastId = useRef<string | number | null>(null);

  const dismiss = () => {
    setVisible(false);
    if (toastId.current !== null) toast.dismiss(toastId.current);
    sessionStorage.setItem(SESSION_KEY, '1');
  };

  const handleCredential = async (credential: string) => {
    try {
      const response = await authService.socialLogin('google', credential);
      await loginWithSocial(response);
      dismiss();
    } catch {
      toast.error('Connexion Google impossible. Veuillez réessayer.');
    }
  };

  const renderGoogleButton = () => {
    if (!googleButtonRef.current || !window.google?.accounts?.id) return;
    const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID as string;
    if (!clientId) return;

    window.google.accounts.id.initialize({
      client_id: clientId,
      callback: (res: { credential: string }) => void handleCredential(res.credential),
    });

    window.google.accounts.id.renderButton(googleButtonRef.current, {
      type: 'standard',
      theme: 'outline',
      size: 'large',
      text: 'signin_with',
      width: 280,
      logo_alignment: 'center',
    });
  };

  // Show after delay, once per session, only for guests
  useEffect(() => {
    if (isLoading || isAuthenticated) return;
    if (sessionStorage.getItem(SESSION_KEY)) return;

    const timer = setTimeout(() => setVisible(true), DELAY_MS);
    return () => clearTimeout(timer);
  }, [isLoading, isAuthenticated]);

  // Render toast when visible
  useEffect(() => {
    if (!visible) return;

    toastId.current = toast.custom(
      () => (
        <div className="bg-white border border-[#e1e3e5] rounded-2xl shadow-lg p-5 w-[320px] flex flex-col gap-4">
          <div className="flex items-start justify-between gap-2">
            <div>
              <p className="font-semibold text-[#1a1a1a] text-sm">👋 Bienvenue sur Hayat Store</p>
              <p className="text-xs text-[#6d7175] mt-1 leading-relaxed">
                Connectez-vous pour suivre vos commandes et profiter d'une expérience personnalisée.
              </p>
            </div>
            <button
              onClick={dismiss}
              className="text-[#6d7175] hover:text-[#1a1a1a] transition-colors flex-shrink-0 mt-0.5"
              aria-label="Fermer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div ref={googleButtonRef} className="flex justify-center min-h-[40px]" />

          <button
            onClick={dismiss}
            className="text-xs text-[#6d7175] hover:text-[#1a1a1a] transition-colors text-center"
          >
            Plus tard
          </button>
        </div>
      ),
      {
        duration: Infinity,
        position: 'bottom-right',
        onDismiss: () => sessionStorage.setItem(SESSION_KEY, '1'),
      },
    );

    // Give the DOM time to mount the ref before rendering the Google button
    const t = setTimeout(() => {
      if (window.google?.accounts?.id) {
        renderGoogleButton();
      } else {
        const existing = document.getElementById('gsi-script');
        if (!existing) {
          const script = document.createElement('script');
          script.id = 'gsi-script';
          script.src = 'https://accounts.google.com/gsi/client';
          script.async = true;
          script.defer = true;
          script.onload = () => renderGoogleButton();
          document.body.appendChild(script);
        } else {
          existing.addEventListener('load', renderGoogleButton, { once: true });
        }
      }
    }, 100);

    return () => clearTimeout(t);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible]);

  return null;
};
