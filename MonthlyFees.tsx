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
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { DollarSign, Check, X, Search } from 'lucide-react';
import { toast } from 'sonner';

const MONTHS = ['Octobre', 'Novembre', 'Décembre', 'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 'Juillet'];
const CLASS_OPTIONS = ['all', 'CI-A', 'CI-B', 'CP-A', 'CP-B', 'CE1-A', 'CE1-B', 'CE2-A', 'CE2-B', 'CM1-A', 'CM1-B', 'CM2-A', 'CM2-B'];

export default function MonthlyFees() {
  const navigate = useNavigate();
  const [students, setStudents] = useState<any[]>([]);
  const [fees, setFees] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterClass, setFilterClass] = useState('all');
  const [search, setSearch] = useState('');
  const [paymentDialog, setPaymentDialog] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<any>(null);
  const [paymentMonth, setPaymentMonth] = useState('Octobre');
  const [paymentAmount, setPaymentAmount] = useState('7000');

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
      const [studentsRes, feesRes] = await Promise.all([
        client.entities.students.query({ query: schoolId ? { school_id: schoolId } : {}, limit: 500 }),
        client.entities.monthly_fees.query({ query: schoolId ? { school_id: schoolId } : {}, limit: 5000 })
      ]);
      setStudents(studentsRes?.data?.items || []);
      setFees(feesRes?.data?.items || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const getPaymentStatus = (studentId: number, month: string) => {
    return fees.find(f => f.student_id === studentId && f.month === month && f.paid);
  };

  const handlePayment = async () => {
    if (!selectedStudent) return;
    try {
      await client.entities.monthly_fees.create({
        data: {
          school_id: schoolId,
          student_id: selectedStudent.id,
          month: paymentMonth,
          amount: parseFloat(paymentAmount),
          paid: true,
          payment_date: new Date().toISOString().split('T')[0],
          academic_year: '2025-2026'
        }
      });
      toast.success(`Paiement enregistré pour ${selectedStudent.first_name} ${selectedStudent.last_name}`);
      setPaymentDialog(false);
      loadData();
    } catch { toast.error("Erreur lors de l'enregistrement"); }
  };

  const openPayment = (student: any) => {
    setSelectedStudent(student);
    setPaymentDialog(true);
  };

  const filtered = students.filter(s => {
    const matchSearch = `${s.first_name} ${s.last_name}`.toLowerCase().includes(search.toLowerCase());
    const matchClass = filterClass === 'all' || s.class_name === filterClass;
    return matchSearch && matchClass;
  });

  const totalCollected = fees.filter(f => f.paid).reduce((sum, f) => sum + (f.amount || 0), 0);

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Gestion des Mensualités</h1>
            <p className="text-gray-500">Suivi des paiements mensuels</p>
          </div>
          <Card className="bg-green-50 border-green-200">
            <CardContent className="p-3 flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-green-600" />
              <div>
                <p className="text-xs text-green-600">Total Collecté</p>
                <p className="font-bold text-green-700">{totalCollected.toLocaleString()} F CFA</p>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardContent className="p-4">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input placeholder="Rechercher..." value={search} onChange={e => setSearch(e.target.value)} className="pl-10" />
              </div>
              <Select value={filterClass} onValueChange={setFilterClass}>
                <SelectTrigger className="w-32"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {CLASS_OPTIONS.map(c => <SelectItem key={c} value={c}>{c === 'all' ? 'Toutes' : c}</SelectItem>)}
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
                      <TableHead className="sticky left-0 bg-white z-10">Élève</TableHead>
                      <TableHead>Classe</TableHead>
                      {MONTHS.map(m => (
                        <TableHead key={m} className="text-center text-xs min-w-[60px]">{m.slice(0, 3)}</TableHead>
                      ))}
                      <TableHead className="text-center">Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filtered.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={13} className="text-center py-8 text-gray-500">
                          Aucun élève trouvé
                        </TableCell>
                      </TableRow>
                    ) : (
                      filtered.map(student => (
                        <TableRow key={student.id}>
                          <TableCell className="sticky left-0 bg-white font-medium text-sm">
                            {student.first_name} {student.last_name}
                          </TableCell>
                          <TableCell>
                            <span className="text-xs bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded">{student.class_name}</span>
                          </TableCell>
                          {MONTHS.map(month => {
                            const paid = getPaymentStatus(student.id, month);
                            return (
                              <TableCell key={month} className="text-center">
                                {paid ? (
                                  <Check className="h-4 w-4 text-green-500 mx-auto" />
                                ) : (
                                  <X className="h-4 w-4 text-red-300 mx-auto" />
                                )}
                              </TableCell>
                            );
                          })}
                          <TableCell className="text-center">
                            <Button size="sm" variant="outline" onClick={() => openPayment(student)} className="text-xs">
                              Payer
                            </Button>
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

        <Dialog open={paymentDialog} onOpenChange={setPaymentDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Enregistrer un Paiement</DialogTitle>
            </DialogHeader>
            {selectedStudent && (
              <div className="space-y-4 mt-4">
                <p className="font-medium">{selectedStudent.first_name} {selectedStudent.last_name} - {selectedStudent.class_name}</p>
                <div>
                  <Label>Mois</Label>
                  <Select value={paymentMonth} onValueChange={setPaymentMonth}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {MONTHS.map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Montant (F CFA)</Label>
                  <Input type="number" value={paymentAmount} onChange={e => setPaymentAmount(e.target.value)} />
                </div>
                <div className="flex justify-end gap-3">
                  <Button variant="outline" onClick={() => setPaymentDialog(false)}>Annuler</Button>
                  <Button onClick={handlePayment} className="bg-green-600 hover:bg-green-700">Confirmer</Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </AppLayout>
  );
}
