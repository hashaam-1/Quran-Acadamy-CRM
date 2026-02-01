import { useState } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Search,
  DollarSign,
  Receipt,
  AlertCircle,
  CheckCircle,
  Clock,
  MessageSquare,
  Download,
  User,
  Pencil,
  Trash2,
  Plus,
  FileText,
  Calendar,
  Phone,
  Mail,
  MapPin,
} from "lucide-react";
import { Invoice } from "@/lib/store";
import { toast } from "sonner";
import { useInvoices, useCreateInvoice, useUpdateInvoice, useDeleteInvoice } from "@/hooks/useInvoices";
import { useStudents } from "@/hooks/useStudents";
import { useAuthStore } from "@/lib/auth-store";
import { cn } from "@/lib/utils";
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

const statusConfig = {
  paid: { label: "Paid", variant: "success" as const, icon: CheckCircle },
  unpaid: { label: "Unpaid", variant: "warning" as const, icon: Clock },
  overdue: { label: "Overdue", variant: "destructive" as const, icon: AlertCircle },
  partial: { label: "Partial", variant: "info" as const, icon: DollarSign },
};

const months = [
  'January 2024', 'February 2024', 'March 2024', 'April 2024',
  'May 2024', 'June 2024', 'July 2024', 'August 2024',
  'September 2024', 'October 2024', 'November 2024', 'December 2024',
];

const emptyInvoice: Omit<Invoice, 'id'> = {
  studentName: '',
  studentId: '',
  amount: 100,
  month: 'January 2024',
  status: 'unpaid',
  dueDate: new Date().toISOString().split('T')[0],
  paidAmount: 0,
  discount: 0,
};

