import { Outlet, Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { UserRole } from '../../types';
import { ROLE_LABEL } from '../../utils/formatters';
import {
  LayoutDashboard,
  FileText,
  ShieldCheck,
  Users,
  Building2,
  Tags,
  ScrollText,
  LogOut,
  ChevronDown,
} from 'lucide-react';
import { useState } from 'react';

interface NavGroup {
  label: string;
  items: NavItem[];
  roles?: UserRole[];
}
interface NavItem {
  label: string;
  to: string;
  icon: React.ReactNode;
  roles?: UserRole[];
  end?: boolean;
}

const groups: NavGroup[] = [
  {
    label: 'Overview',
    items: [
      { label: 'Dashboard', to: '/', icon: <LayoutDashboard size={17} />, end: true },
      { label: 'Applications', to: '/applications', icon: <FileText size={17} /> },
    ],
  },
  {
    label: 'Catalog',
    roles: [UserRole.APPLICANT],
    items: [
      { label: 'License catalog', to: '/catalog', icon: <Tags size={17} />, roles: [UserRole.APPLICANT] },
    ],
  },
  {
    label: 'Administration',
    roles: [UserRole.ADMIN],
    items: [
      { label: 'Users', to: '/admin/users', icon: <Users size={17} />, roles: [UserRole.ADMIN] },
      { label: 'Departments', to: '/admin/departments', icon: <ShieldCheck size={17} />, roles: [UserRole.ADMIN] },
      { label: 'Institution types', to: '/admin/institution-types', icon: <Building2 size={17} />, roles: [UserRole.ADMIN] },
      { label: 'License types', to: '/admin/license-types', icon: <Tags size={17} />, roles: [UserRole.ADMIN] },
    ],
  },
  {
    label: 'Oversight',
    roles: [UserRole.ADMIN, UserRole.APPROVER, UserRole.REVIEWER],
    items: [
      { label: 'Audit log', to: '/audit', icon: <ScrollText size={17} />, roles: [UserRole.ADMIN, UserRole.APPROVER, UserRole.REVIEWER] },
    ],
  },
];

export default function Layout() {
  const { user, logout, hasRole } = useAuth();
  const nav = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  const visibleGroups = groups
    .filter((g) => !g.roles || g.roles.some((r) => hasRole(r)))
    .map((g) => ({
      ...g,
      items: g.items.filter((i) => !i.roles || i.roles.some((r) => hasRole(r))),
    }))
    .filter((g) => g.items.length);

  const onLogout = async () => {
    await logout();
    nav('/login');
  };

  return (
    <div className="flex h-screen">
      <aside className="w-64 shrink-0 border-r border-[color:var(--color-bnr-line)] bg-[color:var(--color-surface)] flex flex-col">
        <div className="px-5 py-5 border-b border-[color:var(--color-bnr-line)]">
          <Link to="/" className="flex items-center gap-2.5">
            <div className="h-9 w-9 rounded bg-bnr flex items-center justify-center text-white font-bold text-sm">BNR</div>
            <div className="leading-tight">
              <div className="font-semibold text-[13px]">Licensing Portal</div>
              <div className="text-[11px] text-[color:var(--color-ink-soft)]">National Bank of Rwanda</div>
            </div>
          </Link>
        </div>

        <nav className="flex-1 overflow-y-auto py-3">
          {visibleGroups.map((g) => (
            <div key={g.label} className="px-3 mb-4">
              <div className="px-2 mb-1 text-[10px] font-semibold uppercase tracking-wider text-[color:var(--color-ink-soft)]">
                {g.label}
              </div>
              <div className="space-y-0.5">
                {g.items.map((i) => (
                  <NavLink
                    key={i.to}
                    to={i.to}
                    end={i.end}
                    className={({ isActive }) =>
                      `flex items-center gap-2.5 px-2.5 py-2 rounded text-[13px] ${
                        isActive
                          ? 'bg-bnr text-white'
                          : 'text-[color:var(--color-ink)] hover:bg-bnr-soft'
                      }`
                    }
                  >
                    {i.icon}
                    {i.label}
                  </NavLink>
                ))}
              </div>
            </div>
          ))}
        </nav>
      </aside>

      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-14 border-b border-[color:var(--color-bnr-line)] flex items-center justify-end px-6 bg-white">
          <div className="relative">
            <button
              onClick={() => setMenuOpen((v) => !v)}
              className="flex items-center gap-2.5 px-2 py-1.5 rounded hover:bg-bnr-soft"
            >
              <div className="h-8 w-8 rounded-full bg-bnr text-white flex items-center justify-center text-xs font-semibold">
                {user?.full_name?.slice(0, 1).toUpperCase()}
              </div>
              <div className="text-left">
                <div className="text-[13px] font-medium">{user?.full_name}</div>
                <div className="text-[11px] text-[color:var(--color-ink-soft)]">
                  {user ? ROLE_LABEL[user.role] : ''}
                  {user?.department ? ` — ${user.department.name}` : ''}
                </div>
              </div>
              <ChevronDown size={14} className="text-[color:var(--color-ink-soft)]" />
            </button>
            {menuOpen && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(false)} />
                <div className="absolute right-0 mt-1.5 w-56 card shadow-md z-20 py-1">
                  <div className="px-3 py-2 border-b border-[color:var(--color-bnr-line)]">
                    <div className="text-[12px] font-medium truncate">{user?.email}</div>
                    {user?.institution_name && (
                      <div className="text-[11px] text-[color:var(--color-ink-soft)] truncate">
                        {user.institution_name}
                      </div>
                    )}
                  </div>
                  <button
                    onClick={onLogout}
                    className="w-full flex items-center gap-2 px-3 py-2 text-[13px] hover:bg-bnr-soft"
                  >
                    <LogOut size={14} /> Sign out
                  </button>
                </div>
              </>
            )}
          </div>
        </header>

        <main className="flex-1 overflow-auto bg-[color:var(--color-page)]">
          <div className="max-w-7xl mx-auto px-6 py-6">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
