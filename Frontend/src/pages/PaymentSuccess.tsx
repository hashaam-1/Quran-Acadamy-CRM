import { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Loader2, Receipt, Home, ArrowRight } from "lucide-react";

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
        const API_BASE_URL = "https://quran-acadamy-crm-backend-production.up.railway.app/api";
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
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-50 via-white to-teal-50 p-4">
      <Card className="w-full max-w-lg shadow-2xl border-0">
        <CardContent className="p-8">
          {verifying ? (
            <div className="flex flex-col items-center justify-center py-12">
              <div className="relative">
                <Loader2 className="h-16 w-16 text-emerald-600 animate-spin" />
                <div className="absolute inset-0 h-16 w-16 rounded-full border-4 border-emerald-200 animate-pulse" />
              </div>
              <h2 className="mt-6 text-2xl font-semibold text-gray-900">Verifying Payment</h2>
              <p className="mt-2 text-gray-600">Please wait while we confirm your transaction...</p>
            </div>
          ) : success ? (
            <div className="flex flex-col items-center text-center py-8">
              <div className="relative mb-6">
                <div className="h-24 w-24 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center shadow-lg">
                  <CheckCircle2 className="h-14 w-14 text-white" />
                </div>
                <div className="absolute -top-2 -right-2 h-8 w-8 rounded-full bg-yellow-400 flex items-center justify-center shadow-md">
                  <span className="text-lg">✨</span>
                </div>
              </div>
              
              <h2 className="text-3xl font-bold text-gray-900 mb-2">Payment Successful!</h2>
              <p className="text-gray-600 mb-6 max-w-sm">{message}</p>
              
              <div className="w-full bg-gradient-to-r from-emerald-50 to-teal-50 rounded-xl p-4 mb-6">
                <div className="flex items-center gap-3 text-emerald-700">
                  <Receipt className="h-5 w-5" />
                  <span className="font-medium">Invoice Updated</span>
                </div>
                <p className="text-sm text-gray-600 mt-1">Your payment has been processed and your invoice status has been updated.</p>
              </div>
              
              <div className="flex flex-col sm:flex-row gap-3 w-full">
                <Button 
                  onClick={() => navigate("/invoices")} 
                  className="flex-1 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white shadow-lg"
                >
                  <Receipt className="h-4 w-4 mr-2" />
                  View Invoices
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
                <Button 
                  onClick={() => navigate("/")} 
                  variant="outline" 
                  className="flex-1 border-2 border-emerald-200 text-emerald-700 hover:bg-emerald-50"
                >
                  <Home className="h-4 w-4 mr-2" />
                  Dashboard
                </Button>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center text-center py-8">
              <div className="h-20 w-20 rounded-full bg-red-100 flex items-center justify-center mb-6">
                <CheckCircle2 className="h-12 w-12 text-red-600" />
              </div>
              <h2 className="text-2xl font-semibold text-gray-900 mb-2">Payment Failed</h2>
              <p className="text-gray-600 mb-6 max-w-sm">{message}</p>
              <Button 
                onClick={() => navigate("/invoices")} 
                variant="outline"
                className="w-full"
              >
                Return to Invoices
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
