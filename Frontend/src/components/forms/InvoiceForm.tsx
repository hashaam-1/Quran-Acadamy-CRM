import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useStudents } from "@/hooks/useStudents";
import { Invoice } from "@/lib/store";

interface InvoiceFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (invoice: Omit<Invoice, 'id'>) => void;
  initialData?: Invoice;
  mode: 'add' | 'edit';
}

const statusOptions = [
  { value: 'unpaid', label: 'Unpaid' },
  { value: 'paid', label: 'Paid' },
  { value: 'partial', label: 'Partial' },
  { value: 'overdue', label: 'Overdue' },
];

export function InvoiceForm({ open, onOpenChange, onSubmit, initialData, mode }: InvoiceFormProps) {
  const { data: students = [], isLoading: studentsLoading } = useStudents();
  
  const [formData, setFormData] = useState({
    studentName: '',
    studentId: '',
    amount: 100,
    month: new Date().toLocaleString('default', { month: 'long', year: 'numeric' }),
    status: 'unpaid' as Invoice['status'],
    dueDate: new Date().toISOString().split('T')[0],
    paidAmount: 0,
    discount: 0,
  });

  useEffect(() => {
    if (initialData && mode === 'edit') {
      setFormData({
        studentName: initialData.studentName,
        studentId: initialData.studentId,
        amount: initialData.amount,
        month: initialData.month,
        status: initialData.status,
        dueDate: initialData.dueDate,
        paidAmount: initialData.paidAmount,
        discount: initialData.discount || 0,
      });
    } else {
      setFormData({
        studentName: '',
        studentId: '',
        amount: 100,
        month: new Date().toLocaleString('default', { month: 'long', year: 'numeric' }),
        status: 'unpaid',
        dueDate: new Date().toISOString().split('T')[0],
        paidAmount: 0,
        discount: 0,
      });
    }
  }, [initialData, mode, open]);

  const handleStudentChange = (studentId: string) => {
    const student = students.find(s => s.id === studentId);
    if (student) {
      setFormData({ ...formData, studentId, studentName: student.name, amount: student.feeAmount || 100 });
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>{mode === 'add' ? 'Create Invoice' : 'Edit Invoice'}</DialogTitle>
          <DialogDescription>
            {mode === 'add' ? 'Generate a new invoice' : 'Update invoice details'}
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="flex-1 overflow-auto space-y-4 pr-1">
          <div className="space-y-2">
            <Label>Student</Label>
            <Select value={formData.studentName} onValueChange={(value) => setFormData({ ...formData, studentName: value })} disabled={studentsLoading}>
              <SelectTrigger><SelectValue placeholder={studentsLoading ? "Loading students..." : "Select student"} /></SelectTrigger>
              <SelectContent>
                {students.length === 0 ? (
                  <div className="p-2 text-sm text-muted-foreground text-center">No students found</div>
                ) : (
                  students.map((student) => (
                    <SelectItem key={student.id || student._id} value={student.name}>{student.name}</SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="amount">Amount ($)</Label>
              <Input id="amount" type="number" value={formData.amount} onChange={(e) => setFormData({ ...formData, amount: parseInt(e.target.value) })} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="discount">Discount ($)</Label>
              <Input id="discount" type="number" value={formData.discount} onChange={(e) => setFormData({ ...formData, discount: parseInt(e.target.value) })} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="month">Month</Label>
              <Input id="month" value={formData.month} onChange={(e) => setFormData({ ...formData, month: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="dueDate">Due Date</Label>
              <Input id="dueDate" type="date" value={formData.dueDate} onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Status</Label>
              <Select value={formData.status} onValueChange={(value: Invoice['status']) => setFormData({ ...formData, status: value })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {statusOptions.map((status) => (
                    <SelectItem key={status.value} value={status.value}>{status.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="paidAmount">Paid Amount ($)</Label>
              <Input id="paidAmount" type="number" value={formData.paidAmount} onChange={(e) => setFormData({ ...formData, paidAmount: parseInt(e.target.value) })} />
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit">{mode === 'add' ? 'Create Invoice' : 'Save Changes'}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