export default function Invoices() {
  const { data: invoices = [], isLoading: invoicesLoading } = useInvoices();
  const { data: students = [], isLoading: studentsLoading } = useStudents();
  const { currentUser } = useAuthStore();
  const createInvoiceMutation = useCreateInvoice();
  const updateInvoiceMutation = useUpdateInvoice();
  const deleteInvoiceMutation = useDeleteInvoice();
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [current, setCurrent] = useState<Invoice | null>(null);
  const [formData, setFormData] = useState(emptyInvoice);

  const filtered = invoices.filter((inv) => {
    const matchesSearch = inv.studentName.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === "all" || inv.status === statusFilter;
    
    // Role-based filtering
    let matchesRole = true;
    if (currentUser?.role === 'student') {
      // Students can only see their own invoices
      // Since invoiceStudentId might be null, prioritize name matching
      const invoiceStudentId = typeof inv.studentId === 'object' && inv.studentId !== null 
        ? (inv.studentId as any)._id || (inv.studentId as any).id
        : inv.studentId;
      
      const currentStudentId = currentUser.id || (currentUser as any)._id || (currentUser as any).studentId;
      
      matchesRole = invoiceStudentId === currentStudentId || inv.studentName === currentUser.name;
    }
    // Admin, team_leader, teacher can see all (for now)
    
    const result = matchesSearch && matchesStatus && matchesRole;
    
    return result;
  });

  const totalRevenue = invoices.reduce((acc, inv) => acc + inv.paidAmount, 0);
  const pendingAmount = invoices.reduce((acc, inv) => acc + (inv.amount - inv.paidAmount), 0);
  const overdueCount = invoices.filter(inv => inv.status === "overdue").length;

  const handleAdd = () => {
    if (!formData.studentName || !formData.studentId || !formData.amount || !formData.month || !formData.dueDate) {
      toast.error('Please fill in all required fields');
      return;
    }
    
    createInvoiceMutation.mutate(formData, {
      onSuccess: () => {
        setFormData(emptyInvoice);
        setIsAddOpen(false);
      }
    });
  };

  const handleStudentChange = (studentName: string) => {
    const student = students.find(s => s.name === studentName);
    if (student) {
      const studentId = (student as any)._id || student.id;
      setFormData(prev => ({
        ...prev,
        studentName,
        studentId: studentId,
        amount: student.feeAmount || 100,
      }));
    }
  };

  const handleEdit = () => {
    if (current) {
      const invoiceId = (current as any)._id || current.id;
      updateInvoiceMutation.mutate({ id: invoiceId, data: formData }, {
        onSuccess: () => {
          setIsEditOpen(false);
          setCurrent(null);
        }
      });
    }
  };

  const handleDelete = () => {
    if (current) {
      const invoiceId = (current as any)._id || current.id;
      deleteInvoiceMutation.mutate(invoiceId, {
        onSuccess: () => {
          setIsDeleteOpen(false);
          setCurrent(null);
        }
      });
    }
  };

  const handleMarkPaid = (invoice: Invoice) => {
    const invoiceId = (invoice as any)._id || invoice.id;
    updateInvoiceMutation.mutate({ 
      id: invoiceId, 
      data: { status: 'paid', paidAmount: invoice.amount } 
    });
  };

  const handleDownload = async (invoice: Invoice) => {
    const invoiceId = (invoice as any)._id || invoice.id;
    const student = students.find(s => s.id === invoice.studentId || s.name === invoice.studentName);
    
    // Get academy settings from localStorage or use defaults
    const academySettings = JSON.parse(localStorage.getItem('academySettings') || '{}');
    const academyName = academySettings.academyName || 'Quran Academy';
    const contactEmail = academySettings.contactEmail || 'info@quranacademy.com';
    const contactPhone = academySettings.contactPhone || '+1 234 567 8900';
    const address = academySettings.address || '123 Islamic Street, City, Country';
    
    // Create beautiful invoice HTML
    const invoiceHTML = `
      <div id="invoice-content" style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 800px; margin: 0 auto; padding: 40px 20px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: #333;">
        <!-- Header -->
        <div style="background: white; border-radius: 20px; padding: 40px; box-shadow: 0 20px 40px rgba(0,0,0,0.1);">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 40px; padding-bottom: 20px; border-bottom: 3px solid #667eea;">
            <div>
              <h1 style="color: #667eea; font-size: 32px; margin: 0; font-weight: 700;">${academyName.toUpperCase()}</h1>
              <p style="color: #666; margin: 5px 0 0; font-size: 14px;">Islamic Education Excellence</p>
            </div>
            <div style="text-align: right;">
              <div style="background: linear-gradient(135deg, #667eea, #764ba2); color: white; padding: 15px 25px; border-radius: 50px; font-weight: 600; display: inline-block;">
                INVOICE
              </div>
              <p style="color: #666; margin-top: 10px; font-size: 14px;">#${invoiceId}</p>
            </div>
          </div>

          <!-- Invoice Info -->
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 40px; margin-bottom: 30px;">
            <div>
              <h3 style="color: #667eea; margin-bottom: 15px; font-size: 18px; font-weight: 600;">Bill To:</h3>
              <p style="font-size: 16px; margin: 5px 0; font-weight: 500;">${invoice.studentName}</p>
              ${student?.email ? `<p style="color: #666; font-size: 14px; margin: 3px 0;">${student.email}</p>` : ''}
              ${student?.phone ? `<p style="color: #666; font-size: 14px; margin: 3px 0;">${student.phone}</p>` : ''}
              ${student?.country ? `<p style="color: #666; font-size: 14px; margin: 3px 0;">${student.country}</p>` : ''}
            </div>
            <div style="text-align: right;">
              <h3 style="color: #667eea; margin-bottom: 15px; font-size: 18px; font-weight: 600;">Invoice Details:</h3>
              <p style="font-size: 14px; margin: 5px 0;"><strong>Month:</strong> ${invoice.month}</p>
              <p style="font-size: 14px; margin: 5px 0;"><strong>Due Date:</strong> ${new Date(invoice.dueDate).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
              <p style="font-size: 14px; margin: 5px 0;"><strong>Status:</strong> 
                <span style="background: ${invoice.status === 'paid' ? '#10b981' : invoice.status === 'overdue' ? '#ef4444' : '#f59e0b'}; color: white; padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: 600; text-transform: uppercase;">
                  ${invoice.status}
                </span>
              </p>
            </div>
          </div>

          <!-- Course Information -->
          <div style="background: #f8fafc; border-left: 4px solid #667eea; padding: 20px; margin-bottom: 30px; border-radius: 8px;">
            <h3 style="color: #667eea; margin-bottom: 10px; font-size: 16px; font-weight: 600;">Course Information</h3>
            <p style="font-size: 14px; margin: 5px 0;"><strong>Course:</strong> ${student?.course || 'Quran Learning'}</p>
            <p style="font-size: 14px; margin: 5px 0;"><strong>Teacher:</strong> ${student?.teacher || 'Assigned Teacher'}</p>
            <p style="font-size: 14px; margin: 5px 0;"><strong>Schedule:</strong> ${student?.schedule || 'Weekly Classes'}</p>
          </div>

          <!-- Financial Details -->
          <div style="margin-bottom: 30px;">
            <h3 style="color: #667eea; margin-bottom: 20px; font-size: 18px; font-weight: 600;">Payment Details</h3>
            <table style="width: 100%; border-collapse: collapse;">
              <thead>
                <tr style="background: #f1f5f9;">
                  <th style="padding: 15px; text-align: left; border-bottom: 2px solid #e2e8f0; font-weight: 600; color: #374151;">Description</th>
                  <th style="padding: 15px; text-align: right; border-bottom: 2px solid #e2e8f0; font-weight: 600; color: #374151;">Amount</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td style="padding: 15px; border-bottom: 1px solid #e2e8f0;">Tuition Fee - ${invoice.month}</td>
                  <td style="padding: 15px; text-align: right; border-bottom: 1px solid #e2e8f0; font-weight: 500;">$${invoice.amount.toFixed(2)}</td>
                </tr>
                ${invoice.discount ? `
                <tr>
                  <td style="padding: 15px; border-bottom: 1px solid #e2e8f0; color: #10b981;">Discount</td>
                  <td style="padding: 15px; text-align: right; border-bottom: 1px solid #e2e8f0; color: #10b981; font-weight: 500;">-$${invoice.discount.toFixed(2)}</td>
                </tr>
                ` : ''}
                <tr style="background: #f8fafc; font-weight: 600;">
                  <td style="padding: 20px 15px; border-bottom: 2px solid #667eea;">Total Amount</td>
                  <td style="padding: 20px 15px; text-align: right; border-bottom: 2px solid #667eea; color: #667eea; font-size: 18px;">$${(invoice.amount - (invoice.discount || 0)).toFixed(2)}</td>
                </tr>
                <tr>
                  <td style="padding: 15px; color: #666;">Paid Amount</td>
                  <td style="padding: 15px; text-align: right; color: #10b981; font-weight: 500;">$${invoice.paidAmount.toFixed(2)}</td>
                </tr>
                <tr style="background: #fef2f2;">
                  <td style="padding: 20px 15px; border-bottom: 2px solid #ef4444; font-weight: 600; color: #374151;">Balance Due</td>
                  <td style="padding: 20px 15px; text-align: right; border-bottom: 2px solid #ef4444; color: #ef4444; font-size: 18px; font-weight: 700;">$${Math.max(0, (invoice.amount - invoice.paidAmount - (invoice.discount || 0))).toFixed(2)}</td>
                </tr>
              </tbody>
            </table>
          </div>

          <!-- Footer -->
          <div style="margin-top: 40px; padding-top: 20px; border-top: 2px solid #e2e8f0; text-align: center;">
            <p style="color: #666; font-size: 14px; margin-bottom: 10px;">Thank you for choosing ${academyName} for your Islamic education journey.</p>
            <p style="color: #666; font-size: 14px; margin-bottom: 10px;">May Allah bless your studies and grant you success in this world and hereafter.</p>
            <div style="display: flex; justify-content: center; gap: 30px; margin-top: 20px;">
              <div style="text-align: center;">
                <p style="color: #666; font-size: 12px; margin-bottom: 5px;">Email</p>
                <p style="color: #667eea; font-weight: 600;">${contactEmail}</p>
              </div>
              <div style="text-align: center;">
                <p style="color: #666; font-size: 12px; margin-bottom: 5px;">Phone</p>
                <p style="color: #667eea; font-weight: 600;">${contactPhone}</p>
              </div>
              ${address ? `
              <div style="text-align: center;">
                <p style="color: #666; font-size: 12px; margin-bottom: 5px;">Address</p>
                <p style="color: #667eea; font-weight: 600;">${address}</p>
              </div>
              ` : ''}
            </div>
            <p style="color: #999; font-size: 12px; margin-top: 30px; text-align: center;">
              Generated on ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })} at ${new Date().toLocaleTimeString()}
            </p>
          </div>
        </div>
      </div>
    `;

    // Create a temporary div to render the invoice
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = invoiceHTML;
    tempDiv.style.position = 'absolute';
    tempDiv.style.left = '-9999px';
    tempDiv.style.top = '-9999px';
    document.body.appendChild(tempDiv);

    try {
      // Convert to canvas and then to PDF
      const canvas = await html2canvas(tempDiv.querySelector('#invoice-content') as HTMLElement, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff',
        width: 800,
        height: 1200,
      });

      const imgData = canvas.toDataURL('image/png');
      
      // Create PDF
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
      });

      const imgWidth = 210;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      
      pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight);
      pdf.save(`Invoice_${invoice.studentName}_${invoice.month}.pdf`);

      toast.success('PDF invoice downloaded successfully');
    } catch (error) {
      console.error('Error generating PDF:', error);
      toast.error('Failed to generate PDF. Please try again.');
    } finally {
      // Clean up
      document.body.removeChild(tempDiv);
    }
  };

  return (
    <MainLayout title="Invoices & Payments" subtitle="Manage billing and payments">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <Card variant="stat" className="animate-slide-up">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Revenue</p>
                <p className="text-2xl font-bold text-success">${totalRevenue.toLocaleString()}</p>
              </div>
              <div className="h-10 w-10 rounded-lg bg-success/10 flex items-center justify-center">
                <DollarSign className="h-5 w-5 text-success" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card variant="stat" className="animate-slide-up">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Pending</p>
                <p className="text-2xl font-bold text-warning">${pendingAmount.toLocaleString()}</p>
              </div>
              <div className="h-10 w-10 rounded-lg bg-warning/10 flex items-center justify-center">
                <Clock className="h-5 w-5 text-warning" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card variant="stat" className="animate-slide-up">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Overdue</p>
                <p className="text-2xl font-bold text-destructive">{overdueCount}</p>
              </div>
              <div className="h-10 w-10 rounded-lg bg-destructive/10 flex items-center justify-center">
                <AlertCircle className="h-5 w-5 text-destructive" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card variant="stat" className="animate-slide-up">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Invoices</p>
                <p className="text-2xl font-bold">{invoices.length}</p>
              </div>
              <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Receipt className="h-5 w-5 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="animate-slide-up">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>All Invoices</CardTitle>
          {(currentUser?.role === 'admin' || currentUser?.role === 'sales_team') && (
            <Button className="gap-2" onClick={() => { setFormData(emptyInvoice); setIsAddOpen(true); }}>
              <Plus className="h-4 w-4" />
              Add Invoice
            </Button>
          )}
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Search invoices..." className="pl-9" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full md:w-[150px]"><SelectValue placeholder="Status" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="paid">Paid</SelectItem>
                <SelectItem value="unpaid">Unpaid</SelectItem>
                <SelectItem value="overdue">Overdue</SelectItem>
                <SelectItem value="partial">Partial</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="rounded-lg border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead>Invoice</TableHead>
                  <TableHead>Student</TableHead>
                  <TableHead>Month</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Paid</TableHead>
                  <TableHead>Due Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((invoice, index) => {
                  const config = statusConfig[invoice.status];
                  const StatusIcon = config.icon;
                  return (
                    <TableRow key={invoice.id || invoice._id || `invoice-${index}`} className="hover:bg-muted/30">
                      <TableCell><span className="font-mono text-sm font-medium">INV-{String(index + 1).padStart(4, '0')}</span></TableCell>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center">
                            <User className="h-4 w-4 text-primary" />
                          </div>
                          <p className="font-medium">{invoice.studentName}</p>
                        </div>
                      </TableCell>
                      <TableCell><Badge variant="outline">{invoice.month}</Badge></TableCell>
                      <TableCell className="font-medium">${invoice.amount}</TableCell>
                      <TableCell>
                        <span className={cn("font-medium", invoice.paidAmount === invoice.amount && "text-success", invoice.paidAmount === 0 && "text-muted-foreground", invoice.paidAmount > 0 && invoice.paidAmount < invoice.amount && "text-info")}>
                          ${invoice.paidAmount}
                        </span>
                      </TableCell>
                      <TableCell className="text-muted-foreground">{new Date(invoice.dueDate).toLocaleDateString()}</TableCell>
                      <TableCell>
                        <Badge variant={config.variant} className="gap-1"><StatusIcon className="h-3 w-3" />{config.label}</Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          {invoice.status !== 'paid' && (
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-success" onClick={() => handleMarkPaid(invoice)} title="Mark as Paid">
                              <CheckCircle className="h-4 w-4" />
                            </Button>
                          )}
                          <Button variant="ghost" size="icon" className="h-8 w-8" title="Download" onClick={() => handleDownload(invoice)}><Download className="h-4 w-4" /></Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => { setCurrent(invoice); setFormData(invoice); setIsEditOpen(true); }}><Pencil className="h-4 w-4" /></Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => { setCurrent(invoice); setIsDeleteOpen(true); }}><Trash2 className="h-4 w-4" /></Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Add Invoice Dialog */}
      <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Add New Invoice</DialogTitle></DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label>Student <span className="text-destructive">*</span></Label>
              <Select value={formData.studentName} onValueChange={handleStudentChange}>
                <SelectTrigger><SelectValue placeholder="Select student" /></SelectTrigger>
                <SelectContent>
                  {students.map((student) => (
                    <SelectItem key={(student as any)._id || student.id} value={student.name}>
                      {student.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Amount ($) <span className="text-destructive">*</span></Label>
                <Input 
                  type="number" 
                  min="0" 
                  step="0.01"
                  value={formData.amount} 
                  onChange={(e) => setFormData(prev => ({ ...prev, amount: parseFloat(e.target.value) || 0 }))} 
                  placeholder="100.00"
                />
              </div>
              <div className="space-y-2">
                <Label>Month <span className="text-destructive">*</span></Label>
                <Select value={formData.month} onValueChange={(v) => setFormData(prev => ({ ...prev, month: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {months.map((month) => (
                      <SelectItem key={month} value={month}>{month}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Due Date <span className="text-destructive">*</span></Label>
                <Input 
                  type="date" 
                  value={formData.dueDate} 
                  onChange={(e) => setFormData(prev => ({ ...prev, dueDate: e.target.value }))} 
                />
              </div>
              <div className="space-y-2">
                <Label>Status</Label>
                <Select value={formData.status} onValueChange={(v) => setFormData(prev => ({ ...prev, status: v as Invoice['status'] }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="unpaid">Unpaid</SelectItem>
                    <SelectItem value="paid">Paid</SelectItem>
                    <SelectItem value="partial">Partial</SelectItem>
                    <SelectItem value="overdue">Overdue</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Discount ($)</Label>
              <Input 
                type="number" 
                min="0" 
                step="0.01"
                value={formData.discount || 0} 
                onChange={(e) => setFormData(prev => ({ ...prev, discount: parseFloat(e.target.value) || 0 }))} 
                placeholder="0.00"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddOpen(false)}>Cancel</Button>
            <Button onClick={handleAdd}>Create Invoice</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Invoice Dialog */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Edit Invoice</DialogTitle></DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2"><Label>Student</Label><Input value={formData.studentName} readOnly className="bg-muted" /></div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2"><Label>Amount ($)</Label><Input type="number" min="0" value={formData.amount} onChange={(e) => setFormData(prev => ({ ...prev, amount: parseFloat(e.target.value) }))} /></div>
              <div className="space-y-2"><Label>Paid Amount ($)</Label><Input type="number" min="0" value={formData.paidAmount} onChange={(e) => setFormData(prev => ({ ...prev, paidAmount: parseFloat(e.target.value) }))} /></div>
            </div>
            <div className="space-y-2"><Label>Status</Label><Select value={formData.status} onValueChange={(v) => setFormData(prev => ({ ...prev, status: v as Invoice['status'] }))}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="unpaid">Unpaid</SelectItem><SelectItem value="paid">Paid</SelectItem><SelectItem value="partial">Partial</SelectItem><SelectItem value="overdue">Overdue</SelectItem></SelectContent></Select></div>
          </div>
          <DialogFooter><Button onClick={handleEdit}>Save Changes</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader><AlertDialogTitle>Delete Invoice</AlertDialogTitle><AlertDialogDescription>Are you sure you want to delete this invoice for {current?.studentName}?</AlertDialogDescription></AlertDialogHeader>
          <AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">Delete</AlertDialogAction></AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </MainLayout>
  );
}
