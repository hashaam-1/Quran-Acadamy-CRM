import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Phone, MessageSquare, Clock, User, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface Lead {
  id: string;
  name: string;
  phone: string;
  course: string;
  status: "new" | "trial" | "regular" | "pending" | "closed";
  assignedTo: string;
  createdAt: string;
}

const mockLeads: Lead[] = [
  { id: "1", name: "Ahmed Hassan", phone: "+92******321", course: "Hifz", status: "new", assignedTo: "Fatima", createdAt: "2 hours ago" },
  { id: "2", name: "Sara Khan", phone: "+44******890", course: "Tajweed", status: "trial", assignedTo: "Omar", createdAt: "1 day ago" },
  { id: "3", name: "Mohammed Ali", phone: "+1******456", course: "Nazra", status: "regular", assignedTo: "Aisha", createdAt: "3 days ago" },
  { id: "4", name: "Yusuf Ibrahim", phone: "+971******123", course: "Qaida", status: "pending", assignedTo: "Fatima", createdAt: "5 days ago" },
];

const statusConfig = {
  new: { label: "New Lead", variant: "new" as const, color: "border-l-info" },
  trial: { label: "Trial Booked", variant: "trial" as const, color: "border-l-accent" },
  regular: { label: "Regular", variant: "regular" as const, color: "border-l-success" },
  pending: { label: "Fee Pending", variant: "pending" as const, color: "border-l-warning" },
  closed: { label: "Closed", variant: "closed" as const, color: "border-l-muted-foreground" },
};

export function LeadsPipeline() {
  return (
    <Card className="animate-slide-up stagger-2">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-lg font-semibold">Recent Leads</CardTitle>
        <Button variant="ghost" size="sm" className="text-primary">
          View All <ChevronRight className="h-4 w-4 ml-1" />
        </Button>
      </CardHeader>
      <CardContent className="space-y-3">
        {mockLeads.map((lead) => (
          <div
            key={lead.id}
            className={cn(
              "p-4 rounded-lg bg-muted/50 border-l-4 hover:bg-muted transition-colors cursor-pointer",
              statusConfig[lead.status].color
            )}
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-start gap-3 min-w-0">
                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                  <User className="h-5 w-5 text-primary" />
                </div>
                <div className="min-w-0">
                  <p className="font-medium text-foreground truncate">{lead.name}</p>
                  <p className="text-sm text-muted-foreground">{lead.course}</p>
                  <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                    <Clock className="h-3 w-3" />
                    <span>{lead.createdAt}</span>
                  </div>
                </div>
              </div>
              <div className="flex flex-col items-end gap-2 shrink-0">
                <Badge variant={statusConfig[lead.status].variant}>
                  {statusConfig[lead.status].label}
                </Badge>
                <div className="flex items-center gap-1">
                  <Button variant="ghost" size="icon" className="h-7 w-7">
                    <Phone className="h-3.5 w-3.5" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-7 w-7 text-success">
                    <MessageSquare className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
