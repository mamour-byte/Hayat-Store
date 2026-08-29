import React from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock } from 'lucide-react';
import { useAuth } from '../../../app/providers/AuthProvider';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';

const schema = z.object({
  email: z.email('Adresse email invalide'),
  password: z.string().min(6, 'Le mot de passe doit contenir au moins 6 caractères'),
});

type FormValues = z.infer<typeof schema>;

export const LoginForm: React.FC = () => {
  const navigate = useNavigate();
  const { login } = useAuth();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  const onSubmit = async (data: FormValues) => {
    await login(data);
    navigate('/');
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center bg-[#f6f6f7] px-4 py-12">
      <div className="w-full max-w-md">
        <div className="bg-white border border-[#e1e3e5] rounded-xl p-8 space-y-6">
          {/* Header */}
          <div className="text-center space-y-1">
            <div className="inline-block w-2.5 h-2.5 bg-[#008060] rounded-full mb-2" />
            <h1 className="text-2xl font-bold text-[#1a1a1a]">Connexion</h1>
            <p className="text-[#6d7175] text-xs mb-">
              Accédez à votre espace client Hayat Store
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 ">
            <Input
              label="Adresse email"
              type="email"
              placeholder="exemple@mail.com"
              leftIcon={<Mail className="w-4 h-4 text-[#6d7175]" />}
              error={errors.email?.message}
              {...register('email')}
            />
            <Input
              label="Mot de passe"
              type="password"
              placeholder="••••••••"
              leftIcon={<Lock className="w-4 h-4 text-[#6d7175]" />}
              error={errors.password?.message}
              {...register('password')}
            />

            <Link
              to="/forgot-password"
              className="block text-right text-xs text-[#008060] hover:underline font-semibold"
            >
              Mot de passe oublié ?
            </Link>

            <Button
              type="submit"
              className="w-full mt-2"
              size="lg"
              isLoading={isSubmitting}
            >
              Se connecter
            </Button>
          </form>

          {/* Footer */}
          <p className="text-center text-xs text-[#6d7175]">
            Nouveau sur Hayat Store ?{' '}
            <Link
              to="/register"
              className="text-[#008060] hover:underline font-semibold"
            >
              Créer un compte
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};
