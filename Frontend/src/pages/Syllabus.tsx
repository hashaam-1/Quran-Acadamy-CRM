import { useState } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Progress } from "@/components/ui/progress";
import { BookOpen, Plus, Edit, Trash2, ChevronRight, CheckCircle2, Lock, PlayCircle } from "lucide-react";
import { useSyllabi, useCreateSyllabus, useUpdateSyllabus, useDeleteSyllabus } from "@/hooks/useSyllabus";
import { useAuthStore } from "@/lib/auth-store";
import { cn } from "@/lib/utils";

interface SyllabusFormData {
  title: string;
  course: string;
  level: string;
  description: string;
  duration: string;
  objectives: string;
  prerequisites: string;
  materials: string;
  assessmentCriteria: string;
  status: string;
}

interface FileWithPreview {
  file: File;
  name: string;
}

export default function Syllabus() {
  const { currentUser } = useAuthStore();
  const [selectedTab, setSelectedTab] = useState("qaida");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [editingSyllabus, setEditingSyllabus] = useState<any>(null);
  const [currentSyllabus, setCurrentSyllabus] = useState<any>(null);
  
  const { data: syllabi = [], isLoading } = useSyllabi();
  const createSyllabus = useCreateSyllabus();
  const updateSyllabus = useUpdateSyllabus();
  const deleteSyllabus = useDeleteSyllabus();
  
  // Check if user can add/edit syllabus
  const canManageSyllabus = currentUser?.role === 'admin' || currentUser?.role === 'team_leader' || currentUser?.role === 'teacher';
  
  const [formData, setFormData] = useState<SyllabusFormData>({
    title: '',
    course: 'Qaida',
    level: 'Beginner',
    description: '',
    duration: '',
    objectives: '',
    prerequisites: '',
    materials: '',
    assessmentCriteria: '',
    status: 'active'
  });
  
  const [selectedFiles, setSelectedFiles] = useState<FileWithPreview[]>([]);
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Get user ID - handles both id and _id from different login sources
    const userId = currentUser?.id || (currentUser as any)?._id || (currentUser as any)?.userId;
    
    if (!userId) {
      console.error('No user ID found');
      return;
    }
    
    // Create FormData for file upload
    const formDataToSend = new FormData();
    formDataToSend.append('title', formData.title);
    formDataToSend.append('course', formData.course);
    formDataToSend.append('level', formData.level);
    formDataToSend.append('description', formData.description);
    formDataToSend.append('duration', formData.duration);
    formDataToSend.append('status', formData.status);
    formDataToSend.append('createdBy', userId);
    formDataToSend.append('createdByName', currentUser?.name || '');
    
    // Add arrays
    const objectives = formData.objectives.split('\n').filter(o => o.trim());
    const prerequisites = formData.prerequisites.split('\n').filter(p => p.trim());
    const materials = formData.materials.split('\n').filter(m => m.trim());
    const assessmentCriteria = formData.assessmentCriteria.split('\n').filter(a => a.trim());
    
    formDataToSend.append('objectives', JSON.stringify(objectives));
    formDataToSend.append('prerequisites', JSON.stringify(prerequisites));
    formDataToSend.append('materials', JSON.stringify(materials));
    formDataToSend.append('assessmentCriteria', JSON.stringify(assessmentCriteria));
    formDataToSend.append('topics', JSON.stringify([]));
    
    // Add files
    selectedFiles.forEach((fileItem) => {
      formDataToSend.append('attachments', fileItem.file);
    });
    
    try {
      if (editingSyllabus) {
        await updateSyllabus.mutateAsync({ id: editingSyllabus.id, data: formDataToSend });
      } else {
        await createSyllabus.mutateAsync(formDataToSend);
      }
      setIsDialogOpen(false);
      setEditingSyllabus(null);
      setSelectedFiles([]);
      setFormData({
        title: '',
        course: 'Qaida',
        level: 'Beginner',
        description: '',
        duration: '',
        objectives: '',
        prerequisites: '',
        materials: '',
        assessmentCriteria: '',
        status: 'active'
      });
    } catch (error) {
      console.error('Error saving syllabus:', error);
    }
  };
  
  const handleEdit = (syllabus: any) => {
    setEditingSyllabus(syllabus);
    setFormData({
      title: syllabus.title,
      course: syllabus.course,
      level: syllabus.level,
      description: syllabus.description,
      duration: syllabus.duration,
      objectives: syllabus.objectives?.join('\n') || '',
      prerequisites: syllabus.prerequisites?.join('\n') || '',
      materials: syllabus.materials?.join('\n') || '',
      assessmentCriteria: syllabus.assessmentCriteria?.join('\n') || '',
      status: syllabus.status
    });
    setIsDialogOpen(true);
  };
  
  const handleDelete = async () => {
    if (currentSyllabus) {
      await deleteSyllabus.mutateAsync(currentSyllabus.id || currentSyllabus._id);
      setIsDeleteOpen(false);
      setCurrentSyllabus(null);
    }
  };
  
  // Group syllabi by course
  const qaidaSyllabi = syllabi.filter(s => s.course === 'Qaida' && s.status === 'active');
  const nazraSyllabi = syllabi.filter(s => s.course === 'Nazra' && s.status === 'active');
  const hifzSyllabi = syllabi.filter(s => s.course === 'Hifz' && s.status === 'active');
  const tajweedSyllabi = syllabi.filter(s => s.course === 'Tajweed' && s.status === 'active');
  
  const statusConfig = {
    completed: { icon: CheckCircle2, color: "bg-success/10 text-success" },
    current: { icon: PlayCircle, color: "bg-accent/10 text-accent" },
    locked: { icon: Lock, color: "bg-muted text-muted-foreground" },
  };

  return (
    <MainLayout title="Curriculum & Syllabus" subtitle="View course curriculum and manage syllabi">
      <div className="flex justify-end mb-6">
        {canManageSyllabus && (
          <Button className="gap-2" onClick={() => { setEditingSyllabus(null); setFormData({ title: '', course: 'Qaida', level: 'Beginner', description: '', duration: '', objectives: '', prerequisites: '', materials: '', assessmentCriteria: '', status: 'active' }); setIsDialogOpen(true); }}>
            <Plus className="h-4 w-4" />
            Add Syllabus
          </Button>
        )}
      </div>

      <Tabs value={selectedTab} onValueChange={setSelectedTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="qaida">Qaida</TabsTrigger>
          <TabsTrigger value="nazra">Nazra</TabsTrigger>
          <TabsTrigger value="hifz">Hifz</TabsTrigger>
          <TabsTrigger value="tajweed">Tajweed</TabsTrigger>
        </TabsList>

        {/* Qaida Tab */}
        <TabsContent value="qaida">
          {qaidaSyllabi.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <BookOpen className="h-16 w-16 text-muted-foreground/50 mx-auto mb-4" />
                <p className="text-lg font-medium mb-2">No Qaida Syllabus Available</p>
                <p className="text-sm text-muted-foreground mb-4">
                  {canManageSyllabus ? 'Add a syllabus to get started' : 'Syllabus will be available soon'}
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {qaidaSyllabi.map((syllabus) => (
                <>
                  <Card className="lg:col-span-1" key={`${syllabus._id || syllabus.id}-overview`}>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <BookOpen className="h-5 w-5 text-primary" />
                        {syllabus.title}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <p className="text-sm text-muted-foreground">{syllabus.description}</p>
                      
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Duration</span>
                          <span className="font-medium">{syllabus.duration}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Level</span>
                          <Badge variant="secondary">{syllabus.level}</Badge>
                        </div>
                      </div>

                      {syllabus.objectives && syllabus.objectives.length > 0 && (
                        <div className="pt-2">
                          <p className="text-sm font-medium mb-2">Learning Objectives:</p>
                          <ul className="text-sm text-muted-foreground space-y-1">
                            {syllabus.objectives.slice(0, 3).map((obj: string, i: number) => (
                              <li key={i} className="flex items-start gap-2">
                                <CheckCircle2 className="h-4 w-4 text-success mt-0.5 flex-shrink-0" />
                                <span>{obj}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {canManageSyllabus && (
                        <div className="flex gap-2 pt-2">
                          <Button variant="outline" size="sm" className="flex-1" onClick={() => handleEdit(syllabus)}>
                            <Edit className="h-4 w-4 mr-2" />
                            Edit
                          </Button>
                          {(currentUser?.role === 'admin' || currentUser?.role === 'team_leader') && (
                            <Button variant="outline" size="sm" onClick={() => { setCurrentSyllabus(syllabus); setIsDeleteOpen(true); }}>
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  <Card className="lg:col-span-2" key={`${syllabus._id || syllabus.id}-curriculum`}>
                    <CardHeader>
                      <CardTitle>Curriculum</CardTitle>
                    </CardHeader>
                    <CardContent>
                      {syllabus.topics && syllabus.topics.length > 0 ? (
                        <Accordion type="multiple" className="space-y-3">
                          {syllabus.topics.map((topic: any, index: number) => (
                            <AccordionItem key={index} value={`topic-${index}`} className="border rounded-lg px-4">
                              <AccordionTrigger className="hover:no-underline py-4">
                                <div className="flex items-center gap-4 flex-1">
                                  <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                                    {index + 1}
                                  </div>
                                  <div className="flex-1 text-left">
                                    <p className="font-semibold">{topic.title}</p>
                                    <p className="text-sm text-muted-foreground">{topic.duration || 'Duration not specified'}</p>
                                  </div>
                                </div>
                              </AccordionTrigger>
                              <AccordionContent className="pb-4">
                                <div className="ml-14">
                                  <p className="text-sm text-muted-foreground">{topic.description}</p>
                                </div>
                              </AccordionContent>
                            </AccordionItem>
                          ))}
                        </Accordion>
                      ) : (
                        <div className="text-center py-8">
                          <p className="text-sm text-muted-foreground">No curriculum topics added yet</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Nazra Tab */}
        <TabsContent value="nazra">
          {nazraSyllabi.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <BookOpen className="h-16 w-16 text-muted-foreground/50 mx-auto mb-4" />
                <p className="text-lg font-medium mb-2">No Nazra Syllabus Available</p>
                <p className="text-sm text-muted-foreground mb-4">
                  {canManageSyllabus ? 'Add a syllabus to get started' : 'Syllabus will be available soon'}
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {nazraSyllabi.map((syllabus) => (
                <>
                  <Card className="lg:col-span-1" key={`${syllabus._id || syllabus.id}-overview`}>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <BookOpen className="h-5 w-5 text-success" />
                        {syllabus.title}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <p className="text-sm text-muted-foreground">{syllabus.description}</p>
                      
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Duration</span>
                          <span className="font-medium">{syllabus.duration}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Level</span>
                          <Badge variant="secondary">{syllabus.level}</Badge>
                        </div>
                      </div>

                      {syllabus.objectives && syllabus.objectives.length > 0 && (
                        <div className="pt-2">
                          <p className="text-sm font-medium mb-2">Learning Objectives:</p>
                          <ul className="text-sm text-muted-foreground space-y-1">
                            {syllabus.objectives.slice(0, 3).map((obj: string, i: number) => (
                              <li key={i} className="flex items-start gap-2">
                                <CheckCircle2 className="h-4 w-4 text-success mt-0.5 flex-shrink-0" />
                                <span>{obj}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {canManageSyllabus && (
                        <div className="flex gap-2 pt-2">
                          <Button variant="outline" size="sm" className="flex-1" onClick={() => handleEdit(syllabus)}>
                            <Edit className="h-4 w-4 mr-2" />
                            Edit
                          </Button>
                          {(currentUser?.role === 'admin' || currentUser?.role === 'team_leader') && (
                            <Button variant="outline" size="sm" onClick={() => { setCurrentSyllabus(syllabus); setIsDeleteOpen(true); }}>
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  <Card className="lg:col-span-2" key={`${syllabus._id || syllabus.id}-curriculum`}>
                    <CardHeader>
                      <CardTitle>Curriculum - Para by Para</CardTitle>
                    </CardHeader>
                    <CardContent>
                      {syllabus.topics && syllabus.topics.length > 0 ? (
                        <Accordion type="multiple" className="space-y-3">
                          {syllabus.topics.map((topic: any, index: number) => (
                            <AccordionItem key={index} value={`topic-${index}`} className="border rounded-lg px-4">
                              <AccordionTrigger className="hover:no-underline py-4">
                                <div className="flex items-center gap-4 flex-1">
                                  <div className="h-10 w-10 rounded-full bg-success/10 flex items-center justify-center text-success font-bold">
                                    {index + 1}
                                  </div>
                                  <div className="flex-1 text-left">
                                    <p className="font-semibold">{topic.title}</p>
                                    <p className="text-sm text-muted-foreground">{topic.duration || 'Duration not specified'}</p>
                                  </div>
                                </div>
                              </AccordionTrigger>
                              <AccordionContent className="pb-4">
                                <div className="ml-14">
                                  <p className="text-sm text-muted-foreground">{topic.description}</p>
                                </div>
                              </AccordionContent>
                            </AccordionItem>
                          ))}
                        </Accordion>
                      ) : (
                        <div className="text-center py-8">
                          <p className="text-sm text-muted-foreground">No curriculum topics added yet</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Hifz Tab */}
        <TabsContent value="hifz">
          {hifzSyllabi.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <BookOpen className="h-16 w-16 text-muted-foreground/50 mx-auto mb-4" />
                <p className="text-lg font-medium mb-2">No Hifz Syllabus Available</p>
                <p className="text-sm text-muted-foreground mb-4">
                  {canManageSyllabus ? 'Add a syllabus to get started' : 'Syllabus will be available soon'}
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {hifzSyllabi.map((syllabus) => (
                <>
                  <Card className="lg:col-span-1" key={`${syllabus._id || syllabus.id}-overview`}>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <BookOpen className="h-5 w-5 text-accent" />
                        {syllabus.title}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <p className="text-sm text-muted-foreground">{syllabus.description}</p>
                      
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Duration</span>
                          <span className="font-medium">{syllabus.duration}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Level</span>
                          <Badge variant="secondary">{syllabus.level}</Badge>
                        </div>
                      </div>

                      {syllabus.objectives && syllabus.objectives.length > 0 && (
                        <div className="pt-2">
                          <p className="text-sm font-medium mb-2">Learning Objectives:</p>
                          <ul className="text-sm text-muted-foreground space-y-1">
                            {syllabus.objectives.slice(0, 3).map((obj: string, i: number) => (
                              <li key={i} className="flex items-start gap-2">
                                <CheckCircle2 className="h-4 w-4 text-success mt-0.5 flex-shrink-0" />
                                <span>{obj}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {canManageSyllabus && (
                        <div className="flex gap-2 pt-2">
                          <Button variant="outline" size="sm" className="flex-1" onClick={() => handleEdit(syllabus)}>
                            <Edit className="h-4 w-4 mr-2" />
                            Edit
                          </Button>
                          {(currentUser?.role === 'admin' || currentUser?.role === 'team_leader') && (
                            <Button variant="outline" size="sm" onClick={() => { setCurrentSyllabus(syllabus); setIsDeleteOpen(true); }}>
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  <Card className="lg:col-span-2" key={`${syllabus._id || syllabus.id}-curriculum`}>
                    <CardHeader>
                      <CardTitle>Memorization Journey</CardTitle>
                    </CardHeader>
                    <CardContent>
                      {syllabus.topics && syllabus.topics.length > 0 ? (
                        <Accordion type="multiple" className="space-y-3">
                          {syllabus.topics.map((topic: any, index: number) => (
                            <AccordionItem key={index} value={`topic-${index}`} className="border rounded-lg px-4">
                              <AccordionTrigger className="hover:no-underline py-4">
                                <div className="flex items-center gap-4 flex-1">
                                  <div className="h-10 w-10 rounded-full bg-accent/10 flex items-center justify-center text-accent font-bold">
                                    {index + 1}
                                  </div>
                                  <div className="flex-1 text-left">
                                    <p className="font-semibold">{topic.title}</p>
                                    <p className="text-sm text-muted-foreground">{topic.duration || 'Duration not specified'}</p>
                                  </div>
                                </div>
                              </AccordionTrigger>
                              <AccordionContent className="pb-4">
                                <div className="ml-14">
                                  <p className="text-sm text-muted-foreground">{topic.description}</p>
                                </div>
                              </AccordionContent>
                            </AccordionItem>
                          ))}
                        </Accordion>
                      ) : (
                        <div className="text-center py-8">
                          <p className="text-sm text-muted-foreground">No curriculum topics added yet</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Tajweed Tab */}
        <TabsContent value="tajweed">
          {tajweedSyllabi.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <BookOpen className="h-16 w-16 text-muted-foreground/50 mx-auto mb-4" />
                <p className="text-lg font-medium mb-2">No Tajweed Syllabus Available</p>
                <p className="text-sm text-muted-foreground mb-4">
                  {canManageSyllabus ? 'Add a syllabus to get started' : 'Syllabus will be available soon'}
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {tajweedSyllabi.map((syllabus) => (
                <>
                  <Card className="lg:col-span-1" key={`${syllabus._id || syllabus.id}-overview`}>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <BookOpen className="h-5 w-5 text-primary" />
                        {syllabus.title}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <p className="text-sm text-muted-foreground">{syllabus.description}</p>
                      
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Duration</span>
                          <span className="font-medium">{syllabus.duration}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Level</span>
                          <Badge variant="secondary">{syllabus.level}</Badge>
                        </div>
                      </div>

                      {syllabus.objectives && syllabus.objectives.length > 0 && (
                        <div className="pt-2">
                          <p className="text-sm font-medium mb-2">Learning Objectives:</p>
                          <ul className="text-sm text-muted-foreground space-y-1">
                            {syllabus.objectives.slice(0, 3).map((obj: string, i: number) => (
                              <li key={i} className="flex items-start gap-2">
                                <CheckCircle2 className="h-4 w-4 text-success mt-0.5 flex-shrink-0" />
                                <span>{obj}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {canManageSyllabus && (
                        <div className="flex gap-2 pt-2">
                          <Button variant="outline" size="sm" className="flex-1" onClick={() => handleEdit(syllabus)}>
                            <Edit className="h-4 w-4 mr-2" />
                            Edit
                          </Button>
                          {(currentUser?.role === 'admin' || currentUser?.role === 'team_leader') && (
                            <Button variant="outline" size="sm" onClick={() => { setCurrentSyllabus(syllabus); setIsDeleteOpen(true); }}>
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  <Card className="lg:col-span-2" key={`${syllabus._id || syllabus.id}-curriculum`}>
                    <CardHeader>
                      <CardTitle>Tajweed Rules Curriculum</CardTitle>
                    </CardHeader>
                    <CardContent>
                      {syllabus.topics && syllabus.topics.length > 0 ? (
                        <Accordion type="multiple" className="space-y-3">
                          {syllabus.topics.map((topic: any, index: number) => (
                            <AccordionItem key={index} value={`topic-${index}`} className="border rounded-lg px-4">
                              <AccordionTrigger className="hover:no-underline py-4">
                                <div className="flex items-center gap-4 flex-1">
                                  <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                                    {index + 1}
                                  </div>
                                  <div className="flex-1 text-left">
                                    <p className="font-semibold">{topic.title}</p>
                                    <p className="text-sm text-muted-foreground">{topic.duration || 'Duration not specified'}</p>
                                  </div>
                                </div>
                              </AccordionTrigger>
                              <AccordionContent className="pb-4">
                                <div className="ml-14">
                                  <p className="text-sm text-muted-foreground">{topic.description}</p>
                                </div>
                              </AccordionContent>
                            </AccordionItem>
                          ))}
                        </Accordion>
                      ) : (
                        <div className="text-center py-8">
                          <p className="text-sm text-muted-foreground">No curriculum topics added yet</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Dialog for Add/Edit */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingSyllabus ? 'Edit Syllabus' : 'Add Syllabus'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="title">Title *</Label>
                    <Input
                      id="title"
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="course">Course *</Label>
                    <Select value={formData.course} onValueChange={(value) => setFormData({ ...formData, course: value })}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Qaida">Qaida</SelectItem>
                        <SelectItem value="Nazra">Nazra</SelectItem>
                        <SelectItem value="Hifz">Hifz</SelectItem>
                        <SelectItem value="Tajweed">Tajweed</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="level">Level *</Label>
                    <Select value={formData.level} onValueChange={(value) => setFormData({ ...formData, level: value })}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Beginner">Beginner</SelectItem>
                        <SelectItem value="Intermediate">Intermediate</SelectItem>
                        <SelectItem value="Advanced">Advanced</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="duration">Duration *</Label>
                    <Input
                      id="duration"
                      placeholder="e.g., 3 months"
                      value={formData.duration}
                      onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                      required
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="description">Description *</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows={3}
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="objectives">Learning Objectives (one per line)</Label>
                  <Textarea
                    id="objectives"
                    value={formData.objectives}
                    onChange={(e) => setFormData({ ...formData, objectives: e.target.value })}
                    rows={3}
                    placeholder="Enter each objective on a new line"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="prerequisites">Prerequisites (one per line)</Label>
                  <Textarea
                    id="prerequisites"
                    value={formData.prerequisites}
                    onChange={(e) => setFormData({ ...formData, prerequisites: e.target.value })}
                    rows={2}
                    placeholder="Enter each prerequisite on a new line"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="materials">Required Materials (one per line)</Label>
                  <Textarea
                    id="materials"
                    value={formData.materials}
                    onChange={(e) => setFormData({ ...formData, materials: e.target.value })}
                    rows={2}
                    placeholder="Enter each material on a new line"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="assessmentCriteria">Assessment Criteria (one per line)</Label>
                  <Textarea
                    id="assessmentCriteria"
                    value={formData.assessmentCriteria}
                    onChange={(e) => setFormData({ ...formData, assessmentCriteria: e.target.value })}
                    rows={2}
                    placeholder="Enter each criterion on a new line"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="status">Status</Label>
                  <Select value={formData.status} onValueChange={(value) => setFormData({ ...formData, status: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="draft">Draft</SelectItem>
                      <SelectItem value="archived">Archived</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="attachments">Attachments (PDF, DOC, DOCX, XLS, XLSX)</Label>
                  <Input
                    id="attachments"
                    type="file"
                    accept=".pdf,.doc,.docx,.xls,.xlsx"
                    multiple
                    onChange={(e) => {
                      const files = Array.from(e.target.files || []);
                      const fileItems = files.map(file => ({
                        file,
                        name: file.name
                      }));
                      setSelectedFiles(prev => [...prev, ...fileItems]);
                    }}
                  />
                  {selectedFiles.length > 0 && (
                    <div className="mt-2 space-y-1">
                      {selectedFiles.map((fileItem, index) => (
                        <div key={index} className="flex items-center justify-between text-sm p-2 bg-muted rounded">
                          <span className="truncate">{fileItem.name}</span>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => setSelectedFiles(prev => prev.filter((_, i) => i !== index))}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                
            <DialogFooter>
              <Button type="submit">
                {editingSyllabus ? 'Update' : 'Add'} Syllabus
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Syllabus</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{currentSyllabus?.title}"? This action cannot be undone.
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
