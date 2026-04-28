import React, { useState } from "react";
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
  const { syllabi, isLoading, error } = useSyllabi();
  const createSyllabus = useCreateSyllabus();
  const updateSyllabus = useUpdateSyllabus();
  const deleteSyllabus = useDeleteSyllabus();
  
  const [selectedTab, setSelectedTab] = useState("qaida");
  const [selectedFiles, setSelectedFiles] = useState<FileWithPreview[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingSyllabus, setEditingSyllabus] = useState<any>(null);
  const [showForm, setShowForm] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [currentSyllabus, setCurrentSyllabus] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCourse, setFilterCourse] = useState('all');
  const [filterLevel, setFilterLevel] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [syllabusToDelete, setSyllabusToDelete] = useState<string | null>(null);
  
  // Centralized helper for attachment URLs
  const getFileUrl = (attachment: any) => {
    return attachment?.fileUrl || attachment?.url || attachment?.path || '';
  };

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
  
  // File size validation (5MB limit)
  const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB in bytes
  
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const validFiles: FileWithPreview[] = [];
    
    files.forEach((file: File) => {
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

  // File download functionality
  const handleFileDownload = (attachment: any) => {
    // Use centralized helper for URL resolution
    const fileUrl = getFileUrl(attachment);
    console.log('🔍 DOWNLOAD URL:', fileUrl);
    
    if (fileUrl) {
      console.log('🚀 DOWNLOADING FILE:', fileUrl);
      const link = document.createElement('a');
      link.href = fileUrl;
      link.download = attachment.fileName || attachment.filename || attachment.originalname || 'syllabus-file';
      link.target = '_blank';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      console.log('✅ DOWNLOAD INITIATED SUCCESSFULLY');
    } else {
      console.error('❌ NO VALID FILE URL FOUND in attachment:', attachment);
      alert('Unable to download file - file path not found');
    }
  };

  const handleFileOpen = (attachment: any) => {
    // Use centralized helper for URL resolution
    const fileUrl = getFileUrl(attachment);
    console.log('🔍 FILE URL:', fileUrl);
    console.log('🔍 FILE TYPE:', attachment?.fileType);
    
    // Open files in new tab - backend should provide correct URLs
    if (fileUrl) {
      console.log('🚀 OPENING FILE IN NEW TAB:', fileUrl);
      try {
        window.open(fileUrl, '_blank', 'noopener,noreferrer');
        console.log('✅ FILE OPENED IN NEW TAB SUCCESSFULLY');
      } catch (error) {
        console.error('❌ ERROR OPENING FILE:', error);
        alert('Error opening file - please try again or use download instead');
      }
    } else {
      console.error('❌ NO VALID FILE URL FOUND in attachment:', attachment);
      alert('Unable to open file - file path not found');
    }
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
      status: formData.status as 'active' | 'draft' | 'archived',
      createdBy: userId,
      createdByName: userName,
      
      // Parse arrays from text areas
      objectives: formData.objectives.split('\n').filter(o => o.trim()),
      prerequisites: formData.prerequisites.split('\n').filter(p => p.trim()),
      materials: formData.materials.split('\n').filter(m => m.trim()),
      assessmentCriteria: formData.assessmentCriteria.split('\n').filter(a => a.trim())
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
        
        // Add arrays as JSON strings (backend will parse them) - ensure clean JSON
        formDataToSend.append('objectives', JSON.stringify(syllabusData.objectives || []));
        formDataToSend.append('prerequisites', JSON.stringify(syllabusData.prerequisites || []));
        formDataToSend.append('materials', JSON.stringify(syllabusData.materials || []));
        formDataToSend.append('assessmentCriteria', JSON.stringify(syllabusData.assessmentCriteria || []));
        
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
  
  // Debug logging to understand syllabus data structure
  console.log("SYLLABUS DATA DEBUG:", {
    syllabi,
    isLoading,
    error,
    syllabiType: typeof syllabi,
    syllabiLength: syllabi?.length,
    isArray: Array.isArray(syllabi),
    message: "API data mapping fixed - should now show actual syllabus data"
  });

  // Add global error handler to catch 401 errors
  console.error("GLOBAL 401 DEBUG: Checking for authentication issues...");

  // Group syllabi by course - Add safe fallback to prevent undefined.filter error
  const qaidaSyllabi = (syllabi || []).filter(s => s.course === 'Qaida' && s.status === 'active');
  const nazraSyllabi = (syllabi || []).filter(s => s.course === 'Nazra' && s.status === 'active');
  const hifzSyllabi = (syllabi || []).filter(s => s.course === 'Hifz' && s.status === 'active');
  const tajweedSyllabi = (syllabi || []).filter(s => s.course === 'Tajweed' && s.status === 'active');
  
  const statusConfig = {
    completed: { icon: CheckCircle2, color: "bg-success/10 text-success" },
    current: { icon: PlayCircle, color: "bg-accent/10 text-accent" },
    locked: { icon: Lock, color: "bg-muted text-muted-foreground" },
  };

  // Loading guard to prevent rendering when data is not ready
  if (isLoading) {
    return (
      <MainLayout title="Curriculum & Syllabus" subtitle="View course curriculum and manage syllabi">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </MainLayout>
    );
  }

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
                <React.Fragment key={syllabus._id || syllabus.id}>
                  <Card className="lg:col-span-1">
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

                      {syllabus.attachments && syllabus.attachments.length > 0 && (
                        <div className="pt-2">
                          <p className="text-sm font-medium mb-2">Attachments:</p>
                          <div className="space-y-2">
                            {syllabus.attachments.map((attachment: any, index: number) => (
                              <div key={index} className="flex items-center justify-between p-2 bg-muted/50 rounded-lg">
                                <div className="flex items-center gap-2">
                                  <BookOpen className="h-4 w-4 text-muted-foreground" />
                                  <span className="text-sm truncate max-w-[150px]">
                                    {attachment.fileName || attachment.filename || attachment.originalname || `File ${index + 1}`}
                                  </span>
                                </div>
                                <div className="flex items-center gap-1">
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleFileOpen(attachment)}
                                    className="h-8 w-8 p-0"
                                    title="Open in new tab"
                                  >
                                    <PlayCircle className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleFileDownload(attachment)}
                                    className="h-8 w-8 p-0"
                                    title="Download file"
                                  >
                                    <ChevronRight className="h-4 w-4 rotate-270" />
                                  </Button>
                                </div>
                              </div>
                            ))}
                          </div>
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

                                  </React.Fragment>
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
                <React.Fragment key={syllabus._id || syllabus.id}>
                  <Card className="lg:col-span-1">
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

                      {syllabus.attachments && syllabus.attachments.length > 0 && (
                        <div className="pt-2">
                          <p className="text-sm font-medium mb-2">Attachments:</p>
                          <div className="space-y-2">
                            {syllabus.attachments.map((attachment: any, index: number) => (
                              <div key={index} className="flex items-center justify-between p-2 bg-muted/50 rounded-lg">
                                <div className="flex items-center gap-2">
                                  <BookOpen className="h-4 w-4 text-muted-foreground" />
                                  <span className="text-sm truncate max-w-[150px]">
                                    {attachment.fileName || attachment.filename || attachment.originalname || `File ${index + 1}`}
                                  </span>
                                </div>
                                <div className="flex items-center gap-1">
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleFileOpen(attachment)}
                                    className="h-8 w-8 p-0"
                                    title="Open in new tab"
                                  >
                                    <PlayCircle className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleFileDownload(attachment)}
                                    className="h-8 w-8 p-0"
                                    title="Download file"
                                  >
                                    <ChevronRight className="h-4 w-4 rotate-270" />
                                  </Button>
                                </div>
                              </div>
                            ))}
                          </div>
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

                                  </React.Fragment>
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
                <React.Fragment key={syllabus._id || syllabus.id}>
                  <Card className="lg:col-span-1">
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

                      {syllabus.attachments && syllabus.attachments.length > 0 && (
                        <div className="pt-2">
                          <p className="text-sm font-medium mb-2">Attachments:</p>
                          <div className="space-y-2">
                            {syllabus.attachments.map((attachment: any, index: number) => (
                              <div key={index} className="flex items-center justify-between p-2 bg-muted/50 rounded-lg">
                                <div className="flex items-center gap-2">
                                  <BookOpen className="h-4 w-4 text-muted-foreground" />
                                  <span className="text-sm truncate max-w-[150px]">
                                    {attachment.fileName || attachment.filename || attachment.originalname || `File ${index + 1}`}
                                  </span>
                                </div>
                                <div className="flex items-center gap-1">
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleFileOpen(attachment)}
                                    className="h-8 w-8 p-0"
                                    title="Open in new tab"
                                  >
                                    <PlayCircle className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleFileDownload(attachment)}
                                    className="h-8 w-8 p-0"
                                    title="Download file"
                                  >
                                    <ChevronRight className="h-4 w-4 rotate-270" />
                                  </Button>
                                </div>
                              </div>
                            ))}
                          </div>
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

                                  </React.Fragment>
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
                <React.Fragment key={syllabus._id || syllabus.id}>
                  <Card className="lg:col-span-1">
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

                      {syllabus.attachments && syllabus.attachments.length > 0 && (
                        <div className="pt-2">
                          <p className="text-sm font-medium mb-2">Attachments:</p>
                          <div className="space-y-2">
                            {syllabus.attachments.map((attachment: any, index: number) => (
                              <div key={index} className="flex items-center justify-between p-2 bg-muted/50 rounded-lg">
                                <div className="flex items-center gap-2">
                                  <BookOpen className="h-4 w-4 text-muted-foreground" />
                                  <span className="text-sm truncate max-w-[150px]">
                                    {attachment.fileName || attachment.filename || attachment.originalname || `File ${index + 1}`}
                                  </span>
                                </div>
                                <div className="flex items-center gap-1">
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleFileOpen(attachment)}
                                    className="h-8 w-8 p-0"
                                    title="Open in new tab"
                                  >
                                    <PlayCircle className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleFileDownload(attachment)}
                                    className="h-8 w-8 p-0"
                                    title="Download file"
                                  >
                                    <ChevronRight className="h-4 w-4 rotate-270" />
                                  </Button>
                                </div>
                              </div>
                            ))}
                          </div>
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

                                  </React.Fragment>
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

      {/* PDF Viewer Modal - Removed - Now using new tab approach for better Cloudinary compatibility */}
    </MainLayout>
  );
}
