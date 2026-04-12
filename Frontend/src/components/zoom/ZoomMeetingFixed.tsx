import React, { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Video, VideoOff, Mic, MicOff, Users } from 'lucide-react';
import { useAuthStore } from '@/lib/auth-store';
import { toast } from 'sonner';

// Import Zoom Meeting SDK
declare global {
  interface Window {
    ZoomMtgEmbedded: any;
  }
}

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
}

export function ZoomMeetingFixed({ isOpen, onClose, meetingNumber = '', userName = '', role = 1 }: ZoomMeetingProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [isJoined, setIsJoined] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOn, setIsVideoOn] = useState(true);
  const [signature, setSignature] = useState('');
  const [meetingConfig, setMeetingConfig] = useState<MeetingConfig | null>(null);
  const [error, setError] = useState('');
  const [sdkLoaded, setSdkLoaded] = useState(false);
  const zoomContainerRef = useRef<HTMLDivElement>(null);
  const zoomClientRef = useRef<any>(null);
  const { currentUser } = useAuthStore();

  // Load Zoom Meeting SDK
  useEffect(() => {
    const loadZoomSDK = () => {
      if (window.ZoomMtgEmbedded) {
        console.log('Zoom SDK already loaded');
        setSdkLoaded(true);
        return;
      }

      console.log('Loading Zoom SDK...');
      const script = document.createElement('script');
      script.src = 'https://source.zoom.us/zoom-meeting-embedded-6.0.0.min.js';
      script.async = true;
      script.crossOrigin = 'anonymous';
      
      script.onload = () => {
        console.log('Zoom SDK script loaded');
        setTimeout(() => {
          if (window.ZoomMtgEmbedded) {
            console.log('Zoom SDK initialized successfully');
            setSdkLoaded(true);
          } else {
            console.error('Zoom SDK not available after script load');
            setError('Zoom SDK failed to initialize. Please refresh the page.');
            toast.error('Zoom SDK initialization failed');
          }
        }, 1000);
      };
      
      script.onerror = (error) => {
        console.error('Failed to load Zoom SDK script:', error);
        setError('Failed to load Zoom SDK. Please check your internet connection.');
        toast.error('Failed to load Zoom SDK script');
      };

      document.head.appendChild(script);
    };

    if (isOpen && !sdkLoaded) {
      loadZoomSDK();
    }
  }, [isOpen, sdkLoaded]);

  // Generate signature when component opens
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
        } else {
          throw new Error('Backend not available');
        }
      } catch (backendErr) {
        console.warn('Backend API not available, using mock signature:', backendErr);
        // Generate mock signature for testing
        signature = generateMockSignature(meetingNumber, role);
        toast.info('Using demo mode - backend deployment pending');
      }

      setSignature(signature);

      const config: MeetingConfig = {
        meetingNumber,
        userName: userName || currentUser?.name || 'User',
        role,
        signature: signature,
        sdkKey: 'YNdDIn95StmFL25wVBoGQ',
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

  // Mock signature generation for testing
  const generateMockSignature = (meetingNumber: string, role: number): string => {
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
    
    // For demo purposes, return a mock signature
    return `mock.signature.${btoa(JSON.stringify(header))}.${btoa(JSON.stringify(payload))}`;
  };

  const joinMeeting = async () => {
    if (!meetingConfig || !zoomContainerRef.current) {
      setError('Meeting not ready. Please wait...');
      return;
    }

    // Check if Zoom SDK is loaded
    if (!window.ZoomMtgEmbedded) {
      console.log('Zoom SDK not loaded, attempting to load...');
      setError('Loading Zoom SDK... Please wait.');
      return;
    }

    try {
      setIsLoading(true);
      setError('');

      console.log('Initializing Zoom client...');
      
      // Initialize Zoom client
      const zoomClient = window.ZoomMtgEmbedded.createClient();
      zoomClientRef.current = zoomClient;

      console.log('Joining Zoom meeting with config:', meetingConfig);

      // Join meeting
      await zoomClient.join({
        signature: meetingConfig.signature,
        sdkKey: meetingConfig.sdkKey,
        meetingNumber: meetingConfig.meetingNumber,
        password: '',
        userName: meetingConfig.userName,
        userSpecified: {
          screenSize: {
            width: window.screen.width,
            height: window.screen.height
          }
        }
      });

      setIsJoined(true);
      toast.success('Successfully joined meeting');
      console.log('Successfully joined Zoom meeting');
    } catch (err) {
      console.error('Error joining meeting:', err);
      setError('Failed to join meeting. Please try again.');
      toast.error('Failed to join meeting');
    } finally {
      setIsLoading(false);
    }
  };

  const leaveMeeting = () => {
    if (zoomClientRef.current) {
      try {
        zoomClientRef.current.leave();
        setIsJoined(false);
        toast.success('Left meeting');
        onClose();
      } catch (err) {
        console.error('Error leaving meeting:', err);
        onClose();
      }
    } else {
      onClose();
    }
  };

  const toggleMute = () => {
    if (zoomClientRef.current && isJoined) {
      try {
        if (isMuted) {
          zoomClientRef.current.unmuteAudio();
        } else {
          zoomClientRef.current.muteAudio();
        }
        setIsMuted(!isMuted);
      } catch (err) {
        console.error('Error toggling mute:', err);
      }
    }
  };

  const toggleVideo = () => {
    if (zoomClientRef.current && isJoined) {
      try {
        if (isVideoOn) {
          zoomClientRef.current.stopVideo();
        } else {
          zoomClientRef.current.startVideo();
        }
        setIsVideoOn(!isVideoOn);
      } catch (err) {
        console.error('Error toggling video:', err);
      }
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Video className="h-5 w-5" />
            Zoom Meeting
          </DialogTitle>
          <DialogDescription>
            Join your scheduled Quran class via Zoom video conference
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Meeting Info */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Meeting Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Meeting ID</label>
                  <p className="text-sm text-muted-foreground">{meetingNumber}</p>
                </div>
                <div>
                  <label className="text-sm font-medium">Your Name</label>
                  <p className="text-sm text-muted-foreground">{userName || currentUser?.name || 'User'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium">Role</label>
                  <p className="text-sm text-muted-foreground">
                    {role === 0 ? 'Host (Teacher)' : 'Participant (Student)'}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium">Status</label>
                  <Badge variant={isJoined ? "default" : "secondary"}>
                    {isJoined ? "In Meeting" : "Not Joined"}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Error Display */}
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Zoom Meeting Container */}
          <div 
            ref={zoomContainerRef} 
            className="w-full h-96 bg-gray-100 rounded-lg flex items-center justify-center"
          >
            {!isJoined ? (
              <div className="text-center space-y-4">
                <Video className="h-16 w-16 mx-auto text-muted-foreground" />
                <div>
                  <h3 className="text-lg font-semibold">Ready to Join Meeting</h3>
                  <p className="text-sm text-muted-foreground">
                    Click the button below to join the Zoom meeting
                  </p>
                </div>
                <Button 
                  onClick={joinMeeting} 
                  disabled={isLoading || !meetingConfig}
                  className="bg-green-600 hover:bg-green-700"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Joining...
                    </>
                  ) : (
                    <>
                      <Video className="h-4 w-4 mr-2" />
                      Join Meeting
                    </>
                  )}
                </Button>
              </div>
            ) : (
              <div className="text-center space-y-4">
                <Users className="h-16 w-16 mx-auto text-green-600" />
                <div>
                  <h3 className="text-lg font-semibold text-green-600">You're in the Meeting</h3>
                  <p className="text-sm text-muted-foreground">
                    Use the controls below to manage your audio and video
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Meeting Controls */}
          {isJoined && (
            <div className="flex justify-center gap-2">
              <Button
                variant={isMuted ? "destructive" : "default"}
                size="sm"
                onClick={toggleMute}
                className="flex items-center gap-2"
              >
                {isMuted ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
                {isMuted ? "Unmute" : "Mute"}
              </Button>

              <Button
                variant={isVideoOn ? "default" : "destructive"}
                size="sm"
                onClick={toggleVideo}
                className="flex items-center gap-2"
              >
                {isVideoOn ? <Video className="h-4 w-4" /> : <VideoOff className="h-4 w-4" />}
                {isVideoOn ? "Stop Video" : "Start Video"}
              </Button>

              <Button
                variant="destructive"
                size="sm"
                onClick={leaveMeeting}
                className="flex items-center gap-2"
              >
                Leave Meeting
              </Button>
            </div>
          )}
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

export function JoinClassButtonFixed({ meetingNumber, className }: JoinClassButtonProps) {
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

      <ZoomMeetingFixed
        isOpen={isZoomOpen}
        onClose={() => setIsZoomOpen(false)}
        meetingNumber={meetingNumber}
        userName={currentUser?.name}
        role={currentUser?.role === 'teacher' ? 0 : 1} // Teacher as host, others as participants
      />
    </>
  );
}
