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
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Search, Edit, Trash2, UserPlus } from 'lucide-react';
import { toast } from 'sonner';

const CLASS_OPTIONS = [
  'CI-A', 'CI-B', 'CP-A', 'CP-B', 'CE1-A', 'CE1-B',
  'CE2-A', 'CE2-B', 'CM1-A', 'CM1-B', 'CM2-A', 'CM2-B'
];

interface Student {
  id: number;
  first_name: string;
  last_name: string;
  gender: string;
  birth_date: string;
  birth_place: string;
  address: string;
  parent_name: string;
  mother_name: string;
  phone: string;
  class_name: string;
  enrollment_date: string;
  status: string;
}

export default function Students() {
  const navigate = useNavigate();
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterClass, setFilterClass] = useState('all');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [form, setForm] = useState({
    first_name: '', last_name: '', gender: 'M', birth_date: '',
    birth_place: '', address: '', parent_name: '', mother_name: '',
    phone: '', class_name: 'CI-A'
  });

  const schoolId = getSchoolId();

  useEffect(() => { checkAuth(); }, []);

  const checkAuth = async () => {
    try {
      const res = await client.auth.me();
      if (!res?.data) { navigate('/'); return; }
      loadStudents();
    } catch { navigate('/'); }
  };

  const loadStudents = async () => {
    try {
      const res = await client.entities.students.query({
        query: schoolId ? { school_id: schoolId } : {},
        sort: '-created_at',
        limit: 500
      });
      setStudents(res?.data?.items || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!form.first_name || !form.last_name) {
      toast.error('Prénom et nom sont obligatoires');
      return;
    }
    try {
      const data = {
        ...form,
        school_id: schoolId,
        enrollment_date: new Date().toISOString().split('T')[0],
        status: 'active'
      };
      if (editingStudent) {
        await client.entities.students.update({ id: String(editingStudent.id), data });
        toast.success('Élève modifié avec succès');
      } else {
        await client.entities.students.create({ data });
        toast.success('Élève inscrit avec succès');
      }
      setDialogOpen(false);
      resetForm();
      loadStudents();
    } catch (err) {
      toast.error("Erreur lors de l'enregistrement");
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Supprimer cet élève ?')) return;
    try {
      await client.entities.students.delete({ id: String(id) });
      toast.success('Élève supprimé');
      loadStudents();
    } catch { toast.error('Erreur lors de la suppression'); }
  };

  const handleEdit = (student: Student) => {
    setEditingStudent(student);
    setForm({
      first_name: student.first_name || '',
      last_name: student.last_name || '',
      gender: student.gender || 'M',
      birth_date: student.birth_date || '',
      birth_place: student.birth_place || '',
      address: student.address || '',
      parent_name: student.parent_name || '',
      mother_name: student.mother_name || '',
      phone: student.phone || '',
      class_name: student.class_name || 'CI-A'
    });
    setDialogOpen(true);
  };

  const resetForm = () => {
    setEditingStudent(null);
    setForm({ first_name: '', last_name: '', gender: 'M', birth_date: '', birth_place: '', address: '', parent_name: '', mother_name: '', phone: '', class_name: 'CI-A' });
  };

  const filtered = students.filter(s => {
    const matchSearch = `${s.first_name} ${s.last_name}`.toLowerCase().includes(search.toLowerCase());
    const matchClass = filterClass === 'all' || s.class_name === filterClass;
    return matchSearch && matchClass;
  });

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Gestion des Inscriptions</h1>
            <p className="text-gray-500">Effectif total : {students.length} élèves</p>
          </div>
          <Dialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); if (!open) resetForm(); }}>
            <DialogTrigger asChild>
              <Button className="bg-blue-600 hover:bg-blue-700">
                <UserPlus className="h-4 w-4 mr-2" /> Nouvelle Inscription
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>{editingStudent ? "Modifier l'élève" : 'Nouvelle Inscription'}</DialogTitle>
              </DialogHeader>
              <div className="grid grid-cols-2 gap-4 mt-4">
                <div>
                  <Label>Prénom *</Label>
                  <Input value={form.first_name} onChange={e => setForm({...form, first_name: e.target.value})} />
                </div>
                <div>
                  <Label>Nom *</Label>
                  <Input value={form.last_name} onChange={e => setForm({...form, last_name: e.target.value})} />
                </div>
                <div>
                  <Label>Sexe</Label>
                  <Select value={form.gender} onValueChange={v => setForm({...form, gender: v})}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="M">Masculin</SelectItem>
                      <SelectItem value="F">Féminin</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Date de Naissance</Label>
                  <Input type="date" value={form.birth_date} onChange={e => setForm({...form, birth_date: e.target.value})} />
                </div>
                <div>
                  <Label>Lieu de Naissance</Label>
                  <Input value={form.birth_place} onChange={e => setForm({...form, birth_place: e.target.value})} />
                </div>
                <div>
                  <Label>Adresse</Label>
                  <Input value={form.address} onChange={e => setForm({...form, address: e.target.value})} />
                </div>
                <div>
                  <Label>Parent/Tuteur</Label>
                  <Input value={form.parent_name} onChange={e => setForm({...form, parent_name: e.target.value})} />
                </div>
                <div>
                  <Label>Nom de la Mère</Label>
                  <Input value={form.mother_name} onChange={e => setForm({...form, mother_name: e.target.value})} />
                </div>
                <div>
                  <Label>Téléphone</Label>
                  <Input value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} />
                </div>
                <div>
                  <Label>Classe</Label>
                  <Select value={form.class_name} onValueChange={v => setForm({...form, class_name: v})}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {CLASS_OPTIONS.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="flex justify-end gap-3 mt-6">
                <Button variant="outline" onClick={() => { setDialogOpen(false); resetForm(); }}>Annuler</Button>
                <Button onClick={handleSubmit} className="bg-blue-600 hover:bg-blue-700">
                  {editingStudent ? 'Modifier' : 'Inscrire'}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <Card>
          <CardContent className="p-4">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input placeholder="Rechercher un élève..." value={search} onChange={e => setSearch(e.target.value)} className="pl-10" />
              </div>
              <Select value={filterClass} onValueChange={setFilterClass}>
                <SelectTrigger className="w-40"><SelectValue placeholder="Classe" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Toutes</SelectItem>
                  {CLASS_OPTIONS.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-0">
            {loading ? (
              <div className="flex justify-center p-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-12">#</TableHead>
                      <TableHead>Prénom</TableHead>
                      <TableHead>Nom</TableHead>
                      <TableHead>Sexe</TableHead>
                      <TableHead>Classe</TableHead>
                      <TableHead>Parent/Tuteur</TableHead>
                      <TableHead>Téléphone</TableHead>
                      <TableHead className="w-24">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filtered.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={8} className="text-center py-8 text-gray-500">
                          Aucun élève trouvé
                        </TableCell>
                      </TableRow>
                    ) : (
                      filtered.map((student, idx) => (
                        <TableRow key={student.id}>
                          <TableCell className="font-medium">{idx + 1}</TableCell>
                          <TableCell>{student.first_name}</TableCell>
                          <TableCell className="font-medium">{student.last_name}</TableCell>
                          <TableCell>{student.gender}</TableCell>
                          <TableCell>
                            <span className="bg-blue-100 text-blue-700 text-xs font-medium px-2 py-1 rounded">
                              {student.class_name}
                            </span>
                          </TableCell>
                          <TableCell>{student.parent_name}</TableCell>
                          <TableCell>{student.phone}</TableCell>
                          <TableCell>
                            <div className="flex gap-1">
                              <Button variant="ghost" size="icon" onClick={() => handleEdit(student)}>
                                <Edit className="h-4 w-4 text-blue-600" />
                              </Button>
                              <Button variant="ghost" size="icon" onClick={() => handleDelete(student.id)}>
                                <Trash2 className="h-4 w-4 text-red-500" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
