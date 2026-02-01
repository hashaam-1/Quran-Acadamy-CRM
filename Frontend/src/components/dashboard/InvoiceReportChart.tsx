import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { Receipt } from "lucide-react";

interface InvoiceReportChartProps {
  invoices: any[];
}

export function InvoiceReportChart({ invoices }: InvoiceReportChartProps) {

  // Calculate invoice statistics
  const totalInvoices = invoices.length;
  const paidInvoices = invoices.filter(i => i.status === 'paid').length;
  const unpaidInvoices = invoices.filter(i => i.status === 'unpaid' || i.status === 'overdue').length;
  const partialInvoices = invoices.filter(i => i.status === 'partial').length;
  
  const totalRecovery = invoices.reduce((sum, i) => sum + i.paidAmount, 0);
  const estimatedRecovery = invoices.reduce((sum, i) => sum + (i.estimatedAmount || i.amount), 0);
  const pendingRecovery = estimatedRecovery - totalRecovery;

  const data = [
    {
      name: "Invoice Count",
      actual: totalInvoices,
      estimated: totalInvoices + 3, // Future estimate
    },
    {
      name: "Paid",
      actual: paidInvoices,
      estimated: totalInvoices,
    },
    {
      name: "Unpaid",
      actual: unpaidInvoices,
      estimated: 0,
    },
    {
      name: "Partial",
      actual: partialInvoices,
      estimated: 0,
    },
  ];

  const recoveryData = [
    {
      name: "Recovery",
      actual: totalRecovery,
      estimated: estimatedRecovery,
    },
    {
      name: "Pending",
      actual: pendingRecovery,
      estimated: 0,
    },
  ];

  return (
    <Card className="gradient-card shadow-soft">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-lg">
          <div className="h-8 w-8 rounded-lg bg-info/10 flex items-center justify-center">
            <Receipt className="h-4 w-4 text-info" />
          </div>
          Invoice Report
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
          <div className="text-center p-3 rounded-lg bg-muted/50">
            <p className="text-2xl font-bold text-foreground">{totalInvoices}</p>
            <p className="text-xs text-muted-foreground">Total Invoices</p>
          </div>
          <div className="text-center p-3 rounded-lg bg-success/10">
            <p className="text-2xl font-bold text-success">${totalRecovery}</p>
            <p className="text-xs text-muted-foreground">Recovery</p>
          </div>
          <div className="text-center p-3 rounded-lg bg-accent/10">
            <p className="text-2xl font-bold text-accent">${estimatedRecovery}</p>
            <p className="text-xs text-muted-foreground">Estimated</p>
          </div>
          <div className="text-center p-3 rounded-lg bg-warning/10">
            <p className="text-2xl font-bold text-warning">${pendingRecovery}</p>
            <p className="text-xs text-muted-foreground">Pending</p>
          </div>
        </div>
        <div className="h-[200px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis 
                dataKey="name" 
                tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
                axisLine={{ stroke: 'hsl(var(--border))' }}
              />
              <YAxis 
                tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
                axisLine={{ stroke: 'hsl(var(--border))' }}
              />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'hsl(var(--card))', 
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px',
                  fontSize: '12px'
                }}
              />
              <Legend wrapperStyle={{ fontSize: '12px' }} />
              <Bar dataKey="actual" name="Actual" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
              <Bar dataKey="estimated" name="Estimated" fill="hsl(var(--accent))" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
