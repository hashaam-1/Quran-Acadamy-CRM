import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuthStore } from "@/lib/auth-store";
import { toast } from "sonner";
import { BookOpen, Eye, EyeOff, Mail, Lock } from "lucide-react";


export default function Auth() {
  const navigate = useNavigate();
  const { login, loginWithBackend } = useAuthStore();
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginEmail || !loginPassword) {
      toast.error('Please fill in all fields');
      return;
    }
    
    setIsLoading(true);
    await new Promise(resolve => setTimeout(resolve, 800));
    
    // Try backend authentication first
    const result = await loginWithBackend(loginEmail, loginPassword);
    setIsLoading(false);
    
    if (result.success) {
      toast.success('Welcome back!');
      navigate('/');
    } else {
      toast.error(result.error || 'Login failed');
    }
  };


  return (
    <div className="min-h-screen flex items-center justify-center bg-background islamic-pattern p-4">
      <div className="w-full max-w-[480px] animate-slide-up">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center h-16 w-16 rounded-2xl gradient-primary mb-4">
            <BookOpen className="h-8 w-8 text-primary-foreground" />
          </div>
          <h1 className="text-2xl font-bold font-display text-foreground">
            Quran Academy CRM
          </h1>
          <p className="text-muted-foreground mt-1">
            Online Learning Management System
          </p>
        </div>

        <Card className="border-border/50 shadow-medium">
          <CardHeader>
            <h2 className="text-xl font-semibold text-center">Sign In to Your Account</h2>
            <p className="text-sm text-muted-foreground text-center">
              Enter your credentials to access the system
            </p>
          </CardHeader>
            
            <CardContent>
                <form onSubmit={handleLogin} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="login-email">Email</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="login-email"
                        type="email"
                        placeholder="Enter your email"
                        value={loginEmail}
                        onChange={(e) => setLoginEmail(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="login-password">Password</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="login-password"
                        type={showPassword ? "text" : "password"}
                        placeholder="Enter your password"
                        value={loginPassword}
                        onChange={(e) => setLoginPassword(e.target.value)}
                        className="pl-10 pr-10"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 p-0"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                    </div>
                  </div>

                  <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading ? 'Signing in...' : 'Sign In'}
                  </Button>
                </form>

                <div className="mt-6 p-4 rounded-lg bg-muted/50 border border-border/50">
                  <p className="text-xs font-medium text-muted-foreground mb-3">Admin Credentials:</p>
                  <div className="space-y-2 text-xs">
                    <button
                      type="button"
                      className="w-full text-left p-2 rounded hover:bg-muted transition-colors flex justify-between"
                      onClick={() => {
                        setLoginEmail('hashaamamz1@gmail.com');
                        setLoginPassword('hashaam@123');
                      }}
                    >
                      <span className="text-foreground">Admin</span>
                      <span className="text-muted-foreground">hashaamamz1@gmail.com</span>
                    </button>
                  </div>
                  <p className="text-xs text-muted-foreground mt-3 text-center">
                    Other users will be created by the admin
                  </p>
                </div>
            </CardContent>
        </Card>

        <p className="text-center text-xs text-muted-foreground mt-6">
          © 2024 Quran Academy. All rights reserved.
        </p>
      </div>
    </div>
  );
}
