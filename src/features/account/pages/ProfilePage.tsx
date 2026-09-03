import React from 'react';
import { User as UserIcon, Mail, Phone, Shield } from 'lucide-react';
import { useAuth } from '../../../app/providers/auth-context';
import { Card } from '../../../components/ui/Card';

export const ProfilePage: React.FC = () => {
  const { user } = useAuth();

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 space-y-6">
      <h1 className="text-2xl font-bold text-[#1a1a1a] flex items-center gap-2">
        <UserIcon className="w-6 h-6 text-[#008060]" />
        Mon Profil
      </h1>

      <Card>
        <div className="space-y-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-[#008060] flex items-center justify-center text-white text-2xl font-bold">
              {(user?.firstName?.[0] ?? user?.email?.[0] ?? 'U').toUpperCase()}
            </div>
            <div>
              <h2 className="text-xl font-bold text-[#1a1a1a]">
                {[user?.firstName, user?.lastName].filter(Boolean).join(' ') || 'Utilisateur'}
              </h2>
              {/* <Badge className="bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 mt-1">
                {user?.role}
              </Badge> */}
            </div>
          </div>

          <div className="border-t border-[#e1e3e5] pt-4 space-y-4">
            <div className="flex items-center gap-3 text-[#1a1a1a]">
              <Mail className="w-5 h-5 text-[#6d7175]" />
              <div>
                <p className="text-xs text-[#6d7175]">Email</p>
                <p className="font-medium">{user?.email}</p>
              </div>
            </div>

            {user?.phone && (
              <div className="flex items-center gap-3 text-[#1a1a1a]">
                <Phone className="w-5 h-5 text-[#6d7175]" />
                <div>
                  <p className="text-xs text-[#6d7175]">Téléphone</p>
                  <p className="font-medium">{user.phone}</p>
                </div>
              </div>
            )}

            <div className="flex items-center gap-3 text-[#1a1a1a]">
              <Shield className="w-5 h-5 text-[#6d7175]" />
              <div>
                <p className="text-xs text-[#6d7175]">Statut du compte</p>
                <p className="font-medium text-[#008060]">Actif</p>
              </div>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
};
