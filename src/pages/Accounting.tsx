import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { client, getSchoolId } from '@/lib/api';
import AppLayout from '@/components/AppLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Plus, TrendingUp, TrendingDown, Wallet } from 'lucide-react';
import { toast } from 'sonner';

export default function Accounting() {
  const navigate = useNavigate();
  const [entries, setEntries] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState({
    entry_type: 'income', category: 'inscription', description: '', amount: '', entry_date: new Date().toISOString().split('T')[0]
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
      const res = await client.entities.accounting_entries.query({
        query: schoolId ? { school_id: schoolId } : {},
        sort: '-created_at',
        limit: 200
      });
      setEntries(res?.data?.items || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!form.amount || !form.description) {
      toast.error('Montant et description obligatoires');
      return;
    }
    try {
      await client.entities.accounting_entries.create({
        data: { ...form, amount: parseFloat(form.amount), school_id: schoolId }
      });
      toast.success('Écriture enregistrée');
      setDialogOpen(false);
      setForm({ entry_type: 'income', category: 'inscription', description: '', amount: '', entry_date: new Date().toISOString().split('T')[0] });
      loadData();
    } catch { toast.error('Erreur'); }
  };

  const totalIncome = entries.filter(e => e.entry_type === 'income').reduce((s, e) => s + (e.amount || 0), 0);
  const totalExpense = entries.filter(e => e.entry_type === 'expense').reduce((s, e) => s + (e.amount || 0), 0);
  const balance = totalIncome - totalExpense;

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Comptabilité</h1>
            <p className="text-gray-500">Journal de caisse</p>
          </div>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-blue-600 hover:bg-blue-700">
                <Plus className="h-4 w-4 mr-2" /> Nouvelle Écriture
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Nouvelle Écriture Comptable</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 mt-4">
                <div>
                  <Label>Type</Label>
                  <Select value={form.entry_type} onValueChange={v => setForm({...form, entry_type: v})}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="income">Encaissement (+)</SelectItem>
                      <SelectItem value="expense">Décaissement (-)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Catégorie</Label>
                  <Select value={form.category} onValueChange={v => setForm({...form, category: v})}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="inscription">Inscription</SelectItem>
                      <SelectItem value="mensualite">Mensualité</SelectItem>
                      <SelectItem value="salaire">Salaire</SelectItem>
                      <SelectItem value="fourniture">Fournitures</SelectItem>
                      <SelectItem value="virement">Virement</SelectItem>
                      <SelectItem value="autre">Autre</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Description</Label>
                  <Input value={form.description} onChange={e => setForm({...form, description: e.target.value})} placeholder="Description de l'opération" />
                </div>
                <div>
                  <Label>Montant (F CFA)</Label>
                  <Input type="number" value={form.amount} onChange={e => setForm({...form, amount: e.target.value})} />
                </div>
                <div>
                  <Label>Date</Label>
                  <Input type="date" value={form.entry_date} onChange={e => setForm({...form, entry_date: e.target.value})} />
                </div>
                <div className="flex justify-end gap-3">
                  <Button variant="outline" onClick={() => setDialogOpen(false)}>Annuler</Button>
                  <Button onClick={handleSubmit} className="bg-blue-600 hover:bg-blue-700">Enregistrer</Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card className="border-l-4 border-l-green-500">
            <CardContent className="p-4 flex items-center gap-3">
              <TrendingUp className="h-8 w-8 text-green-500" />
              <div>
                <p className="text-sm text-gray-500">Encaissements</p>
                <p className="text-xl font-bold text-green-700">{totalIncome.toLocaleString()} F</p>
              </div>
            </CardContent>
          </Card>
          <Card className="border-l-4 border-l-red-500">
            <CardContent className="p-4 flex items-center gap-3">
              <TrendingDown className="h-8 w-8 text-red-500" />
              <div>
                <p className="text-sm text-gray-500">Décaissements</p>
                <p className="text-xl font-bold text-red-700">{totalExpense.toLocaleString()} F</p>
              </div>
            </CardContent>
          </Card>
          <Card className="border-l-4 border-l-blue-500">
            <CardContent className="p-4 flex items-center gap-3">
              <Wallet className="h-8 w-8 text-blue-500" />
              <div>
                <p className="text-sm text-gray-500">Solde</p>
                <p className={`text-xl font-bold ${balance >= 0 ? 'text-blue-700' : 'text-red-700'}`}>{balance.toLocaleString()} F</p>
              </div>
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
                      <TableHead>Date</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Catégorie</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead className="text-right">Montant</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {entries.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center py-8 text-gray-500">
                          Aucune écriture comptable
                        </TableCell>
                      </TableRow>
                    ) : (
                      entries.map(entry => (
                        <TableRow key={entry.id}>
                          <TableCell className="text-sm">{entry.entry_date || '-'}</TableCell>
                          <TableCell>
                            <span className={`text-xs font-medium px-2 py-1 rounded ${entry.entry_type === 'income' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                              {entry.entry_type === 'income' ? 'Encaissement' : 'Décaissement'}
                            </span>
                          </TableCell>
                          <TableCell className="capitalize text-sm">{entry.category}</TableCell>
                          <TableCell className="text-sm">{entry.description}</TableCell>
                          <TableCell className={`text-right font-medium ${entry.entry_type === 'income' ? 'text-green-600' : 'text-red-600'}`}>
                            {entry.entry_type === 'income' ? '+' : '-'}{(entry.amount || 0).toLocaleString()} F
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
