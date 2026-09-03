import React, { useEffect, useState } from 'react';
import { Users, Shield, UserCheck, Search, Clock } from 'lucide-react';
import { adminService } from '../services/admin.service';
import type { User } from '../../../types';
import { UserRole, UserStatus } from '../../../types/enums';
import { toast } from 'sonner';

export const AdminUsersPage: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    let ignore = false;
    (async () => {
      try {
        const data = await adminService.getUsers();
        if (ignore) return;
        setUsers(data);
      } catch {
        if (!ignore) toast.error('Erreur lors du chargement des utilisateurs');
      } finally {
        if (!ignore) setIsLoading(false);
      }
    })();
    return () => {
      ignore = true;
    };
  }, []);

  const handleRoleChange = async (userId: string, newRole: UserRole) => {
    try {
      const updated = await adminService.updateUserRole(userId, newRole);
      setUsers((prev) => prev.map((u) => (u.id === userId ? updated : u)));
      toast.success(`Rôle de l'utilisateur mis à jour vers : ${newRole}`);
    } catch {
      toast.error('Erreur lors du changement de rôle');
    }
  };

  const handleStatusChange = async (userId: string, newStatus: UserStatus) => {
    try {
      const updated = await adminService.updateUserStatus(userId, newStatus);
      setUsers((prev) => prev.map((u) => (u.id === userId ? updated : u)));
      toast.success(`Compte utilisateur ${newStatus === UserStatus.ACTIVE ? 'activé' : 'désactivé'}`);
    } catch {
      toast.error('Erreur lors du changement de statut');
    }
  };

  const filteredUsers = users.filter((u) => {
    const query = searchQuery.toLowerCase();
    return (
      u.email.toLowerCase().includes(query) ||
      (u.firstName || '').toLowerCase().includes(query) ||
      (u.lastName || '').toLowerCase().includes(query) ||
      (u.phone || '').toLowerCase().includes(query)
    );
  });

  const getRoleBadge = (role: UserRole) => {
    switch (role) {
      case UserRole.ADMIN:
        return (
          <span className="bg-purple-50 text-purple-700 px-2.5 py-1 rounded-full text-xs font-bold border border-purple-200 flex items-center gap-1 w-max">
            <Shield className="w-3 h-3" /> Admin
          </span>
        );
      case UserRole.STAFF:
        return (
          <span className="bg-blue-50 text-blue-700 px-2.5 py-1 rounded-full text-xs font-bold border border-blue-200 flex items-center gap-1 w-max">
            <UserCheck className="w-3 h-3" /> Staff / Agent
          </span>
        );
      default:
        return (
          <span className="bg-[#f0f9f6] text-[#008060] px-2.5 py-1 rounded-full text-xs font-bold border border-[#008060]/20 w-max">
            Client
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Title Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#e1e3e5] pb-4">
        <div>
          <h1 className="text-2xl font-bold text-[#1a1a1a] flex items-center gap-2">
            <Users className="w-6 h-6 text-[#008060]" /> Gestion des Utilisateurs & Roles
          </h1>
          <p className="text-xs text-[#6d7175]">Gérez les comptes d'accès, rôles et privilèges (Admin, Staff, Client)</p>
        </div>

        <div className="flex items-center gap-3 text-xs font-semibold">
          <span className="bg-white border border-[#e1e3e5] px-3 py-1.5 rounded-xl">
            Total Comptes : <strong className="text-[#008060]">{users.length}</strong>
          </span>
        </div>
      </div>

      {/* Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-[#e1e3e5] shadow-2xs">
        <div className="relative max-w-md">
          <Search className="w-4 h-4 text-[#6d7175] absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Rechercher par nom, email ou numéro de téléphone..."
            className="w-full pl-9 pr-4 py-2 text-xs border border-[#e1e3e5] bg-[#f6f6f7] rounded-xl text-[#1a1a1a] placeholder:text-[#8c9196] focus:outline-none focus:bg-white focus:ring-2 focus:ring-[#008060]/30 focus:border-[#008060]"
          />
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white border border-[#e1e3e5] rounded-2xl overflow-hidden shadow-2xs">
        {isLoading ? (
          <div className="p-12 text-center text-xs text-[#6d7175]">
            <div className="w-6 h-6 border-2 border-[#008060] border-t-transparent rounded-full animate-spin mx-auto mb-2" />
            Chargement des utilisateurs...
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="p-12 text-center text-xs text-[#6d7175]">
            Aucun utilisateur correspondant à votre recherche.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-[#1a1a1a]">
              <thead className="bg-[#f6f6f7] text-[#6d7175] font-bold uppercase tracking-wider text-[11px] border-b border-[#e1e3e5]">
                <tr>
                  <th className="py-3.5 px-4">Utilisateur</th>
                  <th className="py-3.5 px-4">Téléphone</th>
                  <th className="py-3.5 px-4">Rôle Interne</th>
                  <th className="py-3.5 px-4">Statut</th>
                  <th className="py-3.5 px-4">Inscription</th>
                  <th className="py-3.5 px-4 text-right">Modifier Rôle</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#e1e3e5]">
                {filteredUsers.map((usr) => (
                  <tr key={usr.id} className="hover:bg-[#f6f6f7]/50 transition-colors">
                    <td className="py-3.5 px-4">
                      <p className="font-bold text-[#1a1a1a]">
                        {usr.firstName} {usr.lastName || ''}
                      </p>
                      <p className="text-[11px] text-[#6d7175]">{usr.email}</p>
                    </td>
                    <td className="py-3.5 px-4 font-mono text-[#6d7175]">
                      {usr.phone || 'Non renseigné'}
                    </td>
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      {getRoleBadge(usr.role)}
                    </td>
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <button
                        onClick={() => handleStatusChange(usr.id, usr.status === UserStatus.ACTIVE ? UserStatus.INACTIVE : UserStatus.ACTIVE)}
                        className={`cursor-pointer px-2.5 py-1 rounded-full text-xs font-bold transition-colors ${
                          usr.status === UserStatus.ACTIVE
                            ? 'bg-[#f0f9f6] text-[#008060] border border-[#008060]/20'
                            : 'bg-rose-50 text-rose-700 border border-rose-200'
                        }`}
                      >
                        {usr.status === UserStatus.ACTIVE ? 'Actif' : 'Inactif'}
                      </button>
                    </td>
                    <td className="py-3.5 px-4 text-[#6d7175] whitespace-nowrap">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {usr.createdAt ? new Date(usr.createdAt).toLocaleDateString('fr-FR') : '—'}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right whitespace-nowrap">
                      <select
                        value={usr.role}
                        onChange={(e) => handleRoleChange(usr.id, e.target.value as UserRole)}
                        className="text-xs bg-[#f6f6f7] border border-[#e1e3e5] rounded-lg px-2.5 py-1 font-semibold text-[#1a1a1a] focus:outline-none focus:border-[#008060] cursor-pointer"
                      >
                        <option value={UserRole.CUSTOMER}>Client</option>
                        <option value={UserRole.STAFF}>Staff / Agent</option>
                        <option value={UserRole.ADMIN}>Administrateur</option>
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
