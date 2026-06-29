import { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Loader2 } from "lucide-react";

export default function PaymentSuccess() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [verifying, setVerifying] = useState(true);
  const [success, setSuccess] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    const verifyPayment = async () => {
      const resultIndicator = searchParams.get("resultIndicator");
      const sessionDataStr = localStorage.getItem('paymentSession');
      const sessionData = sessionDataStr ? JSON.parse(sessionDataStr) : null;
      const { orderId, invoiceId, successIndicator } = sessionData || {};

      if (!resultIndicator || !orderId || !invoiceId || !successIndicator) {
        setMessage("Invalid payment response. Missing required parameters.");
        setVerifying(false);
        return;
      }

      try {
        const API_BASE_URL = "https://quran-academy-crm-backend-production.up.railway.app/api";
        const response = await fetch(`${API_BASE_URL}/payments/verify`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ resultIndicator, orderId, invoiceId, successIndicator })
        });
        const data = await response.json();

        if (data.success) {
          setSuccess(true);
          setMessage("Payment successful! Your invoice has been updated.");
          localStorage.removeItem('paymentSession');
        } else {
          setSuccess(false);
          setMessage(data.message || "Payment verification failed.");
        }
      } catch (error) {
        setSuccess(false);
        setMessage("An error occurred while verifying your payment.");
      } finally {
        setVerifying(false);
      }
    };

    verifyPayment();
  }, [searchParams]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {verifying ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : success ? (
              <CheckCircle2 className="h-5 w-5 text-green-600" />
            ) : (
              <CheckCircle2 className="h-5 w-5 text-red-600" />
            )}
            Payment Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          {verifying ? (
            <p className="text-center">Verifying your payment...</p>
          ) : (
            <>
              <p className="text-center mb-4">{message}</p>
              <div className="flex gap-3">
                <Button onClick={() => navigate("/invoices")} className="flex-1">
                  View Invoices
                </Button>
                <Button onClick={() => navigate("/")} variant="outline" className="flex-1">
                  Dashboard
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
