import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { client } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { GraduationCap, Users, BookOpen, DollarSign, Shield } from 'lucide-react';

export default function Index() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    client.auth.me()
      .then((res) => {
        if (res?.data) {
          navigate('/dashboard');
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleLogin = () => {
    client.auth.toLogin();
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-900 to-blue-700">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-blue-800 to-indigo-900">
      <header className="p-6 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <div className="bg-white/10 backdrop-blur-sm p-2 rounded-xl">
            <GraduationCap className="h-8 w-8 text-amber-400" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white">EPSCHB</h1>
            <p className="text-xs text-blue-200">Gestion Scolaire</p>
          </div>
        </div>
        <Button onClick={handleLogin} className="bg-amber-500 hover:bg-amber-600 text-white font-semibold px-6">
          Se Connecter
        </Button>
      </header>

      <main className="container mx-auto px-6 py-16">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-6 leading-tight">
            Système de Gestion Scolaire
            <span className="block text-amber-400 mt-2">Complet et Moderne</span>
          </h2>
          <p className="text-lg text-blue-200 mb-8">
            Gérez votre école efficacement : inscriptions, notes, bulletins, mensualités, comptabilité et salaires. Tout en un seul endroit.
          </p>
          <Button onClick={handleLogin} size="lg" className="bg-amber-500 hover:bg-amber-600 text-white font-bold text-lg px-10 py-6">
            Commencer Maintenant
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-5xl mx-auto">
          {[
            { icon: Users, title: 'Inscriptions', desc: 'Gestion complète des élèves' },
            { icon: BookOpen, title: 'Notes & Bulletins', desc: 'Saisie et génération automatique' },
            { icon: DollarSign, title: 'Finances', desc: 'Mensualités et comptabilité' },
            { icon: Shield, title: 'Multi-Écoles', desc: 'Administration centralisée' },
          ].map((feature, i) => (
            <div key={i} className="bg-white/10 backdrop-blur-sm rounded-xl p-6 text-center border border-white/10 hover:bg-white/15 transition-all">
              <div className="bg-amber-500/20 w-14 h-14 rounded-xl flex items-center justify-center mx-auto mb-4">
                <feature.icon className="h-7 w-7 text-amber-400" />
              </div>
              <h3 className="text-white font-semibold mb-2">{feature.title}</h3>
              <p className="text-blue-200 text-sm">{feature.desc}</p>
            </div>
          ))}
        </div>
      </main>

      <footer className="text-center py-8 text-blue-300 text-sm">
        <p>© 2025 EPSCHB - Système de Gestion Scolaire</p>
      </footer>
    </div>
  );
}
