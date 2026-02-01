import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { MainLayout } from "@/components/layout/MainLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Search, Star, Users, Clock, Calendar, Phone, MessageSquare, Award, CheckCircle, Pencil, Trash2 } from "lucide-react";
import { Teacher } from "@/lib/store";
import { useTeachers, useUpdateTeacher, useDeleteTeacher } from "@/hooks/useTeachers";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const statusConfig = {
  available: { label: "Available", variant: "success" as const, dot: "bg-success" },
  in_class: { label: "In Class", variant: "info" as const, dot: "bg-info animate-pulse" },
  on_leave: { label: "On Leave", variant: "muted" as const, dot: "bg-muted-foreground" },
};

const emptyTeacher: Omit<Teacher, "id"> = {
  name: "", title: "", phone: "", email: "", specialization: ["Qaida"], students: 0, rating: 4.5, classesToday: 0, classesCompleted: 0, status: "available", joinedAt: new Date().toISOString().split('T')[0], performance: 80,
};

export default function Teachers() {
  const navigate = useNavigate();
  const { data: teachers = [], isLoading } = useTeachers();
  const updateTeacherMutation = useUpdateTeacher();
  const deleteTeacherMutation = useDeleteTeacher();
  const [searchQuery, setSearchQuery] = useState("");
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [current, setCurrent] = useState<Teacher | null>(null);
  const [formData, setFormData] = useState(emptyTeacher);

  const filtered = teachers.filter((t) => t.name.toLowerCase().includes(searchQuery.toLowerCase()));

  if (isLoading) {
    return (
      <MainLayout title="Teachers" subtitle="Manage your teaching staff">
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading teachers...</p>
          </div>
        </div>
      </MainLayout>
    );
  }

  const handleEdit = () => { 
    if (current) { 
      const teacherId = (current as any)._id || current.id;
      updateTeacherMutation.mutate({ id: teacherId, data: formData }, {
        onSuccess: () => {
          setIsEditOpen(false);
          setCurrent(null);
        }
      });
    } 
  };
  const handleDelete = () => { 
    if (current) { 
      const teacherId = (current as any)._id || current.id;
      deleteTeacherMutation.mutate(teacherId, {
        onSuccess: () => {
          setIsDeleteOpen(false);
          setCurrent(null);
        }
      });
    } 
  };

  const handleOpenChat = (teacher: Teacher) => {
    const teacherId = (teacher as any)._id || teacher.id;
    navigate(`/messages?userId=${teacherId}&userName=${encodeURIComponent(teacher.name)}&userRole=teacher`);
  };

  return (
    <MainLayout title="Teachers" subtitle="Manage your teaching staff">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <Card variant="stat"><CardContent className="p-4"><div className="flex items-center justify-between"><div><p className="text-sm text-muted-foreground">Total Teachers</p><p className="text-2xl font-bold">{teachers.length}</p></div><div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center"><Users className="h-5 w-5 text-primary" /></div></div></CardContent></Card>
        <Card variant="stat"><CardContent className="p-4"><div className="flex items-center justify-between"><div><p className="text-sm text-muted-foreground">Available</p><p className="text-2xl font-bold text-success">{teachers.filter(t => t.status === "available").length}</p></div><div className="h-10 w-10 rounded-lg bg-success/10 flex items-center justify-center"><CheckCircle className="h-5 w-5 text-success" /></div></div></CardContent></Card>
        <Card variant="stat"><CardContent className="p-4"><div className="flex items-center justify-between"><div><p className="text-sm text-muted-foreground">In Class</p><p className="text-2xl font-bold text-info">{teachers.filter(t => t.status === "in_class").length}</p></div><div className="h-10 w-10 rounded-lg bg-info/10 flex items-center justify-center"><Clock className="h-5 w-5 text-info" /></div></div></CardContent></Card>
        <Card variant="stat"><CardContent className="p-4"><div className="flex items-center justify-between"><div><p className="text-sm text-muted-foreground">On Leave</p><p className="text-2xl font-bold text-warning">{teachers.filter(t => t.status === "on_leave").length}</p></div><div className="h-10 w-10 rounded-lg bg-warning/10 flex items-center justify-center"><Calendar className="h-5 w-5 text-warning" /></div></div></CardContent></Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Teachers</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 mb-6"><div className="relative flex-1"><Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" /><Input placeholder="Search teachers..." className="pl-9" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} /></div></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map((teacher) => (
              <Card key={teacher._id || teacher.id} variant="interactive" className="overflow-hidden">
                <CardContent className="p-0">
                  <div className="p-4 border-b bg-muted/30">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className="relative"><div className="h-12 w-12 rounded-full gradient-primary flex items-center justify-center text-primary-foreground font-bold">{teacher.name.split(" ").slice(1).map(n => n[0]).join("")}</div><span className={cn("absolute -bottom-0.5 -right-0.5 h-3.5 w-3.5 rounded-full border-2 border-card", statusConfig[teacher.status].dot)} /></div>
                        <div><h3 className="font-semibold">{teacher.name}</h3><p className="text-sm text-muted-foreground">{teacher.title}</p></div>
                      </div>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => { setCurrent(teacher); setFormData(teacher); setIsEditOpen(true); }}><Pencil className="h-4 w-4" /></Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => { setCurrent(teacher); setIsDeleteOpen(true); }}><Trash2 className="h-4 w-4" /></Button>
                      </div>
                    </div>
                  </div>
                  <div className="p-4 space-y-4">
                    <div className="flex flex-wrap gap-2">{teacher.specialization.map((spec) => (<Badge key={spec} variant="outline" className="text-xs">{spec}</Badge>))}</div>
                    <div className="grid grid-cols-3 gap-3 text-center">
                      <div className="p-2 rounded-lg bg-muted/50"><p className="text-lg font-bold">{teacher.students}</p><p className="text-xs text-muted-foreground">Students</p></div>
                      <div className="p-2 rounded-lg bg-muted/50"><div className="flex items-center justify-center gap-1"><Star className="h-4 w-4 text-accent fill-accent" /><span className="text-lg font-bold">{teacher.rating}</span></div><p className="text-xs text-muted-foreground">Rating</p></div>
                      <div className="p-2 rounded-lg bg-muted/50"><p className="text-lg font-bold">{teacher.classesCompleted}/{teacher.classesToday}</p><p className="text-xs text-muted-foreground">Today</p></div>
                    </div>
                    <div className="space-y-1"><div className="flex items-center justify-between text-sm"><span className="text-muted-foreground flex items-center gap-1"><Award className="h-4 w-4" />Performance</span><span className="font-medium">{teacher.performance}%</span></div><Progress value={teacher.performance} className="h-2" /></div>
                    <div className="flex items-center gap-2 pt-2 border-t"><Badge variant={statusConfig[teacher.status].variant}>{statusConfig[teacher.status].label}</Badge><div className="flex-1" /><Button variant="ghost" size="icon" className="h-8 w-8"><Phone className="h-4 w-4" /></Button><Button variant="ghost" size="icon" className="h-8 w-8 text-success" onClick={() => handleOpenChat(teacher)}><MessageSquare className="h-4 w-4" /></Button></div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>

      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto"><DialogHeader><DialogTitle>Edit Teacher</DialogTitle></DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4"><div className="space-y-2"><Label>Name</Label><Input value={formData.name} onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))} /></div><div className="space-y-2"><Label>Title</Label><Input value={formData.title} onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))} /></div></div>
            <div className="grid grid-cols-2 gap-4"><div className="space-y-2"><Label>Performance</Label><Input type="number" value={formData.performance} onChange={(e) => setFormData(prev => ({ ...prev, performance: parseInt(e.target.value) }))} /></div><div className="space-y-2"><Label>Rating</Label><Input type="number" step="0.1" value={formData.rating} onChange={(e) => setFormData(prev => ({ ...prev, rating: parseFloat(e.target.value) }))} /></div></div>
          </div>
          <DialogFooter><Button onClick={handleEdit}>Save Changes</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <AlertDialogContent><AlertDialogHeader><AlertDialogTitle>Delete Teacher</AlertDialogTitle><AlertDialogDescription>Are you sure you want to delete {current?.name}?</AlertDialogDescription></AlertDialogHeader>
          <AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">Delete</AlertDialogAction></AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </MainLayout>
  );
}
