import { MainLayout } from "@/components/layout/MainLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  User,
  Users,
  Bell,
  Shield,
  MessageSquare,
  CreditCard,
  Settings as SettingsIcon,
  Key,
  Eye,
  EyeOff,
  Trash2,
  Check,
  RotateCcw,
} from "lucide-react";
import { CreateUserDialog } from "@/components/admin/CreateUserDialog";
import { useAuthStore } from "@/lib/auth-store";
import { useTeamMembers } from "@/hooks/useTeamMembers";
import { useTeachers } from "@/hooks/useTeachers";
import { useSettings, useUpdateSettings, useResetSettings } from "@/hooks/useSettings";
import { useState, useEffect } from "react";

interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: "admin" | "account_manager" | "team_leader" | "teacher";
  status: "active" | "inactive";
  masking: "full" | "partial" | "hidden";
}

const mockTeam: TeamMember[] = [
  { id: "1", name: "Admin User", email: "admin@quranacademy.com", role: "admin", status: "active", masking: "full" },
  { id: "2", name: "Fatima Ahmed", email: "fatima@quranacademy.com", role: "account_manager", status: "active", masking: "partial" },
  { id: "3", name: "Omar Khan", email: "omar@quranacademy.com", role: "team_leader", status: "active", masking: "partial" },
  { id: "4", name: "Ustaz Bilal", email: "bilal@quranacademy.com", role: "teacher", status: "active", masking: "hidden" },
];

const roleConfig = {
  admin: { label: "Admin", variant: "default" as const },
  account_manager: { label: "Account Manager", variant: "secondary" as const },
  team_leader: { label: "Team Leader", variant: "accent" as const },
  teacher: { label: "Teacher", variant: "outline" as const },
};

const maskingConfig = {
  full: { label: "Full Access", icon: Eye },
  partial: { label: "Partial (Masked)", icon: EyeOff },
  hidden: { label: "Hidden", icon: EyeOff },
};

