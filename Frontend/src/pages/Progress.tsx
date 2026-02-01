import { useState } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Progress as ProgressBar } from "@/components/ui/progress";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { useProgressRecords, useCreateProgress, useUpdateProgress, useDeleteProgress } from "@/hooks/useProgress";
import { useStudents } from "@/hooks/useStudents";
import { useTeachers } from "@/hooks/useTeachers";
import { useAuthStore } from "@/lib/auth-store";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Search,
  BookOpen,
  TrendingUp,
  Calendar,
  User,
  Check,
  Star,
  ChevronRight,
  Plus,
  Edit,
  Trash2,
  Eye,
  Award,
  Clock,
} from "lucide-react";
import { cn } from "@/lib/utils";


const courseStructure = {
  Qaida: ["Letters Recognition", "Letter Forms", "Connecting Letters", "Short Vowels", "Long Vowels", "Sukoon", "Tanween", "Shadda", "Complete Qaida"],
  Nazra: Array.from({ length: 30 }, (_, i) => `Para ${i + 1}`),
  Hifz: ["Juz 30", "Juz 29", "Juz 28", "Selected Surahs", "Full Quran"],
  Tajweed: ["Makharij", "Sifaat", "Noon Sakin", "Meem Sakin", "Idgham", "Ikhfa", "Qalqalah", "Madd Rules", "Advanced Rules"],
};

