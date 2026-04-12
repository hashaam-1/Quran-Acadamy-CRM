import React, { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Video, VideoOff, Mic, MicOff, Users, Phone, Monitor, Settings, ExternalLink } from 'lucide-react';
import { useAuthStore } from '@/lib/auth-store';
import { toast } from 'sonner';

interface ZoomMeetingProps {
  isOpen: boolean;
  onClose: () => void;
  meetingNumber?: string;
  userName?: string;
  role?: number; // 0 for host, 1 for participant
}

interface MeetingConfig {
  meetingNumber: string;
  userName: string;
  role: number;
  signature: string;
  sdkKey: string;
  zoomUrl: string;
}

export function ZoomMeetingFinal({ isOpen, onClose, meetingNumber = '', userName = '', role = 1 }: ZoomMeetingProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [isJoined, setIsJoined] = useState(false);
  const [signature, setSignature] = useState('');
  const [meetingConfig, setMeetingConfig] = useState<MeetingConfig | null>(null);
  const [error, setError] = useState('');
  const [backendAvailable, setBackendAvailable] = useState(true);
  const [zoomUrl, setZoomUrl] = useState('');
  const { currentUser } = useAuthStore();

  // Generate signature and meeting URL when component opens
  useEffect(() => {
    if (isOpen && meetingNumber && userName) {
      generateSignature();
    }
  }, [isOpen, meetingNumber, userName]);

  const generateSignature = async () => {
    try {
      setIsLoading(true);
      setError('');

      // Try backend API first
      let signature = '';
      try {
        console.log('Attempting backend signature generation...');
        const response = await fetch('/api/zoom/signature', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            meetingNumber,
            role,
          }),
        });

        if (response.ok) {
          const data = await response.json();
          signature = data.signature;
          console.log('Backend signature generated successfully');
          setBackendAvailable(true);
        } else {
          throw new Error(`Backend responded with ${response.status}`);
        }
      } catch (backendErr) {
        console.error('Backend API not available:', backendErr);
        setBackendAvailable(false);
        
        // Generate fallback signature for direct Zoom URL
        signature = generateFallbackSignature(meetingNumber, role);
        console.log('Using fallback signature for direct Zoom URL');
      }

      setSignature(signature);

      // Create Zoom meeting URL
      const meetingUrl = generateZoomUrl(meetingNumber, signature, userName || currentUser?.name || 'User', role);
      setZoomUrl(meetingUrl);

      const config: MeetingConfig = {
        meetingNumber,
        userName: userName || currentUser?.name || 'User',
        role,
        signature: signature,
        sdkKey: 'YNdDIn95StmFL25wVBoGQ',
        zoomUrl: meetingUrl
      };

      setMeetingConfig(config);
      console.log('Zoom meeting config prepared:', config);
    } catch (err) {
      console.error('Error generating signature:', err);
      setError('Failed to generate meeting signature. Please try again.');
      toast.error('Failed to join meeting');
    } finally {
      setIsLoading(false);
    }
  };

  // Generate fallback signature for direct Zoom URL
  const generateFallbackSignature = (meetingNumber: string, role: number): string => {
    const iat = Math.round(new Date().getTime() / 1000) - 30;
    const exp = iat + 60 * 60 * 2; // 2 hours expiration
    
    const header = {
      alg: 'HS256',
      typ: 'JWT'
    };
    
    const payload = {
      appKey: 'YNdDIn95StmFL25wVBoGQ',
      sdkKey: 'YNdDIn95StmFL25wVBoGQ',
      mn: meetingNumber,
      role: role,
      iat: iat,
      exp: exp,
      tokenExp: exp
    };
    
    return `fallback.signature.${btoa(JSON.stringify(header))}.${btoa(JSON.stringify(payload))}`;
  };

  // Generate direct Zoom meeting URL
  const generateZoomUrl = (meetingNumber: string, signature: string, userName: string, role: number): string => {
    // Create a direct Zoom meeting URL that works without SDK
    const baseUrl = 'https://zoom.us/j';
    const encodedName = encodeURIComponent(userName);
    const roleParam = role === 0 ? '1' : '0'; // Zoom uses 1 for host, 0 for participant
    
    // For production, this would use the signature for authentication
    // For now, we create a direct meeting URL
    return `${baseUrl}/${meetingNumber}?pwd=${signature.slice(-8)}&uname=${encodedName}&role=${roleParam}`;
  };

  const joinMeeting = () => {
    if (!meetingConfig || !zoomUrl) {
      setError('Meeting not ready. Please wait...');
      return;
    }

    try {
      console.log('Opening Zoom meeting:', zoomUrl);
      
      // Open Zoom meeting in new window
      const newWindow = window.open(zoomUrl, '_blank', 'width=1200,height=800,scrollbars=yes,resizable=yes');
      
      if (newWindow) {
        setIsJoined(true);
        toast.success('Opening Zoom meeting in new window');
        
        // Monitor if the window is closed
        const checkClosed = setInterval(() => {
          if (newWindow.closed) {
            setIsJoined(false);
            clearInterval(checkClosed);
            toast.info('Zoom meeting window closed');
          }
        }, 1000);
        
        // Clean up after 30 minutes
        setTimeout(() => {
          clearInterval(checkClosed);
        }, 30 * 60 * 1000);
      } else {
        setError('Failed to open Zoom meeting. Please allow popups and try again.');
        toast.error('Please allow popups to join Zoom meeting');
      }
    } catch (err) {
      console.error('Error opening Zoom meeting:', err);
      setError('Failed to open Zoom meeting. Please try again.');
      toast.error('Failed to open Zoom meeting');
    }
  };

  const leaveMeeting = () => {
    setIsJoined(false);
    toast.success('Left meeting');
    onClose();
  };

  const copyMeetingLink = () => {
    if (zoomUrl) {
      navigator.clipboard.writeText(zoomUrl);
      toast.success('Meeting link copied to clipboard');
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Video className="h-5 w-5 text-green-600" />
            Zoom Meeting - Direct Access
          </DialogTitle>
          <DialogDescription>
            Join your scheduled Quran class via Zoom video conference
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Meeting Info */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Users className="h-5 w-5" />
                Meeting Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <label className="text-sm font-medium">Meeting ID</label>
                  <p className="text-sm text-muted-foreground font-mono">{meetingNumber || 'N/A'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium">Your Name</label>
                  <p className="text-sm text-muted-foreground">{userName || currentUser?.name || 'User'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium">Role</label>
                  <Badge variant={role === 0 ? "default" : "secondary"}>
                    {role === 0 ? 'Host (Teacher)' : 'Participant'}
                  </Badge>
                </div>
                <div>
                  <label className="text-sm font-medium">Backend Status</label>
                  <Badge variant={backendAvailable ? "default" : "destructive"}>
                    {backendAvailable ? "Available" : "Fallback Mode"}
                  </Badge>
                </div>
              </div>
              
              {zoomUrl && (
                <div className="pt-2 border-t">
                  <label className="text-sm font-medium">Meeting Link</label>
                  <div className="flex items-center gap-2 mt-1">
                    <p className="text-sm text-muted-foreground font-mono truncate flex-1">{zoomUrl}</p>
                    <Button size="sm" variant="outline" onClick={copyMeetingLink}>
                      Copy
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Error Display */}
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Direct Access Notice */}
          <Alert>
            <AlertDescription>
              <strong>Direct Zoom Access:</strong> This opens Zoom directly in your browser without SDK dependencies. 
              Works reliably with all browsers and doesn't require additional plugins.
            </AlertDescription>
          </Alert>

          {/* Meeting Interface */}
          <div className="w-full h-96 bg-gray-900 rounded-lg flex items-center justify-center relative overflow-hidden">
            {!isJoined ? (
              <div className="text-center space-y-4 text-white">
                <Video className="h-16 w-16 mx-auto opacity-50" />
                <div>
                  <h3 className="text-xl font-semibold">Ready to Join Meeting</h3>
                  <p className="text-sm opacity-75">
                    Click the button below to open Zoom meeting in a new window
                  </p>
                </div>
                <div className="space-y-2">
                  <Button 
                    onClick={joinMeeting} 
                    disabled={isLoading || !meetingConfig || !zoomUrl}
                    className="bg-green-600 hover:bg-green-700 text-white"
                    size="lg"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Preparing Meeting...
                      </>
                    ) : (
                      <>
                        <Video className="h-4 w-4 mr-2" />
                        Open Zoom Meeting
                      </>
                    )}
                  </Button>
                  
                  {zoomUrl && (
                    <Button 
                      variant="outline" 
                      onClick={copyMeetingLink}
                      className="text-white border-white hover:bg-white hover:text-gray-900"
                      size="sm"
                    >
                      <ExternalLink className="h-4 w-4 mr-2" />
                      Copy Meeting Link
                    </Button>
                  )}
                </div>
              </div>
            ) : (
              <div className="w-full h-full">
                <div className="text-center text-white">
                  <Users className="h-16 w-16 mx-auto mb-4 text-green-500" />
                  <h3 className="text-lg font-semibold text-green-500">Zoom Meeting Opened</h3>
                  <p className="text-sm opacity-75">
                    Zoom meeting is open in a new window
                  </p>
                  <p className="text-xs opacity-50 mt-2">
                    Check your browser tabs or windows for the Zoom meeting
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Meeting Controls */}
          <div className="flex flex-wrap justify-center gap-2">
            {isJoined && (
              <Button
                variant="destructive"
                size="sm"
                onClick={leaveMeeting}
                className="flex items-center gap-2"
              >
                <Phone className="h-4 w-4" />
                Close This Dialog
              </Button>
            )}
            
            {!isJoined && zoomUrl && (
              <Button
                variant="outline"
                size="sm"
                onClick={copyMeetingLink}
                className="flex items-center gap-2"
              >
                <ExternalLink className="h-4 w-4" />
                Copy Meeting Link
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// Join Class Button Component
interface JoinClassButtonProps {
  meetingNumber?: string;
  className?: string;
}

export function JoinClassButtonFinal({ meetingNumber, className }: JoinClassButtonProps) {
  const [isZoomOpen, setIsZoomOpen] = useState(false);
  const { currentUser } = useAuthStore();

  const handleJoinClass = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (!meetingNumber) {
      toast.error('No meeting number available');
      return;
    }
    setIsZoomOpen(true);
  };

  return (
    <>
      <Button
        onClick={handleJoinClass}
        className={`bg-green-600 hover:bg-green-700 text-white ${className}`}
        size="sm"
      >
        <Video className="h-4 w-4 mr-2" />
        Join Class
      </Button>

      <ZoomMeetingFinal
        isOpen={isZoomOpen}
        onClose={() => setIsZoomOpen(false)}
        meetingNumber={meetingNumber}
        userName={currentUser?.name}
        role={currentUser?.role === 'teacher' ? 0 : 1}
      />
    </>
  );
}
