import { Toaster } from '@/components/ui/sonner';
import { TooltipProvider } from '@/components/ui/tooltip';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Index from './pages/Index';
import AuthCallback from './pages/AuthCallback';
import AuthError from './pages/AuthError';
import Dashboard from './pages/Dashboard';
import Students from './pages/Students';
import Classes from './pages/Classes';
import Grades from './pages/Grades';
import MonthlyFees from './pages/MonthlyFees';
import Accounting from './pages/Accounting';
import Staff from './pages/Staff';
import SuperAdmin from './pages/SuperAdmin';

const queryClient = new QueryClient();

const AppRoutes = () => (
  <Routes>
    <Route path="/" element={<Index />} />
    <Route path="/auth/callback" element={<AuthCallback />} />
    <Route path="/auth/error" element={<AuthError />} />
    <Route path="/dashboard" element={<Dashboard />} />
    <Route path="/students" element={<Students />} />
    <Route path="/classes" element={<Classes />} />
    <Route path="/grades" element={<Grades />} />
    <Route path="/fees" element={<MonthlyFees />} />
    <Route path="/accounting" element={<Accounting />} />
    <Route path="/staff" element={<Staff />} />
    <Route path="/super-admin" element={<SuperAdmin />} />
  </Routes>
);

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
export { AppRoutes };
