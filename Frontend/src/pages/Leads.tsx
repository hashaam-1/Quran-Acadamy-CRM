import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { MainLayout } from "@/components/layout/MainLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Plus,
  Search,
  MessageSquare,
  ArrowRight,
  User,
  Pencil,
  Trash2,
} from "lucide-react";
import { CreateChatDialog } from "@/components/chat/CreateChatDialog";
import { cn } from "@/lib/utils";
import { Lead } from "@/lib/store";
import { useLeads, useCreateLead, useUpdateLead, useDeleteLead } from "@/hooks/useLeads";
import { useAuthStore } from "@/lib/auth-store";
import { toast } from "sonner";

const statusConfig = {
  new: { label: "New", variant: "new" as const },
  follow_up: { label: "Follow Up", variant: "trial" as const },
  trial: { label: "Trial", variant: "info" as const },
  enrolled: { label: "Enrolled", variant: "regular" as const },
  closed: { label: "Closed", variant: "closed" as const },
};

const emptyLead: Omit<Lead, "id"> = {
  name: "",
  phone: "",
  email: "",
  country: "",
  course: "Qaida",
  status: "new",
  assignedTo: "",
  source: "",
  createdAt: new Date().toISOString().split('T')[0],
  notes: "",
};

// LeadForm component moved outside to prevent re-creation on every render
const LeadForm = ({ 
  formData, 
  setFormData, 
  onSubmit, 
  submitLabel 
}: { 
  formData: Omit<Lead, "id">; 
  setFormData: React.Dispatch<React.SetStateAction<Omit<Lead, "id">>>; 
  onSubmit: () => void; 
  submitLabel: string;
}) => (
  <div className="grid gap-4 py-4">
    <div className="grid grid-cols-2 gap-4">
      <div className="space-y-2">
        <Label htmlFor="name">Full Name</Label>
        <Input 
          id="name" 
          value={formData.name} 
          onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))} 
          placeholder="Enter name" 
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="phone">Phone</Label>
        <Input 
          id="phone" 
          value={formData.phone} 
          onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))} 
          placeholder="+92..." 
        />
      </div>
    </div>
    <div className="grid grid-cols-2 gap-4">
      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input 
          id="email" 
          type="email" 
          value={formData.email} 
          onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))} 
          placeholder="email@example.com" 
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="country">Country</Label>
        <Input 
          id="country" 
          value={formData.country} 
          onChange={(e) => setFormData(prev => ({ ...prev, country: e.target.value }))} 
          placeholder="Country" 
        />
      </div>
    </div>
    <div className="grid grid-cols-2 gap-4">
      <div className="space-y-2">
        <Label>Course</Label>
        <Select value={formData.course} onValueChange={(val) => setFormData(prev => ({ ...prev, course: val }))}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="Qaida">Qaida</SelectItem>
            <SelectItem value="Nazra">Nazra</SelectItem>
            <SelectItem value="Hifz">Hifz</SelectItem>
            <SelectItem value="Tajweed">Tajweed</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-2">
        <Label>Status</Label>
        <Select value={formData.status} onValueChange={(val: Lead["status"]) => setFormData(prev => ({ ...prev, status: val }))}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="new">New</SelectItem>
            <SelectItem value="follow_up">Follow Up</SelectItem>
            <SelectItem value="trial">Trial</SelectItem>
            <SelectItem value="enrolled">Enrolled</SelectItem>
            <SelectItem value="closed">Closed</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
    <div className="grid grid-cols-2 gap-4">
      <div className="space-y-2">
        <Label htmlFor="assignedTo">Assigned To</Label>
        <Input 
          id="assignedTo" 
          value={formData.assignedTo} 
          onChange={(e) => setFormData(prev => ({ ...prev, assignedTo: e.target.value }))} 
          placeholder="Sales person name" 
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="source">Source</Label>
        <Input 
          id="source" 
          value={formData.source} 
          onChange={(e) => setFormData(prev => ({ ...prev, source: e.target.value }))} 
          placeholder="Facebook, Google, etc." 
        />
      </div>
    </div>
    <div className="space-y-2">
      <Label htmlFor="notes">Notes</Label>
      <Textarea 
        id="notes" 
        value={formData.notes} 
        onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))} 
        placeholder="Additional information..." 
        rows={3}
      />
    </div>
    <DialogFooter>
      <Button onClick={onSubmit}>{submitLabel}</Button>
    </DialogFooter>
  </div>
);

