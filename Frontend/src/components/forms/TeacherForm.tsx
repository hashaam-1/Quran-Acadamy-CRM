import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Teacher } from "@/lib/store";

interface TeacherFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (teacher: Omit<Teacher, 'id'>) => void;
  initialData?: Teacher;
  mode: 'add' | 'edit';
}

const titleOptions = ['Ustaz', 'Ustaza', 'Hafiz', 'Hafiza', 'Qari', 'Qaria', 'Sheikh', 'Sheikha'];
const specializations = ['Qaida', 'Nazra', 'Hifz', 'Tajweed'];
const statusOptions = [
  { value: 'available', label: 'Available' },
  { value: 'in_class', label: 'In Class' },
  { value: 'on_leave', label: 'On Leave' },
];

export function TeacherForm({ open, onOpenChange, onSubmit, initialData, mode }: TeacherFormProps) {
  const [formData, setFormData] = useState({
    name: '',
    title: 'Ustaz',
    phone: '',
    email: '',
    specialization: ['Qaida'] as string[],
    students: 0,
    rating: 5.0,
    classesToday: 0,
    classesCompleted: 0,
    status: 'available' as Teacher['status'],
    joinedAt: new Date().toISOString().split('T')[0],
    performance: 90,
  });

  useEffect(() => {
    if (initialData && mode === 'edit') {
      setFormData({
        name: initialData.name,
        title: initialData.title,
        phone: initialData.phone,
        email: initialData.email,
        specialization: initialData.specialization,
        students: initialData.students,
        rating: initialData.rating,
        classesToday: initialData.classesToday,
        classesCompleted: initialData.classesCompleted,
        status: initialData.status,
        joinedAt: initialData.joinedAt,
        performance: initialData.performance,
      });
    } else {
      setFormData({
        name: '',
        title: 'Ustaz',
        phone: '',
        email: '',
        specialization: ['Qaida'],
        students: 0,
        rating: 5.0,
        classesToday: 0,
        classesCompleted: 0,
        status: 'available',
        joinedAt: new Date().toISOString().split('T')[0],
        performance: 90,
      });
    }
  }, [initialData, mode, open]);

  const handleSpecializationChange = (spec: string, checked: boolean) => {
    if (checked) {
      setFormData({ ...formData, specialization: [...formData.specialization, spec] });
    } else {
      setFormData({ ...formData, specialization: formData.specialization.filter(s => s !== spec) });
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{mode === 'add' ? 'Add New Teacher' : 'Edit Teacher'}</DialogTitle>
          <DialogDescription>
            {mode === 'add' ? 'Register a new teacher' : 'Update teacher information'}
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Title</Label>
              <Select value={formData.title} onValueChange={(v) => setFormData({ ...formData, title: v })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {titleOptions.map((title) => (
                    <SelectItem key={title} value={title}>{title}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="name">Full Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Enter full name"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email *</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="Enter email address"
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="phone">Phone Number *</Label>
              <Input
                id="phone"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="+92 300 1234567"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Specializations</Label>
            <div className="grid grid-cols-4 gap-4 p-4 border rounded-lg">
              {specializations.map((spec) => (
                <div key={spec} className="flex items-center space-x-2">
                  <Checkbox
                    id={`spec-${spec}`}
                    checked={formData.specialization.includes(spec)}
                    onCheckedChange={(checked) => handleSpecializationChange(spec, checked as boolean)}
                  />
                  <label htmlFor={`spec-${spec}`} className="text-sm font-medium">
                    {spec}
                  </label>
                </div>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Status</Label>
              <Select value={formData.status} onValueChange={(v) => setFormData({ ...formData, status: v as Teacher['status'] })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {statusOptions.map((status) => (
                    <SelectItem key={status.value} value={status.value}>{status.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="joinedAt">Joining Date</Label>
              <Input
                id="joinedAt"
                type="date"
                value={formData.joinedAt}
                onChange={(e) => setFormData({ ...formData, joinedAt: e.target.value })}
              />
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit">
              {mode === 'add' ? 'Add Teacher' : 'Save Changes'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
