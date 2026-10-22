import React, { useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';
import { useAuth } from '../../../app/providers/auth-context';
import { authService } from '../api/auth.service';

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: object) => void;
          renderButton: (parent: HTMLElement, options: object) => void;
        };
      };
    };
  }
}

interface Props {
  onSuccess?: () => void;
}

export const SocialAuthButtons: React.FC<Props> = ({ onSuccess }) => {
  const { loginWithSocial } = useAuth();
  const googleButtonRef = useRef<HTMLDivElement>(null);
  const [sdkReady, setSdkReady] = useState(false);

  const handleCredential = async (credential: string) => {
    try {
      const response = await authService.socialLogin('google', credential);
      await loginWithSocial(response);
      onSuccess?.();
    } catch {
      toast.error('Connexion Google impossible. Veuillez réessayer.');
    }
  };

  const initAndRender = () => {
    const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID as string;
    if (!clientId || !window.google?.accounts?.id || !googleButtonRef.current) return;

    window.google.accounts.id.initialize({
      client_id: clientId,
      callback: (res: { credential: string }) => void handleCredential(res.credential),
    });

    window.google.accounts.id.renderButton(googleButtonRef.current, {
      type: 'standard',
      theme: 'outline',
      size: 'large',
      text: 'signin_with',
      width: googleButtonRef.current.offsetWidth || 320,
      logo_alignment: 'center',
    });

    setSdkReady(true);
  };

  useEffect(() => {
    const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID as string;
    if (!clientId) return;

    if (window.google?.accounts?.id) {
      initAndRender();
      return;
    }

    if (!document.getElementById('gsi-script')) {
      const script = document.createElement('script');
      script.id = 'gsi-script';
      script.src = 'https://accounts.google.com/gsi/client';
      script.async = true;
      script.defer = true;
      script.onload = () => initAndRender();
      document.body.appendChild(script);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Re-render button once the ref div is mounted and SDK is available
  useEffect(() => {
    if (googleButtonRef.current && window.google?.accounts?.id && !sdkReady) {
      initAndRender();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [googleButtonRef.current]);

  return (
    <div className="space-y-3">
      <div className="relative flex items-center">
        <div className="flex-grow border-t border-[#e1e3e5]" />
        <span className="mx-3 text-xs text-[#6d7175]">ou continuer avec</span>
        <div className="flex-grow border-t border-[#e1e3e5]" />
      </div>

      <div
        ref={googleButtonRef}
        className="flex justify-center min-h-[40px]"
      />
    </div>
  );
};
