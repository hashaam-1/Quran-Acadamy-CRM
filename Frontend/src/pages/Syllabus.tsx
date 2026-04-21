import { useState } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Progress } from "@/components/ui/progress";
import { BookOpen, Plus, Edit, Trash2, ChevronRight, CheckCircle2, Lock, PlayCircle } from "lucide-react";
import { useSyllabi, useCreateSyllabus, useUpdateSyllabus, useDeleteSyllabus } from "@/hooks/useSyllabus";
import { useAuthStore } from "@/lib/auth-store";
import { cn } from "@/lib/utils";

interface CurriculumTopic {
  id: string;
  title: string;
  description: string;
  duration: string;
  order: number;
  resources: string[];
  activities: string[];
}

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
  topics: CurriculumTopic[];
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
    status: 'active',
    topics: []
  });
  
  const [selectedFiles, setSelectedFiles] = useState<FileWithPreview[]>([]);
  
  // Curriculum management state
  const [isCurriculumDialogOpen, setIsCurriculumDialogOpen] = useState(false);
  const [editingTopic, setEditingTopic] = useState<CurriculumTopic | null>(null);
  const [topicFormData, setTopicFormData] = useState<CurriculumTopic>({
    id: '',
    title: '',
    description: '',
    duration: '',
    order: 0,
    resources: [],
    activities: []
  });
  
  // File size validation (5MB limit)
  const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB in bytes
  
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const validFiles: FileWithPreview[] = [];
    
    files.forEach(file => {
      if (file.size > MAX_FILE_SIZE) {
        alert(`File "${file.name}" is too large. Maximum size is 5MB.`);
        return;
      }
      validFiles.push({
        file,
        name: file.name
      });
    });
    
    setSelectedFiles(prev => [...prev, ...validFiles]);
  };

  // Curriculum management functions
  const handleAddTopic = () => {
    setEditingTopic(null);
    setTopicFormData({
      id: Date.now().toString(),
      title: '',
      description: '',
      duration: '',
      order: formData.topics?.length || 0,
      resources: [],
      activities: []
    });
    setIsCurriculumDialogOpen(true);
  };

  const handleEditTopic = (topic: CurriculumTopic) => {
    setEditingTopic(topic);
    setTopicFormData(topic);
    setIsCurriculumDialogOpen(true);
  };

  const handleSaveTopic = () => {
    if (!topicFormData.title.trim()) {
      alert('Please enter a topic title');
      return;
    }

    if (editingTopic) {
      // Update existing topic
      setFormData(prev => ({
        ...prev,
        topics: (prev.topics || []).map(topic => 
          topic.id === editingTopic.id ? topicFormData : topic
        )
      }));
    } else {
      // Add new topic
      setFormData(prev => ({
        ...prev,
        topics: [...(prev.topics || []), topicFormData]
      }));
    }

    setIsCurriculumDialogOpen(false);
    setEditingTopic(null);
  };

  const handleDeleteTopic = (topicId: string) => {
    if (confirm('Are you sure you want to delete this topic?')) {
      setFormData(prev => ({
        ...prev,
        topics: (prev.topics || []).filter(topic => topic.id !== topicId)
      }));
    }
  };

  const handleMoveTopic = (topicId: string, direction: 'up' | 'down') => {
    const topics = [...(formData.topics || [])];
    const index = topics.findIndex(topic => topic.id === topicId);
    
    if (direction === 'up' && index > 0) {
      [topics[index], topics[index - 1]] = [topics[index - 1], topics[index]];
    } else if (direction === 'down' && index < topics.length - 1) {
      [topics[index], topics[index + 1]] = [topics[index + 1], topics[index]];
    }
    
    // Update order numbers
    topics.forEach((topic, idx) => {
      topic.order = idx;
    });
    
    setFormData(prev => ({
      ...prev,
      topics
    }));
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Get user ID - prioritize MongoDB ObjectId _id over string id
    const userId = (currentUser as any)?._id || currentUser?.id || (currentUser as any)?.userId;
    const userName = currentUser?.name || (currentUser as any)?.firstName || 'Unknown User';
    
    // Enhanced validation
    console.log('User validation:', {
      currentUser,
      userId,
      userIdType: typeof userId,
      userName,
      hasId: !!userId,
      hasName: !!userName,
      isObjectId: typeof userId === 'string' && userId.length === 24 && /^[0-9a-fA-F]{24}$/.test(userId)
    });
    
    if (!userId) {
      console.error('No user ID found in currentUser:', currentUser);
      alert('User authentication issue. Please log in again.');
      return;
    }
    
    // No ObjectId validation needed - backend now accepts String for createdBy
    console.log('Using createdBy ID:', userId, 'Type:', typeof userId);
    
    // Validate required form fields (matching backend requirements)
    const requiredFields = ['title', 'course', 'level', 'description', 'duration'];
    const missingFields = requiredFields.filter(field => !formData[field as keyof typeof formData] || formData[field as keyof typeof formData].trim() === '');
    
    if (missingFields.length > 0) {
      console.error('Missing required fields:', missingFields);
      alert(`Please fill in all required fields: ${missingFields.join(', ')}`);
      return;
    }
    
    // Create syllabus data with validated user info
    const syllabusData = {
      title: formData.title.trim(),
      course: formData.course as 'Qaida' | 'Nazra' | 'Hifz' | 'Tajweed',
      level: formData.level as 'Beginner' | 'Intermediate' | 'Advanced',
      description: formData.description.trim(),
      duration: formData.duration.trim(),
      status: formData.status,
      createdBy: userId,
      createdByName: userName,
      
      // Parse arrays from text areas
      objectives: formData.objectives.split('\n').filter(o => o.trim()),
      prerequisites: formData.prerequisites.split('\n').filter(p => p.trim()),
      materials: formData.materials.split('\n').filter(m => m.trim()),
      assessmentCriteria: formData.assessmentCriteria.split('\n').filter(a => a.trim()),
      topics: formData.topics // Include curriculum topics from form
    };

    // Debug logging
    console.log('=== SYLLABUS SUBMISSION DEBUG ===');
    console.log('User ID:', userId);
    console.log('User Name:', currentUser?.name);
    console.log('Syllabus Data:', syllabusData);
    console.log('Selected Files:', selectedFiles.length);
    console.log('================================');
    
    try {
      if (selectedFiles.length > 0) {
        // Use FormData when files are present - send fields directly as backend expects
        const formDataToSend = new FormData();
        
        // Add all syllabus data fields directly (not as JSON string)
        formDataToSend.append('title', syllabusData.title);
        formDataToSend.append('course', syllabusData.course);
        formDataToSend.append('level', syllabusData.level);
        formDataToSend.append('description', syllabusData.description);
        formDataToSend.append('duration', syllabusData.duration);
        formDataToSend.append('status', syllabusData.status);
        formDataToSend.append('createdBy', syllabusData.createdBy);
        formDataToSend.append('createdByName', syllabusData.createdByName);
        
        // Add arrays as JSON strings (backend will parse them)
        formDataToSend.append('topics', JSON.stringify(syllabusData.topics));
        formDataToSend.append('objectives', JSON.stringify(syllabusData.objectives));
        formDataToSend.append('prerequisites', JSON.stringify(syllabusData.prerequisites));
        formDataToSend.append('materials', JSON.stringify(syllabusData.materials));
        formDataToSend.append('assessmentCriteria', JSON.stringify(syllabusData.assessmentCriteria));
        
        // Add files
        selectedFiles.forEach((fileItem) => {
          formDataToSend.append('attachments', fileItem.file);
        });
        
        console.log('Submitting with FormData (fields directly)...');
        if (editingSyllabus) {
          await updateSyllabus.mutateAsync({ id: editingSyllabus.id, data: formDataToSend });
        } else {
          await createSyllabus.mutateAsync(formDataToSend);
        }
      } else {
        // Use JSON when no files
        console.log('Submitting with JSON...');
        if (editingSyllabus) {
          await updateSyllabus.mutateAsync({ id: editingSyllabus.id, data: syllabusData });
        } else {
          await createSyllabus.mutateAsync(syllabusData);
        }
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
        status: 'active',
        topics: []
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
      status: syllabus.status,
      topics: syllabus.topics || []
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
            <DialogDescription>
              {editingSyllabus 
                ? 'Edit the syllabus details and curriculum content below.' 
                : 'Create a new syllabus by filling in the details and curriculum content below.'}
            </DialogDescription>
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

                {/* Curriculum Topics Section */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label>Curriculum Topics</Label>
                    <Button type="button" variant="outline" size="sm" onClick={handleAddTopic}>
                      <Plus className="h-4 w-4 mr-2" />
                      Add Topic
                    </Button>
                  </div>
                  
                  {formData.topics?.length > 0 ? (
                    <div className="space-y-2">
                      {formData.topics.map((topic, index) => (
                        <div key={topic.id} className="flex items-center gap-2 p-3 border rounded-lg bg-muted/50">
                          <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm">
                            {index + 1}
                          </div>
                          <div className="flex-1">
                            <p className="font-medium text-sm">{topic.title}</p>
                            <p className="text-xs text-muted-foreground">{topic.duration || 'No duration'}</p>
                          </div>
                          <div className="flex items-center gap-1">
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => handleMoveTopic(topic.id, 'up')}
                              disabled={index === 0}
                            >
                              <ChevronRight className="h-4 w-4 rotate-270" />
                            </Button>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => handleMoveTopic(topic.id, 'down')}
                              disabled={index === (formData.topics?.length || 0) - 1}
                            >
                              <ChevronRight className="h-4 w-4 rotate-90" />
                            </Button>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEditTopic(topic)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteTopic(topic.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-6 border-2 border-dashed border-muted-foreground/25 rounded-lg">
                      <BookOpen className="h-8 w-8 mx-auto text-muted-foreground/50 mb-2" />
                      <p className="text-sm text-muted-foreground">No curriculum topics added yet</p>
                      <p className="text-xs text-muted-foreground mt-1">Click "Add Topic" to start building your curriculum</p>
                    </div>
                  )}
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
                  <Label htmlFor="attachments">Attachments (PDF, DOC, DOCX, XLS, XLSX) - Max 5MB per file</Label>
                  <Input
                    id="attachments"
                    type="file"
                    accept=".pdf,.doc,.docx,.xls,.xlsx"
                    multiple
                    onChange={handleFileChange}
                  />
                  <p className="text-xs text-muted-foreground">
                    Maximum file size: 5MB per file. Supported formats: PDF, DOC, DOCX, XLS, XLSX
                  </p>
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

      {/* Curriculum Topic Editor Dialog */}
      <Dialog open={isCurriculumDialogOpen} onOpenChange={setIsCurriculumDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingTopic ? 'Edit Topic' : 'Add Topic'}</DialogTitle>
            <DialogDescription>
              {editingTopic 
                ? 'Edit the curriculum topic details below.' 
                : 'Add a new topic to your curriculum.'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="topicTitle">Topic Title *</Label>
              <Input
                id="topicTitle"
                value={topicFormData.title}
                onChange={(e) => setTopicFormData({ ...topicFormData, title: e.target.value })}
                placeholder="e.g., Arabic Alphabet Basics"
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="topicDescription">Description</Label>
              <Textarea
                id="topicDescription"
                value={topicFormData.description}
                onChange={(e) => setTopicFormData({ ...topicFormData, description: e.target.value })}
                rows={3}
                placeholder="Describe what students will learn in this topic"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="topicDuration">Duration</Label>
              <Input
                id="topicDuration"
                value={topicFormData.duration}
                onChange={(e) => setTopicFormData({ ...topicFormData, duration: e.target.value })}
                placeholder="e.g., 2 weeks, 5 classes"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="topicResources">Learning Resources (one per line)</Label>
              <Textarea
                id="topicResources"
                value={topicFormData.resources.join('\n')}
                onChange={(e) => setTopicFormData({ 
                  ...topicFormData, 
                  resources: e.target.value.split('\n').filter(r => r.trim()) 
                })}
                rows={3}
                placeholder="Enter each resource on a new line"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="topicActivities">Activities (one per line)</Label>
              <Textarea
                id="topicActivities"
                value={topicFormData.activities.join('\n')}
                onChange={(e) => setTopicFormData({ 
                  ...topicFormData, 
                  activities: e.target.value.split('\n').filter(a => a.trim()) 
                })}
                rows={3}
                placeholder="Enter each activity on a new line"
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCurriculumDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveTopic}>
              {editingTopic ? 'Update' : 'Add'} Topic
            </Button>
          </DialogFooter>
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
