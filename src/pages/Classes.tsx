import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { client, getSchoolId } from '@/lib/api';
import AppLayout from '@/components/AppLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Plus, Users, BookOpen } from 'lucide-react';
import { toast } from 'sonner';

const LEVELS = ['CI', 'CP', 'CE1', 'CE2', 'CM1', 'CM2'];

interface ClassItem {
  id: number;
  name: string;
  level: string;
  section: string;
  teacher_name: string;
  capacity: number;
}

export default function Classes() {
  const navigate = useNavigate();
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState({ name: '', level: 'CI', section: 'A', teacher_name: '', capacity: 50 });

  const schoolId = getSchoolId();

  useEffect(() => { checkAuth(); }, []);

  const checkAuth = async () => {
    try {
      const res = await client.auth.me();
      if (!res?.data) { navigate('/'); return; }
      loadData();
    } catch { navigate('/'); }
  };

  const loadData = async () => {
    try {
      const [classesRes, studentsRes] = await Promise.all([
        client.entities.classes.query({ query: schoolId ? { school_id: schoolId } : {}, limit: 100 }),
        client.entities.students.query({ query: schoolId ? { school_id: schoolId } : {}, limit: 500 })
      ]);
      setClasses(classesRes?.data?.items || []);
      setStudents(studentsRes?.data?.items || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    const name = `${form.level}-${form.section}`;
    try {
      await client.entities.classes.create({
        data: { name, level: form.level, section: form.section, teacher_name: form.teacher_name, capacity: form.capacity, school_id: schoolId }
      });
      toast.success('Classe créée avec succès');
      setDialogOpen(false);
      loadData();
    } catch { toast.error('Erreur lors de la création'); }
  };

  const getStudentCount = (className: string) => {
    return students.filter(s => s.class_name === className).length;
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Gestion des Classes</h1>
            <p className="text-gray-500">{classes.length} classes configurées</p>
          </div>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-blue-600 hover:bg-blue-700">
                <Plus className="h-4 w-4 mr-2" /> Nouvelle Classe
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Créer une Classe</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 mt-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Niveau</Label>
                    <Select value={form.level} onValueChange={v => setForm({...form, level: v})}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {LEVELS.map(l => <SelectItem key={l} value={l}>{l}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Section</Label>
                    <Select value={form.section} onValueChange={v => setForm({...form, section: v})}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="A">A</SelectItem>
                        <SelectItem value="B">B</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div>
                  <Label>Enseignant(e)</Label>
                  <Input value={form.teacher_name} onChange={e => setForm({...form, teacher_name: e.target.value})} placeholder="Nom de l'enseignant" />
                </div>
                <div>
                  <Label>Capacité</Label>
                  <Input type="number" value={form.capacity} onChange={e => setForm({...form, capacity: parseInt(e.target.value) || 50})} />
                </div>
                <div className="flex justify-end gap-3">
                  <Button variant="outline" onClick={() => setDialogOpen(false)}>Annuler</Button>
                  <Button onClick={handleSubmit} className="bg-blue-600 hover:bg-blue-700">Créer</Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {loading ? (
          <div className="flex justify-center p-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {classes.length === 0 ? (
              <Card className="col-span-full">
                <CardContent className="p-8 text-center text-gray-500">
                  <BookOpen className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  <p>Aucune classe configurée. Créez votre première classe.</p>
                </CardContent>
              </Card>
            ) : (
              classes.map(cls => (
                <Card key={cls.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-5">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-lg font-bold text-blue-800">{cls.name}</h3>
                      <span className="bg-blue-100 text-blue-700 text-xs font-medium px-2 py-1 rounded">
                        {cls.level}
                      </span>
                    </div>
                    <div className="space-y-2 text-sm text-gray-600">
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4" />
                        <span>{getStudentCount(cls.name)} / {cls.capacity} élèves</span>
                      </div>
                      {cls.teacher_name && (
                        <div className="flex items-center gap-2">
                          <BookOpen className="h-4 w-4" />
                          <span>M. {cls.teacher_name}</span>
                        </div>
                      )}
                    </div>
                    <div className="mt-3 bg-gray-100 rounded-full h-2">
                      <div
                        className="bg-blue-500 h-2 rounded-full transition-all"
                        style={{ width: `${Math.min(100, (getStudentCount(cls.name) / cls.capacity) * 100)}%` }}
                      />
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
