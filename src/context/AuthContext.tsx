import { createContext, useContext, useMemo, useState, type ReactNode } from 'react';
import { teamMembers } from '@/mock/team';
import { ROLE_LABEL, type AuthUser, type SignUpInput } from '@/types/auth';
import type { TeamRole } from '@/types/team';

interface AuthContextValue {
  user: AuthUser | null;
  studioName: string;
  roleLabel: string;
  signInWithEmail: (email: string) => AuthUser | null;
  signInAsRole: (role: TeamRole) => AuthUser | null;
  signUp: (input: SignUpInput) => AuthUser;
  signOut: () => void;
  updateUser: (user: AuthUser) => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

function toAuthUser(member: (typeof teamMembers)[number]): AuthUser {
  return {
    id: member.id,
    name: member.name,
    role: member.role,
    avatarInitials: member.avatarInitials,
    email: member.email,
    phone: member.phone,
    specialty: member.specialty,
  };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [studioName, setStudioName] = useState('Fitbase Studio');

  const value = useMemo<AuthContextValue>(() => {
    const findByRole = (role: TeamRole) =>
      teamMembers.find((member) => member.role === role && member.status === 'aktif') ??
      teamMembers.find((member) => member.role === role) ??
      null;

    return {
      user,
      studioName,
      roleLabel: user ? ROLE_LABEL[user.role] : '',
      signInWithEmail: (email) => {
        const normalized = email.trim().toLocaleLowerCase('tr');
        const match = teamMembers.find((member) => member.email.toLocaleLowerCase('tr') === normalized);
        if (!match) return null;
        const authUser = toAuthUser(match);
        setUser(authUser);
        return authUser;
      },
      signInAsRole: (role) => {
        const match = findByRole(role);
        if (!match) return null;
        const authUser = toAuthUser(match);
        setUser(authUser);
        return authUser;
      },
      signUp: (input) => {
        const initials = input.name
          .trim()
          .split(' ')
          .map((part) => part[0])
          .join('')
          .slice(0, 2)
          .toLocaleUpperCase('tr');
        const authUser: AuthUser = {
          id: `user-${Date.now()}`,
          name: input.name.trim(),
          role: 'yonetici',
          avatarInitials: initials,
          email: input.email.trim(),
          phone: input.phone.trim(),
          specialty: null,
        };
        setStudioName(input.studioName.trim() || 'Fitbase Studio');
        setUser(authUser);
        return authUser;
      },
      signOut: () => setUser(null),
      updateUser: (updated) => setUser(updated),
    };
  }, [user, studioName]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
}
