import React from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock, User, Phone } from 'lucide-react';
import { useAuth } from '../../../app/providers/AuthProvider';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';

const schema = z
  .object({
    firstName: z.string().min(2, 'Prénom requis'),
    lastName: z.string().min(2, 'Nom requis'),
    email: z.email('Adresse email invalide'),
    phone: z.string().optional(),
    password: z.string().min(8, 'Le mot de passe doit contenir au moins 8 caractères'),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Les mots de passe ne correspondent pas',
    path: ['confirmPassword'],
  });

type FormValues = z.infer<typeof schema>;

export const RegisterForm: React.FC = () => {
  const navigate = useNavigate();
  const { register: registerUser } = useAuth();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  const onSubmit = async ({ confirmPassword: _cp, ...data }: FormValues) => {
    await registerUser(data);
    navigate('/');
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center bg-[#f6f6f7] px-4 py-12">
      <div className="w-full max-w-md">
        <div className="bg-white border border-[#e1e3e5] rounded-xl p-8 space-y-6">
          {/* Header */}
          <div className="text-center space-y-1">
            <div className="inline-block w-2.5 h-2.5 bg-[#008060] rounded-full mb-2" />
            <h1 className="text-2xl font-bold text-[#1a1a1a]">Créer un compte</h1>
            <p className="text-[#6d7175] text-xs">Rejoignez Hayat Store</p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <Input
                label="Prénom"
                placeholder="Mamour"
                leftIcon={<User className="w-4 h-4 text-[#6d7175]" />}
                error={errors.firstName?.message}
                {...register('firstName')}
              />
              <Input
                label="Nom"
                placeholder="Diallo"
                leftIcon={<User className="w-4 h-4 text-[#6d7175]" />}
                error={errors.lastName?.message}
                {...register('lastName')}
              />
            </div>
            <Input
              label="Adresse email"
              type="email"
              placeholder="votre.email@exemple.com"
              leftIcon={<Mail className="w-4 h-4 text-[#6d7175]" />}
              error={errors.email?.message}
              {...register('email')}
            />
            <Input
              label="Téléphone (optionnel)"
              type="tel"
              placeholder="+221 77 000 00 00"
              leftIcon={<Phone className="w-4 h-4 text-[#6d7175]" />}
              error={errors.phone?.message}
              {...register('phone')}
            />
            <Input
              label="Mot de passe"
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

            <Button
              type="submit"
              className="w-full mt-2"
              size="lg"
              isLoading={isSubmitting}
            >
              Créer mon compte
            </Button>
          </form>

          {/* Footer */}
          <p className="text-center text-xs text-[#6d7175]">
            Déjà un compte ?{' '}
            <Link
              to="/login"
              className="text-[#008060] hover:underline font-semibold"
            >
              Se connecter
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};
