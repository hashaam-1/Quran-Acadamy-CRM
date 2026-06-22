import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CreditCard, Lock, Shield, CheckCircle2 } from "lucide-react";
import {
  VisuallyHidden,
} from "@radix-ui/react-visually-hidden";

interface PaymentFormProps {
  invoiceId: string;
  amount: number;
  currency: string;
  onSuccess: () => void;
  onCancel: () => void;
}

export function PaymentForm({ invoiceId, amount, currency, onSuccess, onCancel }: PaymentFormProps) {
  const [loading, setLoading] = useState(false);
  const [sessionData, setSessionData] = useState<any>(null);

  useEffect(() => {
    const script = document.createElement('script');
    script.src = 'https://test-mcbpk.mtf.gateway.mastercard.com/static/checkout/checkout.min.js';
    script.async = true;
    document.body.appendChild(script);
    return () => {
      document.body.removeChild(script);
    };
  }, []);

  const handlePay = async () => {
    setLoading(true);
    try {
      const API_BASE_URL = "https://quran-acadamy-crm-backend-production.up.railway.app/api";
      const response = await fetch(`${API_BASE_URL}/payments/create-session`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ invoiceId, amount, currency })
      });
      const data = await response.json();
      setSessionData(data);
      
      if (data.success) {
        localStorage.setItem('paymentSession', JSON.stringify({
          orderId: data.orderId,
          invoiceId: data.invoiceId,
          successIndicator: data.successIndicator
        }));
        
        (window as any).Checkout.configure({
          session: { id: data.sessionId }
        });
        (window as any).Checkout.showPaymentPage();
      }
    } catch (error) {
      alert('Failed to create payment session');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CreditCard className="h-5 w-5" />
          Payment Details
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="mb-4 p-3 bg-muted rounded-lg">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Amount:</span>
            <span className="font-semibold">{currency} {amount}</span>
          </div>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" onClick={onCancel} disabled={loading}>
            Cancel
          </Button>
          <Button onClick={handlePay} disabled={loading} className="flex-1">
            {loading ? 'Processing...' : `Pay ${currency} ${amount}`}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
