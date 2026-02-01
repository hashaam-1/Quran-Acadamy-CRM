import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { BookOpen, Calendar, CheckCircle2, Clock } from "lucide-react";

interface ViewHomeworkDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const mockHomework = [
  { id: '1', title: 'Memorize Surah Al-Fatiha', dueDate: '2026-01-08', status: 'pending', description: 'Practice recitation with proper tajweed rules' },
  { id: '2', title: 'Complete Qaida Lesson 5', dueDate: '2026-01-07', status: 'completed', description: 'Review all letters from Lesson 5' },
  { id: '3', title: 'Practice Tajweed Rules', dueDate: '2026-01-10', status: 'pending', description: 'Focus on Noon Sakinah and Tanween rules' },
  { id: '4', title: 'Revision - Surah Al-Ikhlas', dueDate: '2026-01-05', status: 'overdue', description: 'Memorize with meaning' },
];

export function ViewHomeworkDialog({ open, onOpenChange }: ViewHomeworkDialogProps) {
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge className="bg-success/10 text-success border-success/20">Completed</Badge>;
      case 'overdue':
        return <Badge className="bg-destructive/10 text-destructive border-destructive/20">Overdue</Badge>;
      default:
        return <Badge className="bg-warning/10 text-warning border-warning/20">Pending</Badge>;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-accent/10 flex items-center justify-center">
              <BookOpen className="h-4 w-4 text-accent" />
            </div>
            My Homework
          </DialogTitle>
          <DialogDescription>View your assigned homework and track your progress</DialogDescription>
        </DialogHeader>
        
        <ScrollArea className="flex-1 pr-4 -mr-4">
          <div className="space-y-3">
            {mockHomework.map((hw) => (
              <div 
                key={hw.id} 
                className={`p-4 rounded-xl border transition-all hover:shadow-md ${
                  hw.status === 'completed' 
                    ? 'bg-success/5 border-success/20' 
                    : hw.status === 'overdue'
                    ? 'bg-destructive/5 border-destructive/20'
                    : 'bg-card border-border'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      {hw.status === 'completed' ? (
                        <CheckCircle2 className="h-4 w-4 text-success flex-shrink-0" />
                      ) : (
                        <Clock className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                      )}
                      <h4 className="font-medium text-foreground truncate">{hw.title}</h4>
                    </div>
                    <p className="text-sm text-muted-foreground line-clamp-2 ml-6">{hw.description}</p>
                  </div>
                  {getStatusBadge(hw.status)}
                </div>
                <div className="flex items-center gap-1.5 mt-3 ml-6 text-xs text-muted-foreground">
                  <Calendar className="h-3.5 w-3.5" />
                  <span>Due: {new Date(hw.dueDate).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}</span>
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
