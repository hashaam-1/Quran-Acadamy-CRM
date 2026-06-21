import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
  console.log("ENV CHECK:", import.meta.env);
  console.log("VITE_API_URL:", import.meta.env.VITE_API_URL);
  
  const [cardHolderName, setCardHolderName] = useState("");
  const [cardNumber, setCardNumber] = useState("");
  const [cardExpiry, setCardExpiry] = useState("");
  const [cardCvc, setCardCvc] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      console.log("VITE_API_URL =", import.meta.env.VITE_API_URL);
      // Temporarily hardcoded for testing (correct spelling: acadamy)
      const API_BASE_URL = "https://quran-acadamy-crm-backend-production.up.railway.app/api";

      console.log("API_BASE_URL =", API_BASE_URL);
      console.log("Calling:", `${API_BASE_URL}/payments/create-session`);

      console.log('🔍 Creating payment session...');
      const sessionResponse = await fetch(`${API_BASE_URL}/payments/create-session`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ invoiceId, amount, currency })
      });
      
      const sessionText = await sessionResponse.text();
      console.log('🔍 Session Response:', sessionText.substring(0, 200));
      
      let sessionData;
      try {
        sessionData = JSON.parse(sessionText);
      } catch {
        throw new Error('Invalid response from server. Please check backend logs.');
      }

      if (!sessionData.success) throw new Error(sessionData.message || 'Failed to create payment session');

      console.log('🔍 Processing payment...');
      const paymentResponse = await fetch(`${API_BASE_URL}/payments/process`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: sessionData.sessionId,
          orderId: sessionData.orderId,
          cardNumber,
          cardExpiry,
          cardCvc,
          cardHolderName
        })
      });
      const paymentData = await paymentResponse.json();

      if (paymentData.success) {
        onSuccess();
      } else {
        alert('Payment failed: ' + paymentData.message);
      }
    } catch (error) {
      alert('Payment error: ' + (error as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <VisuallyHidden>
          <CardTitle>Payment Details</CardTitle>
        </VisuallyHidden>
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

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Cardholder Name</Label>
            <Input
              value={cardHolderName}
              onChange={(e) => setCardHolderName(e.target.value)}
              placeholder="John Doe"
              required
            />
          </div>

          <div className="space-y-2">
            <Label>Card Number</Label>
            <Input
              value={cardNumber}
              onChange={(e) => setCardNumber(e.target.value.replace(/\s/g, '').replace(/(\d{4})/g, '$1 ').trim())}
              placeholder="1234 5678 9012 3456"
              maxLength={19}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Expiry Date</Label>
              <Input
                value={cardExpiry}
                onChange={(e) => setCardExpiry(e.target.value.replace(/(\d{2})(\d{2})/, '$1/$2'))}
                placeholder="MM/YY"
                maxLength={5}
                required
              />
            </div>
            <div className="space-y-2">
              <Label>CVC</Label>
              <Input
                value={cardCvc}
                onChange={(e) => setCardCvc(e.target.value)}
                placeholder="123"
                maxLength={4}
                required
              />
            </div>
          </div>

          <div className="flex gap-3">
            <Button type="button" variant="outline" onClick={onCancel} disabled={loading}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading} className="flex-1">
              {loading ? 'Processing...' : `Pay ${currency} ${amount}`}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
