import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { client, setSchoolId } from '@/lib/api';
import AppLayout from '@/components/AppLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, Building2, Settings, Users, X } from 'lucide-react';
import { toast } from 'sonner';

export default function SuperAdmin() {
  const navigate = useNavigate();
  const [schools, setSchools] = useState<any[]>([]);
  const [members, setMembers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [schoolDialog, setSchoolDialog] = useState(false);
  const [memberDialog, setMemberDialog] = useState(false);
  const [editingSchool, setEditingSchool] = useState<any>(null);
  const [schoolForm, setSchoolForm] = useState({
    name: '', address: '', director: '', phone: '', email: '',
    authorization_number: '', academic_year: '2025-2026',
    primary_color: '#1e40af', secondary_color: '#3b82f6',
    subscription_status: 'active', subscription_end_date: ''
  });
  const [memberForm, setMemberForm] = useState({
    school_id: '', username: '', role: 'admin', full_name: '', assigned_class: ''
  });

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
      const [schoolsRes, membersRes] = await Promise.all([
        client.entities.schools.query({ query: {}, limit: 100 }),
        client.entities.school_members.query({ query: {}, limit: 200 })
      ]);
      setSchools(schoolsRes?.data?.items || []);
      setMembers(membersRes?.data?.items || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateSchool = async () => {
    if (!schoolForm.name) { toast.error('Le nom est obligatoire'); return; }
    try {
      if (editingSchool) {
        await client.entities.schools.update({ id: String(editingSchool.id), data: schoolForm });
        toast.success('École modifiée');
      } else {
        const res = await client.entities.schools.create({ data: schoolForm });
        if (res?.data && !schools.length) {
          setSchoolId(res.data.id);
        }
        toast.success('École créée avec succès');
      }
      setSchoolDialog(false);
      resetSchoolForm();
      loadData();
    } catch { toast.error('Erreur'); }
  };

  const handleCreateMember = async () => {
    if (!memberForm.school_id || !memberForm.username) { toast.error('Champs obligatoires manquants'); return; }
    try {
      await client.entities.school_members.create({
        data: { ...memberForm, school_id: parseInt(memberForm.school_id), user_id: 'pending' }
      });
      toast.success('Membre ajouté');
      setMemberDialog(false);
      setMemberForm({ school_id: '', username: '', role: 'admin', full_name: '', assigned_class: '' });
      loadData();
    } catch { toast.error('Erreur'); }
  };

  const handleEditSchool = (school: any) => {
    setEditingSchool(school);
    setSchoolForm({
      name: school.name || '', address: school.address || '', director: school.director || '',
      phone: school.phone || '', email: school.email || '',
      authorization_number: school.authorization_number || '',
      academic_year: school.academic_year || '2025-2026',
      primary_color: school.primary_color || '#1e40af',
      secondary_color: school.secondary_color || '#3b82f6',
      subscription_status: school.subscription_status || 'active',
      subscription_end_date: school.subscription_end_date || ''
    });
    setSchoolDialog(true);
  };

  const handleDeleteSchool = async (id: number) => {
    if (!confirm('Supprimer cette école ?')) return;
    try {
      await client.entities.schools.delete({ id: String(id) });
      toast.success('École supprimée');
      loadData();
    } catch { toast.error('Erreur'); }
  };

  const resetSchoolForm = () => {
    setEditingSchool(null);
    setSchoolForm({ name: '', address: '', director: '', phone: '', email: '', authorization_number: '', academic_year: '2025-2026', primary_color: '#1e40af', secondary_color: '#3b82f6', subscription_status: 'active', subscription_end_date: '' });
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Super Administration</h1>
          <p className="text-gray-500">Gestion des écoles, abonnements et personnalisation</p>
        </div>

        <Tabs defaultValue="schools">
          <TabsList>
            <TabsTrigger value="schools" className="flex items-center gap-2">
              <Building2 className="h-4 w-4" /> Écoles
            </TabsTrigger>
            <TabsTrigger value="members" className="flex items-center gap-2">
              <Users className="h-4 w-4" /> Membres
            </TabsTrigger>
          </TabsList>

          <TabsContent value="schools" className="space-y-4">
            <div className="flex justify-end">
              <Dialog open={schoolDialog} onOpenChange={(open) => { setSchoolDialog(open); if (!open) resetSchoolForm(); }}>
                <DialogTrigger asChild>
                  <Button className="bg-blue-600 hover:bg-blue-700">
                    <Plus className="h-4 w-4 mr-2" /> Nouvelle École
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>{editingSchool ? "Modifier l'École" : 'Créer une École'}</DialogTitle>
                  </DialogHeader>
                  <div className="grid grid-cols-2 gap-4 mt-4">
                    <div className="col-span-2"><Label>Nom de l'École *</Label><Input value={schoolForm.name} onChange={e => setSchoolForm({...schoolForm, name: e.target.value})} /></div>
                    <div className="col-span-2"><Label>Adresse</Label><Input value={schoolForm.address} onChange={e => setSchoolForm({...schoolForm, address: e.target.value})} /></div>
                    <div><Label>Directeur</Label><Input value={schoolForm.director} onChange={e => setSchoolForm({...schoolForm, director: e.target.value})} /></div>
                    <div><Label>Téléphone</Label><Input value={schoolForm.phone} onChange={e => setSchoolForm({...schoolForm, phone: e.target.value})} /></div>
                    <div><Label>Email</Label><Input value={schoolForm.email} onChange={e => setSchoolForm({...schoolForm, email: e.target.value})} /></div>
                    <div><Label>N° Autorisation</Label><Input value={schoolForm.authorization_number} onChange={e => setSchoolForm({...schoolForm, authorization_number: e.target.value})} /></div>
                    <div><Label>Année Scolaire</Label><Input value={schoolForm.academic_year} onChange={e => setSchoolForm({...schoolForm, academic_year: e.target.value})} /></div>
                    <div>
                      <Label>Abonnement</Label>
                      <Select value={schoolForm.subscription_status} onValueChange={v => setSchoolForm({...schoolForm, subscription_status: v})}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="active">Actif</SelectItem>
                          <SelectItem value="expired">Expiré</SelectItem>
                          <SelectItem value="trial">Essai</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div><Label>Fin Abonnement</Label><Input type="date" value={schoolForm.subscription_end_date} onChange={e => setSchoolForm({...schoolForm, subscription_end_date: e.target.value})} /></div>
                    <div className="flex items-end gap-2">
                      <div>
                        <Label>Couleur Principale</Label>
                        <Input type="color" value={schoolForm.primary_color} onChange={e => setSchoolForm({...schoolForm, primary_color: e.target.value})} className="h-10 w-16 p-1" />
                      </div>
                      <div>
                        <Label>Couleur Secondaire</Label>
                        <Input type="color" value={schoolForm.secondary_color} onChange={e => setSchoolForm({...schoolForm, secondary_color: e.target.value})} className="h-10 w-16 p-1" />
                      </div>
                    </div>
                  </div>
                  <div className="flex justify-end gap-3 mt-6">
                    <Button variant="outline" onClick={() => { setSchoolDialog(false); resetSchoolForm(); }}>Annuler</Button>
                    <Button onClick={handleCreateSchool} className="bg-blue-600 hover:bg-blue-700">
                      {editingSchool ? 'Modifier' : 'Créer'}
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>

            {loading ? (
              <div className="flex justify-center p-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              </div>
            ) : schools.length === 0 ? (
              <Card>
                <CardContent className="p-8 text-center text-gray-500">
                  <Building2 className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  <p>Aucune école créée. Commencez par créer votre première école.</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4">
                {schools.map(school => (
                  <Card key={school.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-5">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-lg flex items-center justify-center" style={{ backgroundColor: school.primary_color || '#1e40af' }}>
                            <Building2 className="h-6 w-6 text-white" />
                          </div>
                          <div>
                            <h3 className="font-bold text-lg">{school.name}</h3>
                            <p className="text-sm text-gray-500">{school.address}</p>
                            <div className="flex items-center gap-4 mt-1 text-xs text-gray-500">
                              {school.director && <span>Dir: {school.director}</span>}
                              {school.phone && <span>Tél: {school.phone}</span>}
                              <span>Année: {school.academic_year}</span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={`text-xs font-medium px-2 py-1 rounded ${
                            school.subscription_status === 'active' ? 'bg-green-100 text-green-700' :
                            school.subscription_status === 'trial' ? 'bg-amber-100 text-amber-700' :
                            'bg-red-100 text-red-700'
                          }`}>
                            {school.subscription_status === 'active' ? 'Actif' : school.subscription_status === 'trial' ? 'Essai' : 'Expiré'}
                          </span>
                          <Button variant="ghost" size="icon" onClick={() => handleEditSchool(school)}>
                            <Settings className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => handleDeleteSchool(school.id)}>
                            <X className="h-4 w-4 text-red-500" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="members" className="space-y-4">
            <div className="flex justify-end">
              <Dialog open={memberDialog} onOpenChange={setMemberDialog}>
                <DialogTrigger asChild>
                  <Button className="bg-blue-600 hover:bg-blue-700">
                    <Plus className="h-4 w-4 mr-2" /> Ajouter Membre
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Ajouter un Membre</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4 mt-4">
                    <div>
                      <Label>École</Label>
                      <Select value={memberForm.school_id} onValueChange={v => setMemberForm({...memberForm, school_id: v})}>
                        <SelectTrigger><SelectValue placeholder="Sélectionner une école" /></SelectTrigger>
                        <SelectContent>
                          {schools.map(s => <SelectItem key={s.id} value={String(s.id)}>{s.name}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                    <div><Label>Nom d'utilisateur</Label><Input value={memberForm.username} onChange={e => setMemberForm({...memberForm, username: e.target.value})} /></div>
                    <div><Label>Nom Complet</Label><Input value={memberForm.full_name} onChange={e => setMemberForm({...memberForm, full_name: e.target.value})} /></div>
                    <div>
                      <Label>Rôle</Label>
                      <Select value={memberForm.role} onValueChange={v => setMemberForm({...memberForm, role: v})}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="admin">Administrateur</SelectItem>
                          <SelectItem value="teacher">Enseignant</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    {memberForm.role === 'teacher' && (
                      <div><Label>Classe Assignée</Label><Input value={memberForm.assigned_class} onChange={e => setMemberForm({...memberForm, assigned_class: e.target.value})} placeholder="ex: CI-A" /></div>
                    )}
                    <div className="flex justify-end gap-3">
                      <Button variant="outline" onClick={() => setMemberDialog(false)}>Annuler</Button>
                      <Button onClick={handleCreateMember} className="bg-blue-600 hover:bg-blue-700">Ajouter</Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </div>

            <Card>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nom</TableHead>
                      <TableHead>Utilisateur</TableHead>
                      <TableHead>Rôle</TableHead>
                      <TableHead>École</TableHead>
                      <TableHead>Classe</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {members.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center py-8 text-gray-500">Aucun membre</TableCell>
                      </TableRow>
                    ) : (
                      members.map(m => (
                        <TableRow key={m.id}>
                          <TableCell className="font-medium">{m.full_name || '-'}</TableCell>
                          <TableCell>{m.username}</TableCell>
                          <TableCell>
                            <span className={`text-xs font-medium px-2 py-1 rounded ${m.role === 'admin' ? 'bg-blue-100 text-blue-700' : 'bg-green-100 text-green-700'}`}>
                              {m.role === 'admin' ? 'Admin' : 'Enseignant'}
                            </span>
                          </TableCell>
                          <TableCell>{schools.find(s => s.id === m.school_id)?.name || '-'}</TableCell>
                          <TableCell>{m.assigned_class || '-'}</TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
}
