import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { client, getSchoolId, setSchoolId, setUserRole, getUserRole } from '@/lib/api';
import AppLayout from '@/components/AppLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, BookOpen, DollarSign, GraduationCap, TrendingUp, AlertCircle } from 'lucide-react';

export default function Dashboard() {
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ students: 0, classes: 0, staff: 0, balance: 0 });
  const [schoolName, setSchoolName] = useState('');

  useEffect(() => {
    initDashboard();
  }, []);

  const initDashboard = async () => {
    try {
      const res = await client.auth.me();
      if (!res?.data) {
        navigate('/');
        return;
      }
      setUser(res.data);

      const membersRes = await client.entities.school_members.query({ query: {} });
      const members = membersRes?.data?.items || [];

      if (members.length > 0) {
        const member = members[0];
        setSchoolId(member.school_id);
        setUserRole(member.role);

        const schoolRes = await client.entities.schools.get({ id: String(member.school_id) });
        if (schoolRes?.data) {
          setSchoolName(schoolRes.data.name);
        }

        await loadStats(member.school_id);
      } else {
        const schoolsRes = await client.entities.schools.query({ query: {} });
        const schools = schoolsRes?.data?.items || [];
        if (schools.length > 0) {
          setSchoolId(schools[0].id);
          setUserRole('super_admin');
          setSchoolName(schools[0].name);
          await loadStats(schools[0].id);
        } else {
          setUserRole('super_admin');
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async (schoolId: number) => {
    try {
      const [studentsRes, classesRes, staffRes] = await Promise.all([
        client.entities.students.query({ query: { school_id: schoolId }, limit: 1 }),
        client.entities.classes.query({ query: { school_id: schoolId }, limit: 1 }),
        client.entities.staff.query({ query: { school_id: schoolId }, limit: 1 }),
      ]);
      setStats({
        students: studentsRes?.data?.items?.length || 0,
        classes: classesRes?.data?.items?.length || 0,
        staff: staffRes?.data?.items?.length || 0,
        balance: 0,
      });
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) {
    return (
      <AppLayout schoolName={schoolName}>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
        </div>
      </AppLayout>
    );
  }

  const role = getUserRole() || 'admin';

  return (
    <AppLayout schoolName={schoolName}>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Tableau de Bord</h1>
          <p className="text-gray-500 mt-1">
            Bienvenue{schoolName ? ` - ${schoolName}` : ''} | Année Scolaire 2025-2026
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="border-l-4 border-l-blue-500">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Élèves Inscrits</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.students}</p>
                </div>
                <div className="bg-blue-100 p-3 rounded-lg">
                  <Users className="h-6 w-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-green-500">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Classes</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.classes}</p>
                </div>
                <div className="bg-green-100 p-3 rounded-lg">
                  <BookOpen className="h-6 w-6 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-amber-500">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Personnel</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.staff}</p>
                </div>
                <div className="bg-amber-100 p-3 rounded-lg">
                  <GraduationCap className="h-6 w-6 text-amber-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-purple-500">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Solde Caisse</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.balance.toLocaleString()} F</p>
                </div>
                <div className="bg-purple-100 p-3 rounded-lg">
                  <DollarSign className="h-6 w-6 text-purple-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Actions Rapides</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <button onClick={() => navigate('/students')} className="flex flex-col items-center gap-2 p-4 rounded-lg bg-blue-50 hover:bg-blue-100 transition-colors">
                <Users className="h-8 w-8 text-blue-600" />
                <span className="text-sm font-medium text-gray-700">Inscriptions</span>
              </button>
              <button onClick={() => navigate('/grades')} className="flex flex-col items-center gap-2 p-4 rounded-lg bg-green-50 hover:bg-green-100 transition-colors">
                <BookOpen className="h-8 w-8 text-green-600" />
                <span className="text-sm font-medium text-gray-700">Saisir Notes</span>
              </button>
              <button onClick={() => navigate('/fees')} className="flex flex-col items-center gap-2 p-4 rounded-lg bg-amber-50 hover:bg-amber-100 transition-colors">
                <DollarSign className="h-8 w-8 text-amber-600" />
                <span className="text-sm font-medium text-gray-700">Mensualités</span>
              </button>
              <button onClick={() => navigate('/accounting')} className="flex flex-col items-center gap-2 p-4 rounded-lg bg-purple-50 hover:bg-purple-100 transition-colors">
                <TrendingUp className="h-8 w-8 text-purple-600" />
                <span className="text-sm font-medium text-gray-700">Comptabilité</span>
              </button>
            </div>
          </CardContent>
        </Card>

        {role === 'super_admin' && !getSchoolId() && (
          <Card className="border-amber-200 bg-amber-50">
            <CardContent className="p-4 flex items-center gap-3">
              <AlertCircle className="h-5 w-5 text-amber-600" />
              <p className="text-sm text-amber-800">
                Aucune école configurée. Allez dans <button onClick={() => navigate('/super-admin')} className="font-bold underline">Super Admin</button> pour créer votre première école.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </AppLayout>
  );
}