export default function Settings() {
  const { currentUser } = useAuthStore();
  const isAdmin = currentUser?.role === 'admin';
  const { data: teamMembers = [], isLoading: teamLoading } = useTeamMembers();
  const { data: teachers = [], isLoading: teacherLoading } = useTeachers();
  const { data: settings = {}, isLoading: settingsLoading } = useSettings();
  const updateSettingsMutation = useUpdateSettings();
  const resetSettingsMutation = useResetSettings();
  
  const [formData, setFormData] = useState({
    academyName: '',
    contactEmail: '',
    contactPhone: '',
    address: '',
    timezone: 'UTC',
    currency: 'USD',
    invoicePrefix: 'INV-2024-',
    autoGenerateInvoices: true,
    sendInvoiceWhatsApp: true,
    whatsappPhoneId: '',
    whatsappBusinessId: '',
    whatsappAccessToken: '',
    passwordMinLength: 8,
    requireUppercase: true,
    requireNumber: true,
    requireSpecialChar: false,
    encryptPhoneNumbers: true,
    disableDataExport: true,
    sessionTimeout: '30',
    dailyClassReminder: true,
    teacherAbsenceAlert: true,
    feeDueReminder: true,
    overduePaymentAlert: true,
    trialFollowup: true,
    inactiveStudentReactivation: true,
  });

  // Update form data when settings are loaded
  useEffect(() => {
    if (settings && Object.keys(settings).length > 0) {
      setFormData(prev => ({ ...prev, ...settings }));
    }
  }, [settings]);

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSaveSettings = () => {
    updateSettingsMutation.mutate(formData);
  };

  const handleResetSettings = () => {
    if (confirm('Are you sure you want to reset all settings to defaults? This action cannot be undone.')) {
      resetSettingsMutation.mutate();
    }
  };

  if (teamLoading || teacherLoading || settingsLoading) {
    return (
      <MainLayout title="Settings" subtitle="Loading...">
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading settings...</p>
          </div>
        </div>
      </MainLayout>
    );
  }
  
  const allTeam = [
    ...teamMembers.map(tm => ({
      id: (tm as any)._id || tm.id,
      name: tm.name,
      email: tm.email,
      role: tm.role,
      status: tm.status,
      masking: tm.masking || 'partial', // Add default masking
    })),
    ...teachers.map(t => ({
      id: (t as any)._id || t.id,
      name: t.name,
      email: t.email,
      role: 'teacher',
      status: t.status,
      masking: 'hidden', // Teachers have hidden masking by default
    })),
  ];

  return (
    <MainLayout title="Settings" subtitle="Manage your academy settings">
      <Tabs defaultValue="general" className="animate-slide-up">
        <TabsList className="mb-6">
          <TabsTrigger value="general" className="gap-2">
            <SettingsIcon className="h-4 w-4" />
            General
          </TabsTrigger>
          <TabsTrigger value="users" className="gap-2">
            <Users className="h-4 w-4" />
            User Management
          </TabsTrigger>
          <TabsTrigger value="notifications" className="gap-2">
            <Bell className="h-4 w-4" />
            Notifications
          </TabsTrigger>
          <TabsTrigger value="whatsapp" className="gap-2">
            <MessageSquare className="h-4 w-4" />
            WhatsApp
          </TabsTrigger>
          <TabsTrigger value="security" className="gap-2">
            <Shield className="h-4 w-4" />
            Security
          </TabsTrigger>
        </TabsList>

        <TabsContent value="general">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Academy Information</CardTitle>
                <CardDescription>Basic details about your academy</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="academy-name">Academy Name</Label>
                  <Input 
                    id="academy-name" 
                    value={formData.academyName}
                    onChange={(e) => handleInputChange('academyName', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Contact Email</Label>
                  <Input 
                    id="email" 
                    type="email" 
                    value={formData.contactEmail}
                    onChange={(e) => handleInputChange('contactEmail', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Contact Phone</Label>
                  <Input 
                    id="phone" 
                    value={formData.contactPhone}
                    onChange={(e) => handleInputChange('contactPhone', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="address">Address</Label>
                  <Input 
                    id="address" 
                    value={formData.address}
                    onChange={(e) => handleInputChange('address', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="timezone">Default Timezone</Label>
                  <Select value={formData.timezone} onValueChange={(value) => handleInputChange('timezone', value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="UTC">UTC (Coordinated Universal Time)</SelectItem>
                      <SelectItem value="EST">EST (Eastern Standard Time)</SelectItem>
                      <SelectItem value="PST">PST (Pacific Standard Time)</SelectItem>
                      <SelectItem value="GMT">GMT (Greenwich Mean Time)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button className="w-full" onClick={handleSaveSettings} disabled={updateSettingsMutation.isPending}>
                  {updateSettingsMutation.isPending ? 'Saving...' : 'Save Changes'}
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Billing Settings</CardTitle>
                <CardDescription>Manage payment and invoicing</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="currency">Default Currency</Label>
                  <Select value={formData.currency} onValueChange={(value) => handleInputChange('currency', value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="USD">USD ($)</SelectItem>
                      <SelectItem value="GBP">GBP (£)</SelectItem>
                      <SelectItem value="EUR">EUR (€)</SelectItem>
                      <SelectItem value="AED">AED (د.إ)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="invoice-prefix">Invoice Prefix</Label>
                  <Input 
                    id="invoice-prefix" 
                    value={formData.invoicePrefix}
                    onChange={(e) => handleInputChange('invoicePrefix', e.target.value)}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Auto-generate Invoices</Label>
                    <p className="text-sm text-muted-foreground">Generate monthly invoices automatically</p>
                  </div>
                  <Switch 
                    checked={formData.autoGenerateInvoices}
                    onCheckedChange={(checked) => handleInputChange('autoGenerateInvoices', checked)}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Send Invoice via WhatsApp</Label>
                    <p className="text-sm text-muted-foreground">Auto-send invoices to parents</p>
                  </div>
                  <Switch 
                    checked={formData.sendInvoiceWhatsApp}
                    onCheckedChange={(checked) => handleInputChange('sendInvoiceWhatsApp', checked)}
                  />
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="users">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Team Members</CardTitle>
                <CardDescription>Manage users and their permissions</CardDescription>
              </div>
              {isAdmin && <CreateUserDialog />}
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {allTeam.map((member) => (
                  <div key={member.id} className="flex items-center justify-between p-4 rounded-lg border">
                    <div className="flex items-center gap-4">
                      <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-medium">
                        {member.name ? member.name.split(" ").map(n => n[0]).join("") : '?'}
                      </div>
                      <div>
                        <p className="font-medium">{member.name}</p>
                        <p className="text-sm text-muted-foreground">{member.email}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <Badge variant={roleConfig[member.role]?.variant || 'default'}>
                        {roleConfig[member.role]?.label || member.role}
                      </Badge>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        {maskingConfig[member.masking || 'partial']?.icon === Eye ? (
                          <Eye className="h-4 w-4 text-success" />
                        ) : (
                          <EyeOff className="h-4 w-4 text-warning" />
                        )}
                        <span>{maskingConfig[member.masking || 'partial']?.label}</span>
                      </div>
                      <Button variant="ghost" size="icon" className="text-destructive">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-6 p-4 rounded-lg bg-muted/50 border">
                <h4 className="font-semibold mb-3">Phone Number Masking Rules</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-success" />
                    <span><strong>Admin:</strong> Full access to all phone numbers</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-success" />
                    <span><strong>Account Manager:</strong> Masked (e.g., +92******321)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-success" />
                    <span><strong>Team Leader:</strong> Masked (e.g., +92******321)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-success" />
                    <span><strong>Teacher:</strong> No phone number visible</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notifications">
          <Card>
            <CardHeader>
              <CardTitle>Notification Settings</CardTitle>
              <CardDescription>Configure automated reminders and alerts</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <h4 className="font-semibold">Class Reminders</h4>
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Daily Class Reminder</Label>
                    <p className="text-sm text-muted-foreground">Send reminder 30 minutes before class</p>
                  </div>
                  <Switch defaultChecked />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Teacher Absence Alert</Label>
                    <p className="text-sm text-muted-foreground">Notify admin when teacher is absent</p>
                  </div>
                  <Switch defaultChecked />
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="font-semibold">Fee Reminders</h4>
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Fee Due Reminder</Label>
                    <p className="text-sm text-muted-foreground">Remind parents 3 days before due date</p>
                  </div>
                  <Switch defaultChecked />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Overdue Payment Alert</Label>
                    <p className="text-sm text-muted-foreground">Send reminder for overdue payments</p>
                  </div>
                  <Switch defaultChecked />
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="font-semibold">Lead Follow-ups</h4>
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Trial Follow-up</Label>
                    <p className="text-sm text-muted-foreground">Send follow-up after trial class</p>
                  </div>
                  <Switch defaultChecked />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Inactive Student Reactivation</Label>
                    <p className="text-sm text-muted-foreground">Reach out to inactive students</p>
                  </div>
                  <Switch defaultChecked />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="whatsapp">
          <Card>
            <CardHeader>
              <CardTitle>WhatsApp Business API</CardTitle>
              <CardDescription>Configure WhatsApp Cloud API integration</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="p-4 rounded-lg bg-success/10 border border-success/20 flex items-center gap-3">
                <Check className="h-5 w-5 text-success" />
                <div>
                  <p className="font-medium text-success">Connected</p>
                  <p className="text-sm text-muted-foreground">WhatsApp Business API is active</p>
                </div>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="phone-id">Phone Number ID</Label>
                  <Input id="phone-id" type="password" defaultValue="••••••••••••••" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="business-id">Business Account ID</Label>
                  <Input id="business-id" type="password" defaultValue="••••••••••••••" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="access-token">Access Token</Label>
                  <Input id="access-token" type="password" defaultValue="••••••••••••••••••••••••" />
                </div>
              </div>

              <Button className="w-full">Update API Settings</Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="security">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Password Policy</CardTitle>
                <CardDescription>Configure password requirements</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Minimum 8 characters</Label>
                  </div>
                  <Switch defaultChecked disabled />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Require uppercase letter</Label>
                  </div>
                  <Switch defaultChecked />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Require number</Label>
                  </div>
                  <Switch defaultChecked />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Require special character</Label>
                  </div>
                  <Switch />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Data Security</CardTitle>
                <CardDescription>Protect sensitive information</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Encrypt Phone Numbers</Label>
                    <p className="text-sm text-muted-foreground">Store numbers encrypted in database</p>
                  </div>
                  <Switch defaultChecked disabled />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Disable Data Export</Label>
                    <p className="text-sm text-muted-foreground">Prevent non-admin data exports</p>
                  </div>
                  <Switch defaultChecked />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Session Timeout</Label>
                    <p className="text-sm text-muted-foreground">Auto-logout after inactivity</p>
                  </div>
                  <Select defaultValue="30">
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="15">15 minutes</SelectItem>
                      <SelectItem value="30">30 minutes</SelectItem>
                      <SelectItem value="60">1 hour</SelectItem>
                      <SelectItem value="120">2 hours</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </MainLayout>
  );
}
