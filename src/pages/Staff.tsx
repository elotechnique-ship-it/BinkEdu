import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { client, getSchoolId } from '@/lib/api';
import AppLayout from '@/components/AppLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Plus, Edit, Trash2, Briefcase } from 'lucide-react';
import { toast } from 'sonner';

export default function Staff() {
  const navigate = useNavigate();
  const [staffList, setStaffList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingStaff, setEditingStaff] = useState<any>(null);
  const [form, setForm] = useState({
    first_name: '', last_name: '', address: '', phone: '', position: '',
    gross_salary: '', advance: '0', credit: '0', loan_repayment: '0',
    retirement: '0', mutual: '0', trimf: '0', tontine: '0'
  });

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
      const res = await client.entities.staff.query({
        query: schoolId ? { school_id: schoolId } : {},
        limit: 100
      });
      setStaffList(res?.data?.items || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!form.first_name || !form.last_name) {
      toast.error('Prénom et nom obligatoires');
      return;
    }
    try {
      const data = {
        ...form,
        school_id: schoolId,
        gross_salary: parseFloat(form.gross_salary) || 0,
        advance: parseFloat(form.advance) || 0,
        credit: parseFloat(form.credit) || 0,
        loan_repayment: parseFloat(form.loan_repayment) || 0,
        retirement: parseFloat(form.retirement) || 0,
        mutual: parseFloat(form.mutual) || 0,
        trimf: parseFloat(form.trimf) || 0,
        tontine: parseFloat(form.tontine) || 0,
      };
      if (editingStaff) {
        await client.entities.staff.update({ id: String(editingStaff.id), data });
        toast.success('Personnel modifié');
      } else {
        await client.entities.staff.create({ data });
        toast.success('Personnel ajouté');
      }
      setDialogOpen(false);
      resetForm();
      loadData();
    } catch { toast.error('Erreur'); }
  };

  const handleEdit = (s: any) => {
    setEditingStaff(s);
    setForm({
      first_name: s.first_name || '', last_name: s.last_name || '',
      address: s.address || '', phone: s.phone || '', position: s.position || '',
      gross_salary: String(s.gross_salary || 0), advance: String(s.advance || 0),
      credit: String(s.credit || 0), loan_repayment: String(s.loan_repayment || 0),
      retirement: String(s.retirement || 0), mutual: String(s.mutual || 0),
      trimf: String(s.trimf || 0), tontine: String(s.tontine || 0)
    });
    setDialogOpen(true);
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Supprimer ce personnel ?')) return;
    try {
      await client.entities.staff.delete({ id: String(id) });
      toast.success('Personnel supprimé');
      loadData();
    } catch { toast.error('Erreur'); }
  };

  const resetForm = () => {
    setEditingStaff(null);
    setForm({ first_name: '', last_name: '', address: '', phone: '', position: '', gross_salary: '', advance: '0', credit: '0', loan_repayment: '0', retirement: '0', mutual: '0', trimf: '0', tontine: '0' });
  };

  const getNetSalary = (s: any) => {
    return (s.gross_salary || 0) - (s.advance || 0) - (s.credit || 0) - (s.loan_repayment || 0) - (s.retirement || 0) - (s.mutual || 0) - (s.trimf || 0) - (s.tontine || 0);
  };

  const totalGross = staffList.reduce((sum, s) => sum + (s.gross_salary || 0), 0);
  const totalNet = staffList.reduce((sum, s) => sum + getNetSalary(s), 0);

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Personnel & Salaires</h1>
            <p className="text-gray-500">{staffList.length} membres du personnel</p>
          </div>
          <Dialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); if (!open) resetForm(); }}>
            <DialogTrigger asChild>
              <Button className="bg-blue-600 hover:bg-blue-700">
                <Plus className="h-4 w-4 mr-2" /> Ajouter Personnel
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>{editingStaff ? 'Modifier' : 'Ajouter'} Personnel</DialogTitle>
              </DialogHeader>
              <div className="grid grid-cols-2 gap-4 mt-4">
                <div><Label>Prénom *</Label><Input value={form.first_name} onChange={e => setForm({...form, first_name: e.target.value})} /></div>
                <div><Label>Nom *</Label><Input value={form.last_name} onChange={e => setForm({...form, last_name: e.target.value})} /></div>
                <div><Label>Poste</Label><Input value={form.position} onChange={e => setForm({...form, position: e.target.value})} placeholder="Enseignant, DG..." /></div>
                <div><Label>Téléphone</Label><Input value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} /></div>
                <div><Label>Adresse</Label><Input value={form.address} onChange={e => setForm({...form, address: e.target.value})} /></div>
                <div><Label>Salaire Brut</Label><Input type="number" value={form.gross_salary} onChange={e => setForm({...form, gross_salary: e.target.value})} /></div>
                <div><Label>Avances</Label><Input type="number" value={form.advance} onChange={e => setForm({...form, advance: e.target.value})} /></div>
                <div><Label>Crédit</Label><Input type="number" value={form.credit} onChange={e => setForm({...form, credit: e.target.value})} /></div>
                <div><Label>Remb. Emprunt</Label><Input type="number" value={form.loan_repayment} onChange={e => setForm({...form, loan_repayment: e.target.value})} /></div>
                <div><Label>Retraite</Label><Input type="number" value={form.retirement} onChange={e => setForm({...form, retirement: e.target.value})} /></div>
                <div><Label>Mutuelle</Label><Input type="number" value={form.mutual} onChange={e => setForm({...form, mutual: e.target.value})} /></div>
                <div><Label>TRIMF</Label><Input type="number" value={form.trimf} onChange={e => setForm({...form, trimf: e.target.value})} /></div>
                <div><Label>Tontine</Label><Input type="number" value={form.tontine} onChange={e => setForm({...form, tontine: e.target.value})} /></div>
              </div>
              <div className="flex justify-end gap-3 mt-6">
                <Button variant="outline" onClick={() => { setDialogOpen(false); resetForm(); }}>Annuler</Button>
                <Button onClick={handleSubmit} className="bg-blue-600 hover:bg-blue-700">{editingStaff ? 'Modifier' : 'Ajouter'}</Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Card className="border-l-4 border-l-blue-500">
            <CardContent className="p-4">
              <p className="text-sm text-gray-500">Masse Salariale Brute</p>
              <p className="text-xl font-bold">{totalGross.toLocaleString()} F CFA</p>
            </CardContent>
          </Card>
          <Card className="border-l-4 border-l-green-500">
            <CardContent className="p-4">
              <p className="text-sm text-gray-500">Total Net à Payer</p>
              <p className="text-xl font-bold text-green-700">{totalNet.toLocaleString()} F CFA</p>
            </CardContent>
          </Card>
        </div>

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
                      <TableHead>Nom Complet</TableHead>
                      <TableHead>Poste</TableHead>
                      <TableHead>Téléphone</TableHead>
                      <TableHead className="text-right">Brut</TableHead>
                      <TableHead className="text-right">Déductions</TableHead>
                      <TableHead className="text-right">Net</TableHead>
                      <TableHead className="w-20">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {staffList.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                          <Briefcase className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                          <p>Aucun personnel enregistré</p>
                        </TableCell>
                      </TableRow>
                    ) : (
                      staffList.map(s => {
                        const deductions = (s.advance || 0) + (s.credit || 0) + (s.loan_repayment || 0) + (s.retirement || 0) + (s.mutual || 0) + (s.trimf || 0) + (s.tontine || 0);
                        const net = getNetSalary(s);
                        return (
                          <TableRow key={s.id}>
                            <TableCell className="font-medium">{s.first_name} {s.last_name}</TableCell>
                            <TableCell>{s.position}</TableCell>
                            <TableCell>{s.phone}</TableCell>
                            <TableCell className="text-right">{(s.gross_salary || 0).toLocaleString()}</TableCell>
                            <TableCell className="text-right text-red-600">{deductions.toLocaleString()}</TableCell>
                            <TableCell className="text-right font-bold text-green-700">{net.toLocaleString()}</TableCell>
                            <TableCell>
                              <div className="flex gap-1">
                                <Button variant="ghost" size="icon" onClick={() => handleEdit(s)}>
                                  <Edit className="h-4 w-4 text-blue-600" />
                                </Button>
                                <Button variant="ghost" size="icon" onClick={() => handleDelete(s.id)}>
                                  <Trash2 className="h-4 w-4 text-red-500" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        );
                      })
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
