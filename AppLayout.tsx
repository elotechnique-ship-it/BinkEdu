import { ReactNode, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { client, getUserRole } from '@/lib/api';
import {
  GraduationCap, Users, BookOpen, ClipboardList, DollarSign,
  Calculator, Briefcase, Shield, LayoutDashboard, LogOut, Menu, X
} from 'lucide-react';
import { Button } from '@/components/ui/button';

interface AppLayoutProps {
  children: ReactNode;
  schoolName?: string;
}

const navItems = [
  { path: '/dashboard', label: 'Tableau de Bord', icon: LayoutDashboard, roles: ['super_admin', 'admin', 'teacher'] },
  { path: '/students', label: 'Inscriptions', icon: Users, roles: ['super_admin', 'admin', 'teacher'] },
  { path: '/classes', label: 'Classes', icon: BookOpen, roles: ['super_admin', 'admin', 'teacher'] },
  { path: '/grades', label: 'Notes & Bulletins', icon: ClipboardList, roles: ['super_admin', 'admin', 'teacher'] },
  { path: '/fees', label: 'Mensualités', icon: DollarSign, roles: ['super_admin', 'admin'] },
  { path: '/accounting', label: 'Comptabilité', icon: Calculator, roles: ['super_admin', 'admin'] },
  { path: '/staff', label: 'Personnel & Salaires', icon: Briefcase, roles: ['super_admin', 'admin'] },
  { path: '/super-admin', label: 'Super Admin', icon: Shield, roles: ['super_admin'] },
];

export default function AppLayout({ children, schoolName }: AppLayoutProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const role = getUserRole() || 'admin';

  const filteredNav = navItems.filter(item => item.roles.includes(role));

  const handleLogout = () => {
    localStorage.removeItem('current_school_id');
    localStorage.removeItem('user_role');
    client.auth.logout();
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      <aside className={`fixed lg:static inset-y-0 left-0 z-50 w-64 bg-blue-900 text-white transform transition-transform duration-200 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>
        <div className="p-4 border-b border-blue-800">
          <div className="flex items-center gap-3">
            <div className="bg-amber-500/20 p-2 rounded-lg">
              <GraduationCap className="h-6 w-6 text-amber-400" />
            </div>
            <div className="flex-1 min-w-0">
              <h1 className="text-sm font-bold truncate">{schoolName || 'EPSCHB'}</h1>
              <p className="text-xs text-blue-300 capitalize">{role === 'super_admin' ? 'Super Admin' : role}</p>
            </div>
          </div>
        </div>

        <nav className="p-3 space-y-1 flex-1">
          {filteredNav.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <button
                key={item.path}
                onClick={() => { navigate(item.path); setSidebarOpen(false); }}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                  isActive ? 'bg-blue-700 text-white' : 'text-blue-200 hover:bg-blue-800 hover:text-white'
                }`}
              >
                <item.icon className="h-5 w-5 flex-shrink-0" />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        <div className="p-3 border-t border-blue-800">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-blue-200 hover:bg-blue-800 hover:text-white transition-all"
          >
            <LogOut className="h-5 w-5" />
            <span>Déconnexion</span>
          </button>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0">
        <header className="bg-white border-b border-gray-200 px-4 py-3 flex items-center gap-4 sticky top-0 z-30">
          <Button variant="ghost" size="icon" className="lg:hidden" onClick={() => setSidebarOpen(true)}>
            <Menu className="h-5 w-5" />
          </Button>
          <div className="flex-1" />
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 bg-blue-100 rounded-full flex items-center justify-center">
              <Users className="h-4 w-4 text-blue-600" />
            </div>
          </div>
        </header>

        <main className="flex-1 p-4 md:p-6 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
