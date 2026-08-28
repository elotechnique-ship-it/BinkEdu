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
import { Save, BookOpen } from 'lucide-react';
import { toast } from 'sonner';

const CLASS_OPTIONS = ['CI-A', 'CI-B', 'CP-A', 'CP-B', 'CE1-A', 'CE1-B', 'CE2-A', 'CE2-B', 'CM1-A', 'CM1-B', 'CM2-A', 'CM2-B'];
const SUBJECTS = [
  { key: 'french_resource', label: 'Fr. Ress.' },
  { key: 'french_competence', label: 'Fr. Comp.' },
  { key: 'math_resource', label: 'Math Ress.' },
  { key: 'math_competence', label: 'Math Comp.' },
  { key: 'arabic', label: 'Arabe' },
  { key: 'religious_education', label: 'Éd. Relig.' },
  { key: 'history', label: 'Histoire' },
  { key: 'geography', label: 'Géo.' },
  { key: 'ist', label: 'IST' },
  { key: 've', label: 'VE' },
  { key: 'vdm', label: 'VDM' },
  { key: 'copy', label: 'Copie' },
  { key: 'arts', label: 'Arts' },
  { key: 'conduct', label: 'Conduite' },
];

export default function Grades() {
  const navigate = useNavigate();
  const [students, setStudents] = useState<any[]>([]);
  const [grades, setGrades] = useState<Record<number, any>>({});
  const [selectedClass, setSelectedClass] = useState('CI-A');
  const [trimester, setTrimester] = useState('1');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const schoolId = getSchoolId();

  useEffect(() => { checkAuth(); }, []);
  useEffect(() => { if (schoolId) loadData(); }, [selectedClass, trimester]);

  const checkAuth = async () => {
    try {
      const res = await client.auth.me();
      if (!res?.data) { navigate('/'); return; }
      loadData();
    } catch { navigate('/'); }
  };

  const loadData = async () => {
    setLoading(true);
    try {
      const studentsRes = await client.entities.students.query({
        query: { school_id: schoolId, class_name: selectedClass },
        limit: 100
      });
      const studentsList = studentsRes?.data?.items || [];
      setStudents(studentsList);

      const gradesRes = await client.entities.grades.query({
        query: { school_id: schoolId, trimester: parseInt(trimester) },
        limit: 500
      });
      const existingGrades: Record<number, any> = {};
      (gradesRes?.data?.items || []).forEach((g: any) => {
        if (studentsList.find((s: any) => s.id === g.student_id)) {
          existingGrades[g.student_id] = g;
        }
      });
      setGrades(existingGrades);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const updateGrade = (studentId: number, subject: string, value: string) => {
    const numVal = parseFloat(value) || 0;
    setGrades(prev => ({
      ...prev,
      [studentId]: { ...(prev[studentId] || {}), [subject]: numVal, student_id: studentId }
    }));
  };

  const calculateTotal = (studentId: number) => {
    const g = grades[studentId] || {};
    return SUBJECTS.reduce((sum, s) => sum + (g[s.key] || 0), 0);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      for (const student of students) {
        const gradeData = grades[student.id];
        if (!gradeData) continue;

        const total = calculateTotal(student.id);
        const payload = {
          school_id: schoolId,
          student_id: student.id,
          class_id: 0,
          trimester: parseInt(trimester),
          ...Object.fromEntries(SUBJECTS.map(s => [s.key, gradeData[s.key] || 0])),
          total,
          average: Math.round((total / SUBJECTS.length) * 100) / 100
        };

        if (gradeData.id) {
          await client.entities.grades.update({ id: String(gradeData.id), data: payload });
        } else {
          await client.entities.grades.create({ data: payload });
        }
      }
      toast.success('Notes enregistrées avec succès');
      loadData();
    } catch (err) {
      toast.error("Erreur lors de l'enregistrement");
    } finally {
      setSaving(false);
    }
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Gestion des Notes</h1>
            <p className="text-gray-500">Saisie des compositions par trimestre</p>
          </div>
          <Button onClick={handleSave} disabled={saving} className="bg-green-600 hover:bg-green-700">
            <Save className="h-4 w-4 mr-2" /> {saving ? 'Enregistrement...' : 'Enregistrer'}
          </Button>
        </div>

        <Card>
          <CardContent className="p-4">
            <div className="flex flex-col sm:flex-row gap-4">
              <div>
                <Label className="text-xs text-gray-500">Classe</Label>
                <Select value={selectedClass} onValueChange={setSelectedClass}>
                  <SelectTrigger className="w-32"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {CLASS_OPTIONS.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs text-gray-500">Trimestre</Label>
                <Select value={trimester} onValueChange={setTrimester}>
                  <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">1er Trimestre</SelectItem>
                    <SelectItem value="2">2ème Trimestre</SelectItem>
                    <SelectItem value="3">3ème Trimestre</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-0">
            {loading ? (
              <div className="flex justify-center p-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              </div>
            ) : students.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                <BookOpen className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p>Aucun élève dans cette classe</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="sticky left-0 bg-white z-10 w-8">#</TableHead>
                      <TableHead className="sticky left-8 bg-white z-10 min-w-[120px]">Élève</TableHead>
                      {SUBJECTS.map(s => (
                        <TableHead key={s.key} className="text-center min-w-[60px] text-xs">{s.label}</TableHead>
                      ))}
                      <TableHead className="text-center font-bold">Total</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {students.map((student, idx) => (
                      <TableRow key={student.id}>
                        <TableCell className="sticky left-0 bg-white">{idx + 1}</TableCell>
                        <TableCell className="sticky left-8 bg-white font-medium text-sm">
                          {student.first_name} {student.last_name}
                        </TableCell>
                        {SUBJECTS.map(s => (
                          <TableCell key={s.key} className="p-1">
                            <Input
                              type="number"
                              min="0"
                              max="100"
                              className="w-14 h-8 text-center text-sm p-1"
                              value={grades[student.id]?.[s.key] || ''}
                              onChange={e => updateGrade(student.id, s.key, e.target.value)}
                            />
                          </TableCell>
                        ))}
                        <TableCell className="text-center font-bold text-blue-700">
                          {calculateTotal(student.id)}
                        </TableCell>
                      </TableRow>
                    ))}
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
