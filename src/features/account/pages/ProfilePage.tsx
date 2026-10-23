import React, { useState } from 'react';
import { User as UserIcon, Mail, Lock, Eye, EyeOff } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '../../../app/providers/auth-context';
import { Card } from '../../../components/ui/Card';
import { apiClient } from '../../../lib/api/client';
import type { User } from '../../../types';

const PROFILE_URL = (id: string) => `/users/${id}/profile`;
const PASSWORD_URL = (id: string) => `/users/${id}/password`;

export const ProfilePage: React.FC = () => {
  const { user, updateUser } = useAuth();

  // ── Profile form ──────────────────────────────────────────────────────────
  const [profile, setProfile] = useState({
    firstName: user?.firstName ?? '',
    lastName: user?.lastName ?? '',
    phone: user?.phone ?? '',
  });
  const [savingProfile, setSavingProfile] = useState(false);

  const handleProfileChange = (e: React.ChangeEvent<HTMLInputElement>) =>
    setProfile((p) => ({ ...p, [e.target.name]: e.target.value }));

  const submitProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setSavingProfile(true);
    try {
      const { data } = await apiClient.patch<User>(PROFILE_URL(user.id), {
        firstName: profile.firstName || undefined,
        lastName: profile.lastName || undefined,
        phone: profile.phone || undefined,
      });
      updateUser(data);
      toast.success('Profil mis à jour.');
    } catch {
      toast.error('Impossible de mettre à jour le profil.');
    } finally {
      setSavingProfile(false);
    }
  };

  // ── Password form ─────────────────────────────────────────────────────────
  const [passwords, setPasswords] = useState({ currentPassword: '', newPassword: '', confirm: '' });
  const [showPwd, setShowPwd] = useState({ current: false, next: false });
  const [savingPwd, setSavingPwd] = useState(false);

  const handlePwdChange = (e: React.ChangeEvent<HTMLInputElement>) =>
    setPasswords((p) => ({ ...p, [e.target.name]: e.target.value }));

  const submitPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    if (passwords.newPassword !== passwords.confirm) {
      toast.error('Les mots de passe ne correspondent pas.');
      return;
    }
    setSavingPwd(true);
    try {
      await apiClient.patch(PASSWORD_URL(user.id), {
        currentPassword: passwords.currentPassword,
        newPassword: passwords.newPassword,
      });
      setPasswords({ currentPassword: '', newPassword: '', confirm: '' });
      toast.success('Mot de passe modifié.');
    } catch (err: any) {
      const msg = err?.response?.data?.message ?? 'Mot de passe actuel incorrect.';
      toast.error(msg);
    } finally {
      setSavingPwd(false);
    }
  };

  const inputClass =
    'w-full border border-[#e1e3e5] rounded-lg px-3 py-2.5 text-sm text-[#1a1a1a] focus:outline-none focus:ring-2 focus:ring-[#008060]/30 focus:border-[#008060] transition';

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 space-y-6">
      <h1 className="text-2xl font-bold text-[#1a1a1a] flex items-center gap-2">
        <UserIcon className="w-6 h-6 text-[#008060]" />
        Mon Profil
      </h1>

      {/* Avatar + email (lecture seule) */}
      <Card>
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-full bg-[#008060] flex items-center justify-center text-white text-xl font-bold flex-shrink-0">
            {(user?.firstName?.[0] ?? user?.email?.[0] ?? 'U').toUpperCase()}
          </div>
          <div>
            <p className="font-semibold text-[#1a1a1a]">
              {[user?.firstName, user?.lastName].filter(Boolean).join(' ') || 'Utilisateur'}
            </p>
            <p className="text-sm text-[#6d7175] flex items-center gap-1.5 mt-0.5">
              <Mail className="w-3.5 h-3.5" />
              {user?.email}
            </p>
          </div>
        </div>
      </Card>

      {/* Informations personnelles */}
      <Card>
        <form onSubmit={submitProfile} className="space-y-4">
          <h2 className="font-semibold text-[#1a1a1a]">Informations personnelles</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-medium text-[#6d7175]">Prénom</label>
              <input
                name="firstName"
                value={profile.firstName}
                onChange={handleProfileChange}
                placeholder="Prénom"
                className={inputClass}
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-[#6d7175]">Nom</label>
              <input
                name="lastName"
                value={profile.lastName}
                onChange={handleProfileChange}
                placeholder="Nom"
                className={inputClass}
              />
            </div>
          </div>
          <div className="space-y-1">
            <label className="text-xs font-medium text-[#6d7175]">Téléphone</label>
            <input
              name="phone"
              value={profile.phone}
              onChange={handleProfileChange}
              placeholder="+221 7X XXX XX XX"
              className={inputClass}
            />
          </div>
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={savingProfile}
              className="bg-[#008060] hover:bg-[#006e52] disabled:opacity-60 text-white text-sm font-medium px-5 py-2.5 rounded-lg transition-colors"
            >
              {savingProfile ? 'Enregistrement…' : 'Enregistrer'}
            </button>
          </div>
        </form>
      </Card>

      {/* Changement de mot de passe */}
      <Card>
        <form onSubmit={submitPassword} className="space-y-4">
          <h2 className="font-semibold text-[#1a1a1a] flex items-center gap-2">
            <Lock className="w-4 h-4 text-[#6d7175]" />
            Changer le mot de passe
          </h2>
          <div className="space-y-1">
            <label className="text-xs font-medium text-[#6d7175]">Mot de passe actuel</label>
            <div className="relative">
              <input
                name="currentPassword"
                type={showPwd.current ? 'text' : 'password'}
                value={passwords.currentPassword}
                onChange={handlePwdChange}
                required
                className={inputClass + ' pr-10'}
              />
              <button
                type="button"
                onClick={() => setShowPwd((s) => ({ ...s, current: !s.current }))}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#6d7175]"
              >
                {showPwd.current ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>
          <div className="space-y-1">
            <label className="text-xs font-medium text-[#6d7175]">Nouveau mot de passe</label>
            <div className="relative">
              <input
                name="newPassword"
                type={showPwd.next ? 'text' : 'password'}
                value={passwords.newPassword}
                onChange={handlePwdChange}
                required
                placeholder="Min. 8 car., maj., chiffre, symbole"
                className={inputClass + ' pr-10'}
              />
              <button
                type="button"
                onClick={() => setShowPwd((s) => ({ ...s, next: !s.next }))}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#6d7175]"
              >
                {showPwd.next ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>
          <div className="space-y-1">
            <label className="text-xs font-medium text-[#6d7175]">Confirmer le nouveau mot de passe</label>
            <input
              name="confirm"
              type="password"
              value={passwords.confirm}
              onChange={handlePwdChange}
              required
              className={inputClass}
            />
          </div>
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={savingPwd}
              className="bg-[#1a1a1a] hover:bg-[#333] disabled:opacity-60 text-white text-sm font-medium px-5 py-2.5 rounded-lg transition-colors"
            >
              {savingPwd ? 'Modification…' : 'Modifier le mot de passe'}
            </button>
          </div>
        </form>
      </Card>
    </div>
  );
};
