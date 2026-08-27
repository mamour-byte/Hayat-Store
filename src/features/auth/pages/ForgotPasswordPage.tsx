import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link } from 'react-router-dom';
import { Mail } from 'lucide-react';
import { toast } from 'sonner';
import { authService } from '../api/auth.service';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';

const schema = z.object({
  email: z.email('Adresse email invalide'),
});

type FormValues = z.infer<typeof schema>;

export const ForgotPasswordPage: React.FC = () => {
  const [submitted, setSubmitted] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  const onSubmit = async (data: FormValues) => {
    try {
      await authService.forgotPassword(data);
      setSubmitted(true);
      toast.success('Si cette adresse existe, un email de réinitialisation a été envoyé.');
    } catch {
      toast.error('Impossible de demander la réinitialisation pour le moment.');
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center bg-[#f6f6f7] px-4 py-12">
      <div className="w-full max-w-md">
        <div className="bg-white border border-[#e1e3e5] rounded-xl p-8 space-y-6">
          <div className="text-center space-y-1">
            <div className="inline-block w-2.5 h-2.5 bg-[#008060] rounded-full mb-2" />
            <h1 className="text-2xl font-bold text-[#1a1a1a]">Mot de passe oublié</h1>
            <p className="text-[#6d7175] text-xs">
              Recevez un lien pour définir un nouveau mot de passe
            </p>
          </div>

          {submitted ? (
            <div className="space-y-4 text-center">
              <p className="text-sm text-[#1a1a1a]">
                Consultez votre boîte mail et suivez le lien reçu pour continuer.
              </p>
              <Link to="/login" className="block text-sm text-[#008060] hover:underline font-semibold">
                Retour à la connexion
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <Input
                label="Adresse email"
                type="email"
                placeholder="votre.email@exemple.com"
                leftIcon={<Mail className="w-4 h-4 text-[#6d7175]" />}
                error={errors.email?.message}
                {...register('email')}
              />
              <Button type="submit" className="w-full mt-2" size="lg" isLoading={isSubmitting}>
                Envoyer le lien
              </Button>
              <Link to="/login" className="block text-center text-xs text-[#008060] hover:underline font-semibold">
                Retour à la connexion
              </Link>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
