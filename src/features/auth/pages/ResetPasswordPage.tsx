import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Lock } from 'lucide-react';
import { toast } from 'sonner';
import { authService } from '../api/auth.service';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';

const schema = z
  .object({
    password: z
      .string()
      .min(6, 'Le mot de passe doit contenir au moins 6 caractères')
      .regex(
        /^(?=.*[A-Z])(?=.*[a-z])(?=.*\d)/,
        'Le mot de passe doit contenir une majuscule, une lettre et un chiffre',
      ),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Les mots de passe ne correspondent pas',
    path: ['confirmPassword'],
  });

type FormValues = z.infer<typeof schema>;

export const ResetPasswordPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [submitted, setSubmitted] = useState(false);
  const token = searchParams.get('token') || '';
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  const onSubmit = async (data: FormValues) => {
    if (!token) {
      toast.error('Le lien de réinitialisation est invalide ou incomplet.');
      return;
    }

    try {
      await authService.resetPassword({ token, newPassword: data.password });
      setSubmitted(true);
      toast.success('Votre mot de passe a été réinitialisé.');
    } catch {
      toast.error('Le lien est invalide ou a expiré.');
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center bg-[#f6f6f7] px-4 py-12">
      <div className="w-full max-w-md">
        <div className="bg-white border border-[#e1e3e5] rounded-xl p-8 space-y-6">
          <div className="text-center space-y-1">
            <div className="inline-block w-2.5 h-2.5 bg-[#008060] rounded-full mb-2" />
            <h1 className="text-2xl font-bold text-[#1a1a1a]">Nouveau mot de passe</h1>
            <p className="text-[#6d7175] text-xs">Choisissez un nouveau mot de passe sécurisé</p>
          </div>

          {submitted ? (
            <div className="space-y-4 text-center">
              <p className="text-sm text-[#1a1a1a]">Votre mot de passe est à jour.</p>
              <Button type="button" className="w-full" onClick={() => navigate('/login')}>
                Se connecter
              </Button>
            </div>
          ) : (
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <Input
                label="Nouveau mot de passe"
                type="password"
                placeholder="••••••••"
                leftIcon={<Lock className="w-4 h-4 text-[#6d7175]" />}
                error={errors.password?.message}
                {...register('password')}
              />
              <Input
                label="Confirmer le mot de passe"
                type="password"
                placeholder="••••••••"
                leftIcon={<Lock className="w-4 h-4 text-[#6d7175]" />}
                error={errors.confirmPassword?.message}
                {...register('confirmPassword')}
              />
              <Button type="submit" className="w-full mt-2" size="lg" isLoading={isSubmitting}>
                Réinitialiser le mot de passe
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