export default function Progress() {
  const { currentUser } = useAuthStore();
  const { data: progressRecords = [], isLoading } = useProgressRecords();
  const { data: students = [] } = useStudents();
  const { data: teachers = [] } = useTeachers();
  const createProgress = useCreateProgress();
  const updateProgress = useUpdateProgress();
  const deleteProgress = useDeleteProgress();
  
  const [searchQuery, setSearchQuery] = useState("");
  const [courseFilter, setCourseFilter] = useState("all");
  const [teacherFilter, setTeacherFilter] = useState("all");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<any>(null);
  const [deletingRecord, setDeletingRecord] = useState<any>(null);
  const [formData, setFormData] = useState({
    studentId: '',
    studentName: '',
    lesson: '',
    sabqi: '',
    manzil: '',
    notes: '',
    completion: 50,
  });

  const handleOpenDialog = (record?: any) => {
    if (record) {
      setEditingRecord(record);
      setFormData({
        studentId: record.studentId || '',
        studentName: record.studentName || '',
        lesson: record.lesson || '',
        sabqi: record.sabqi || '',
        manzil: record.manzil || '',
        notes: record.notes || '',
        completion: record.completion || 50,
      });
    } else {
      setEditingRecord(null);
      setFormData({
        studentId: '',
        studentName: '',
        lesson: '',
        sabqi: '',
        manzil: '',
        notes: '',
        completion: 50,
      });
    }
    setIsDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Get teacher info from selected student or current user
    const selectedStudent = students.find(s => (s as any)._id === formData.studentId || s.id === formData.studentId);
    const teacherId = currentUser?.role === 'teacher' 
      ? (currentUser.id || (currentUser as any)._id || (currentUser as any).teacherId)
      : (selectedStudent?.teacherId || (selectedStudent as any)?.teacherId);
    const teacherName = currentUser?.role === 'teacher'
      ? currentUser.name
      : (selectedStudent?.teacher || (selectedStudent as any)?.teacher);
    
    const progressData = {
      studentId: formData.studentId,
      studentName: formData.studentName,
      teacherId: teacherId,
      teacherName: teacherName,
      lesson: formData.lesson,
      sabqi: formData.sabqi,
      manzil: formData.manzil,
      notes: formData.notes,
      completion: formData.completion,
    };

    try {
      if (editingRecord) {
        await updateProgress.mutateAsync({ id: editingRecord._id || editingRecord.id, data: progressData });
      } else {
        await createProgress.mutateAsync(progressData as any);
      }
      setIsDialogOpen(false);
      setEditingRecord(null);
    } catch (error) {
      console.error('Error saving progress:', error);
    }
  };

  const handleDelete = async () => {
    if (deletingRecord) {
      try {
        await deleteProgress.mutateAsync(deletingRecord._id || deletingRecord.id);
        setIsDeleteOpen(false);
        setDeletingRecord(null);
      } catch (error) {
        console.error('Error deleting progress:', error);
      }
    }
  };

  const handleStudentChange = (studentId: string) => {
    const student = students.find(s => (s as any)._id === studentId || s.id === studentId);
    if (student) {
      setFormData({ ...formData, studentId, studentName: student.name });
    }
  };

  // Filter progress records based on role
  const filteredProgress = progressRecords.filter(record => {
    // If student, only show their own records
    if (currentUser?.role === 'student') {
      const studentId = currentUser.id || (currentUser as any)._id || (currentUser as any).studentId;
      const recordStudentId = typeof record.studentId === 'object' && record.studentId !== null
        ? (record.studentId as any)._id || (record.studentId as any).id
        : record.studentId;
      
      const matchesStudent = recordStudentId === studentId || record.studentName === currentUser.name;
      if (!matchesStudent) return false;
    }
    
    // Teachers and admins see all progress records
    // (Teacher-specific filtering removed to avoid assignment mismatches)
    // Only students have filtering applied
    
    const studentName = record.studentName || 'Unknown Student';
    const matchesSearch = studentName.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCourse = courseFilter === 'all' || courseFilter === '';
    const matchesTeacherFilter = teacherFilter === 'all' || teacherFilter === '';
    
    return matchesSearch && matchesCourse && matchesTeacherFilter;
  });

  const canManageProgress = currentUser?.role === 'teacher';
  const canViewProgress = currentUser?.role === 'admin' || currentUser?.role === 'team_leader' || currentUser?.role === 'sales_team' || currentUser?.role === 'teacher' || currentUser?.role === 'student';

  if (isLoading) {
    return (
      <MainLayout title="Progress Tracking" subtitle="Monitor student learning journey">
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading progress records...</p>
          </div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout title="Progress Tracking" subtitle="Monitor student learning journey and syllabus completion">
      {/* Header with Add Button */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex-1">
          <div className="text-sm text-muted-foreground">
            {currentUser?.role === 'student' && (
              <span>📖 Your Learning Progress</span>
            )}
            {currentUser?.role === 'teacher' && (
              <span>👨‍🏫 Manage Your Students' Progress</span>
            )}
            {(currentUser?.role === 'admin' || currentUser?.role === 'team_leader') && (
              <span>📊 All Students Progress Overview</span>
            )}
          </div>
        </div>
        {canManageProgress && (
          <Button onClick={() => handleOpenDialog()} className="gap-2">
            <Plus className="h-4 w-4" />
            Update Student Progress
          </Button>
        )}
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="Search students..." 
            className="pl-9" 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <Select>
          <SelectTrigger className="w-full md:w-[150px]">
            <SelectValue placeholder="Course" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Courses</SelectItem>
            <SelectItem value="qaida">Qaida</SelectItem>
            <SelectItem value="nazra">Nazra</SelectItem>
            <SelectItem value="hifz">Hifz</SelectItem>
            <SelectItem value="tajweed">Tajweed</SelectItem>
          </SelectContent>
        </Select>
        <Select value={teacherFilter} onValueChange={setTeacherFilter}>
          <SelectTrigger className="w-full md:w-[150px]">
            <SelectValue placeholder="Teacher" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Teachers</SelectItem>
            {teachers.map((teacher) => {
              const teacherId = (teacher as any)._id || teacher.id;
              return (
                <SelectItem key={teacherId} value={teacher.name}>{teacher.name}</SelectItem>
              );
            })}
          </SelectContent>
        </Select>
      </div>

      {/* Progress Cards */}
      <div className="space-y-4">
        {filteredProgress.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <BookOpen className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
              <p className="text-muted-foreground">No progress records found</p>
              <p className="text-sm text-muted-foreground mt-1">Start tracking student progress</p>
            </CardContent>
          </Card>
        ) : (
          filteredProgress.map((record, index) => {
            const studentName = record.studentName || (record.studentId as any)?.name || 'Unknown Student';
            const teacherName = record.teacherName || (record.teacherId as any)?.name || 'Unknown Teacher';
            const lesson = record.lesson || 'N/A';
            const sabqi = record.sabqi || 'N/A';
            const manzil = record.manzil || 'N/A';
            const completion = record.completion || 0;
            const notes = record.notes || '';
            const lastUpdated = record.updatedAt ? new Date(record.updatedAt).toLocaleDateString() : 'N/A';
            
            return (
              <Card key={(record as any)._id || index} variant="interactive" className={cn("animate-slide-up", `stagger-${index + 1}`)}>
                <CardContent className="p-6">
                  <div className="flex flex-col lg:flex-row gap-6">
                    {/* Left - Student Info */}
                    <div className="lg:w-1/4 space-y-4">
                      <div className="flex items-center gap-3">
                        <div className="h-12 w-12 rounded-full gradient-primary flex items-center justify-center text-primary-foreground font-bold">
                          {studentName.split(" ").map(n => n[0]).slice(0, 2).join("")}
                        </div>
                        <div>
                          <h3 className="font-semibold">{studentName}</h3>
                          <p className="text-sm text-muted-foreground">{teacherName}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <Badge variant="outline">{lesson}</Badge>
                      </div>

                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">Completion</span>
                          <span className="font-medium">{completion}%</span>
                        </div>
                        <ProgressBar value={completion} className="h-3" />
                      </div>
                    </div>

                    {/* Center - Progress Details */}
                    <div className="lg:w-1/2 space-y-4 border-l border-r px-6">
                      <h4 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">Progress Details</h4>
                      
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-xs text-muted-foreground mb-1">Current Lesson</p>
                          <p className="text-sm font-medium">{lesson}</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground mb-1">Sabqi</p>
                          <p className="text-sm font-medium">{sabqi}</p>
                        </div>
                        <div className="col-span-2">
                          <p className="text-xs text-muted-foreground mb-1">Manzil</p>
                          <p className="text-sm font-medium">{manzil}</p>
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <p className="text-xs text-muted-foreground">Teacher's Notes</p>
                        <p className="text-sm bg-muted/50 p-3 rounded-lg">{notes || 'No notes available'}</p>
                      </div>
                    </div>

                {/* Right - Actions */}
                <div className="lg:w-1/4 space-y-4">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Calendar className="h-4 w-4" />
                    <span>Last updated: {lastUpdated}</span>
                  </div>

                  <div className="space-y-2">
                    {canManageProgress && (
                      <>
                        <Button 
                          className="w-full gap-2"
                          onClick={() => handleOpenDialog(record)}
                        >
                          <Edit className="h-4 w-4" />
                          Update Progress
                        </Button>
                        <Button 
                          variant="destructive" 
                          className="w-full gap-2"
                          onClick={() => {
                            setDeletingRecord(record);
                            setIsDeleteOpen(true);
                          }}
                        >
                          <Trash2 className="h-4 w-4" />
                          Delete
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
            );
          })
        )}
      </div>

      {/* Course Structure Overview */}
      <Card className="mt-6 animate-slide-up">
        <CardHeader>
          <CardTitle>Course Structure</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {Object.entries(courseStructure).map(([course, lessons]) => (
              <div key={course} className="space-y-3">
                <h4 className="font-semibold flex items-center gap-2">
                  <BookOpen className="h-4 w-4 text-primary" />
                  {course}
                </h4>
                <div className="space-y-1">
                  {lessons.slice(0, 5).map((lesson, index) => (
                    <div key={index} className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Check className="h-3 w-3" />
                      <span>{lesson}</span>
                    </div>
                  ))}
                  {lessons.length > 5 && (
                    <Button variant="link" size="sm" className="p-0 h-auto text-primary">
                      +{lessons.length - 5} more <ChevronRight className="h-3 w-3" />
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Add/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingRecord ? 'Update Student Progress' : 'Update Student Progress'}</DialogTitle>
            <DialogDescription>
              Track student's syllabus completion. The completion percentage will update the student's overall progress bar in the dashboard.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label>Student *</Label>
              <Select value={formData.studentId} onValueChange={handleStudentChange} disabled={!!editingRecord}>
                <SelectTrigger>
                  <SelectValue placeholder="Select Student" />
                </SelectTrigger>
                <SelectContent>
                  {students
                    .filter(student => {
                      // If teacher, only show their assigned students
                      if (currentUser?.role === 'teacher') {
                        const teacherId = currentUser.id || (currentUser as any)._id || (currentUser as any).teacherId;
                        const studentTeacherId = student.teacherId || (student as any).teacherId;
                        return studentTeacherId === teacherId || student.teacher === currentUser.name;
                      }
                      return true;
                    })
                    .map((student) => {
                      const studentId = (student as any)._id || student.id;
                      return (
                        <SelectItem key={studentId} value={studentId}>{student.name}</SelectItem>
                      );
                    })}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="lesson">Today's Lesson *</Label>
              <Input 
                id="lesson" 
                value={formData.lesson} 
                onChange={(e) => setFormData({ ...formData, lesson: e.target.value })} 
                placeholder="e.g., Surah Al-Baqarah (Ayah 1-5)"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="sabqi">Sabqi Status *</Label>
                <Select value={formData.sabqi} onValueChange={(value) => setFormData({ ...formData, sabqi: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Completed">Completed</SelectItem>
                    <SelectItem value="In Progress">In Progress</SelectItem>
                    <SelectItem value="Needs Review">Needs Review</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="manzil">Manzil *</Label>
                <Input 
                  id="manzil" 
                  value={formData.manzil} 
                  onChange={(e) => setFormData({ ...formData, manzil: e.target.value })} 
                  placeholder="e.g., Juz 1"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Completion: {formData.completion}%</Label>
              <Slider 
                value={[formData.completion]} 
                onValueChange={(value) => setFormData({ ...formData, completion: value[0] })} 
                max={100} 
                step={5} 
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>0%</span>
                <span>50%</span>
                <span>100%</span>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea 
                id="notes" 
                value={formData.notes} 
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })} 
                placeholder="Add notes about student's progress, strengths, areas for improvement..."
                rows={4}
              />
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
              <Button type="submit">Update Progress</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Progress Record?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this progress record and reset the student's progress bar. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </MainLayout>
  );
}