export default function Leads() {
  const navigate = useNavigate();
  const { data: leads = [], isLoading } = useLeads();
  const createLead = useCreateLead();
  const updateLeadMutation = useUpdateLead();
  const deleteLeadMutation = useDeleteLead();
  const { currentUser } = useAuthStore();
  
  console.log('Leads component - Total leads:', leads?.length || 0);
  console.log('Current user:', currentUser);
  console.log('Leads data:', leads);
  
  const [selectedStatus, setSelectedStatus] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [currentLead, setCurrentLead] = useState<Lead | null>(null);
  const [formData, setFormData] = useState(emptyLead);
  const [isChatDialogOpen, setIsChatDialogOpen] = useState(false);
  const [selectedLeadForChat, setSelectedLeadForChat] = useState<Lead | null>(null);

  const filteredLeads = leads.filter((lead) => {
    const matchesStatus = selectedStatus === "all" || lead.status === selectedStatus;
    const matchesSearch = lead.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      lead.email.toLowerCase().includes(searchQuery.toLowerCase());
    
    // All users can see all leads (admin, sales_team, team_leader, etc.)
    return matchesStatus && matchesSearch;
  });
  
  console.log('Filtered leads count:', filteredLeads.length);
  console.log('Selected status:', selectedStatus);
  console.log('Search query:', searchQuery);

  const pipelineStages = [
    { id: "new", label: "New Leads", count: leads.filter(l => l.status === "new").length, color: "bg-info" },
    { id: "follow_up", label: "Follow Up", count: leads.filter(l => l.status === "follow_up").length, color: "bg-accent" },
    { id: "trial", label: "Trial", count: leads.filter(l => l.status === "trial").length, color: "bg-primary" },
    { id: "enrolled", label: "Enrolled", count: leads.filter(l => l.status === "enrolled").length, color: "bg-success" },
    { id: "closed", label: "Closed", count: leads.filter(l => l.status === "closed").length, color: "bg-muted-foreground" },
  ];

  const handleAdd = () => {
    createLead.mutate(formData, {
      onSuccess: () => {
        setFormData(emptyLead);
        setIsAddDialogOpen(false);
      }
    });
  };

  const handleEdit = () => {
    if (currentLead) {
      const leadId = (currentLead as any)._id || currentLead.id;
      updateLeadMutation.mutate({ id: leadId, data: formData }, {
        onSuccess: () => {
          setIsEditDialogOpen(false);
          setCurrentLead(null);
        }
      });
    }
  };

  const handleDelete = () => {
    if (currentLead) {
      const leadId = (currentLead as any)._id || currentLead.id;
      deleteLeadMutation.mutate(leadId, {
        onSuccess: () => {
          setIsDeleteDialogOpen(false);
          setCurrentLead(null);
        }
      });
    }
  };

  const openEditDialog = (lead: Lead) => {
    setCurrentLead(lead);
    setFormData(lead);
    setIsEditDialogOpen(true);
  };

  const openDeleteDialog = (lead: Lead) => {
    setCurrentLead(lead);
    setIsDeleteDialogOpen(true);
  };

  const handleWhatsApp = (lead: Lead) => {
    const leadId = (lead as any)._id || lead.id;
    // Navigate to messages page with lead info in URL params
    navigate(`/messages?userId=${leadId}&userName=${encodeURIComponent(lead.name)}&userRole=student`);
  };

  if (isLoading) {
    return (
      <MainLayout title="Leads Management" subtitle="Track and convert your leads">
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading leads...</p>
          </div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout title="Leads Management" subtitle="Track and convert your leads">
      {/* Pipeline Overview */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-6">
        {pipelineStages.map((stage, index) => (
          <Card key={stage.id} variant="interactive" className={cn("animate-slide-up", `stagger-${index + 1}`)} onClick={() => setSelectedStatus(stage.id)}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <div className={cn("h-3 w-3 rounded-full", stage.color)} />
                <ArrowRight className="h-4 w-4 text-muted-foreground" />
              </div>
              <p className="text-2xl font-bold">{stage.count}</p>
              <p className="text-xs text-muted-foreground">{stage.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Leads Table */}
      <Card className="animate-slide-up">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>All Leads</CardTitle>
          <Button className="gap-2" onClick={() => { setFormData(emptyLead); setIsAddDialogOpen(true); }}>
            <Plus className="h-4 w-4" />
            Add Lead
          </Button>
        </CardHeader>
        <CardContent>
          {/* Filters */}
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Search leads..." className="pl-9" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
            </div>
            <Select value={selectedStatus} onValueChange={setSelectedStatus}>
              <SelectTrigger className="w-full md:w-[180px]"><SelectValue placeholder="Status" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="new">New</SelectItem>
                <SelectItem value="follow_up">Follow Up</SelectItem>
                <SelectItem value="trial">Trial</SelectItem>
                <SelectItem value="enrolled">Enrolled</SelectItem>
                <SelectItem value="closed">Closed</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Table */}
          <div className="rounded-lg border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead>Lead</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>Course</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Assigned To</TableHead>
                  <TableHead>Source</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredLeads.map((lead) => (
                  <TableRow key={lead.id} className="hover:bg-muted/30">
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center">
                          <User className="h-4 w-4 text-primary" />
                        </div>
                        <div>
                          <p className="font-medium">{lead.name}</p>
                          <p className="text-xs text-muted-foreground">{lead.country}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <p className="text-sm font-mono">{lead.phone}</p>
                        <p className="text-xs text-muted-foreground">{lead.email}</p>
                      </div>
                    </TableCell>
                    <TableCell><Badge variant="outline">{lead.course}</Badge></TableCell>
                    <TableCell><Badge variant={statusConfig[lead.status].variant}>{statusConfig[lead.status].label}</Badge></TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className="h-6 w-6 rounded-full bg-accent/20 flex items-center justify-center text-xs font-medium">{lead.assignedTo[0]}</div>
                        <span className="text-sm">{lead.assignedTo}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">{lead.source}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEditDialog(lead)}><Pencil className="h-4 w-4" /></Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-success" onClick={() => handleWhatsApp(lead)}><MessageSquare className="h-4 w-4" /></Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => openDeleteDialog(lead)}><Trash2 className="h-4 w-4" /></Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Add Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add New Lead</DialogTitle>
            <DialogDescription>Enter the lead details below.</DialogDescription>
          </DialogHeader>
          <LeadForm formData={formData} setFormData={setFormData} onSubmit={handleAdd} submitLabel="Add Lead" />
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Lead</DialogTitle>
            <DialogDescription>Update the lead information.</DialogDescription>
          </DialogHeader>
          <LeadForm formData={formData} setFormData={setFormData} onSubmit={handleEdit} submitLabel="Save Changes" />
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Lead</AlertDialogTitle>
            <AlertDialogDescription>Are you sure you want to delete {currentLead?.name}? This action cannot be undone.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Chat Dialog */}
      <CreateChatDialog 
        open={isChatDialogOpen} 
        onOpenChange={setIsChatDialogOpen}
        preselectedUser={selectedLeadForChat ? {
          userId: selectedLeadForChat.id,
          userName: selectedLeadForChat.name,
          userRole: 'student'
        } : undefined}
      />
    </MainLayout>
  );
}
