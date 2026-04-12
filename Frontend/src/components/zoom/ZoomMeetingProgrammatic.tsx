import React, { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Video, VideoOff, Mic, MicOff, Users, Phone, Monitor, Settings, ExternalLink } from 'lucide-react';
import { useAuthStore } from '@/lib/auth-store';
import { toast } from 'sonner';

// Import Zoom Meeting SDK with programmatic join support
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

export function ZoomMeetingProgrammatic({ isOpen, onClose, meetingNumber = '', userName = '', role = 1 }: ZoomMeetingProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [isJoined, setIsJoined] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOn, setIsVideoOn] = useState(true);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [signature, setSignature] = useState('');
  const [meetingConfig, setMeetingConfig] = useState<MeetingConfig | null>(null);
  const [error, setError] = useState('');
  const [sdkLoaded, setSdkLoaded] = useState(false);
  const [backendAvailable, setBackendAvailable] = useState(true);
  const [participantCount, setParticipantCount] = useState(0);
  const zoomContainerRef = useRef<HTMLDivElement>(null);
  const zoomClientRef = useRef<any>(null);
  const { currentUser } = useAuthStore();

  // Load Zoom Meeting SDK with programmatic join support
  useEffect(() => {
    const loadZoomSDK = () => {
      if (window.ZoomMtgEmbedded) {
        console.log('Zoom SDK already loaded');
        setSdkLoaded(true);
        return;
      }

      console.log('Loading Zoom SDK with programmatic join support...');
      const script = document.createElement('script');
      script.src = 'https://source.zoom.us/zoom-meeting-embedded-6.0.0.min.js';
      script.async = true;
      script.crossOrigin = 'anonymous';
      script.type = 'text/javascript';
      
      script.onload = () => {
        console.log('Zoom SDK script loaded');
        // Initialize Zoom SDK with programmatic join enabled
        setTimeout(() => {
          if (window.ZoomMtgEmbedded) {
            console.log('Zoom SDK initialized successfully with programmatic join');
            setSdkLoaded(true);
            
            // Preload Zoom SDK for better performance
            try {
              window.ZoomMtgEmbedded.preLoad();
              console.log('Zoom SDK preloaded successfully');
            } catch (err) {
              console.warn('Zoom SDK preload failed:', err);
            }
          } else {
            console.error('Zoom SDK not available after script load');
            setError('Zoom SDK failed to initialize. Please refresh the page.');
            toast.error('Zoom SDK initialization failed');
          }
        }, 2000);
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
        console.log('Attempting backend signature generation for programmatic join...');
        const response = await fetch('/api/zoom/signature', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            meetingNumber,
            role,
            programmaticJoin: true // Enable programmatic join
          }),
        });

        if (response.ok) {
          const data = await response.json();
          signature = data.signature;
          console.log('Backend signature generated successfully for programmatic join');
          setBackendAvailable(true);
        } else {
          throw new Error(`Backend responded with ${response.status}`);
        }
      } catch (backendErr) {
        console.error('Backend API not available:', backendErr);
        setBackendAvailable(false);
        setError('Backend API not available. Please ensure Zoom routes are deployed.');
        toast.error('Backend Zoom API not available');
        return;
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
      console.log('Zoom meeting config prepared for programmatic join:', config);
    } catch (err) {
      console.error('Error generating signature:', err);
      setError('Failed to generate meeting signature. Please try again.');
      toast.error('Failed to join meeting');
    } finally {
      setIsLoading(false);
    }
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

      console.log('Initializing Zoom client with programmatic join...');
      
      // Initialize Zoom client with programmatic join support
      const zoomClient = window.ZoomMtgEmbedded.createClient();
      zoomClientRef.current = zoomClient;

      // Setup event listeners for programmatic join
      zoomClient.on('meeting-ready', () => {
        console.log('Meeting is ready for programmatic join');
      });

      zoomClient.on('user-added', (payload: any) => {
        console.log('User added to meeting:', payload);
        setParticipantCount(prev => prev + 1);
      });

      zoomClient.on('user-left', (payload: any) => {
        console.log('User left meeting:', payload);
        setParticipantCount(prev => Math.max(0, prev - 1));
      });

      zoomClient.on('meeting-ended', () => {
        console.log('Meeting ended');
        setIsJoined(false);
        setParticipantCount(0);
        onClose();
      });

      zoomClient.on('connection-change', (payload: any) => {
        console.log('Connection changed:', payload);
      });

      console.log('Joining Zoom meeting with programmatic join config:', meetingConfig);

      // Join meeting with programmatic join enabled
      await zoomClient.join({
        signature: meetingConfig.signature,
        sdkKey: meetingConfig.sdkKey,
        meetingNumber: meetingConfig.meetingNumber,
        password: '',
        userName: meetingConfig.userName,
        role: meetingConfig.role, // Include role for programmatic join
        userSpecified: {
          screenSize: {
            width: window.screen.width,
            height: window.screen.height
          }
        },
        options: {
          programmaticJoin: true // Enable programmatic join
        }
      });

      setIsJoined(true);
      setParticipantCount(1); // Start with current user
      toast.success('Successfully joined meeting via programmatic join');
      console.log('Successfully joined Zoom meeting with programmatic join');
    } catch (err) {
      console.error('Error joining meeting with programmatic join:', err);
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
        setParticipantCount(0);
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
        console.log('Audio toggled:', !isMuted ? 'muted' : 'unmuted');
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
        console.log('Video toggled:', !isVideoOn ? 'stopped' : 'started');
      } catch (err) {
        console.error('Error toggling video:', err);
      }
    }
  };

  const toggleScreenShare = () => {
    if (zoomClientRef.current && isJoined) {
      try {
        if (isScreenSharing) {
          zoomClientRef.current.stopShare();
        } else {
          zoomClientRef.current.startShare();
        }
        setIsScreenSharing(!isScreenSharing);
        console.log('Screen share toggled:', !isScreenSharing ? 'stopped' : 'started');
      } catch (err) {
        console.error('Error toggling screen share:', err);
      }
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Video className="h-5 w-5 text-green-600" />
            Zoom Meeting - Programmatic Join
          </DialogTitle>
          <DialogDescription>
            Join your scheduled Quran class via Zoom video conference with programmatic join
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
                    {backendAvailable ? "Available" : "Unavailable"}
                  </Badge>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">SDK Status</label>
                  <Badge variant={sdkLoaded ? "default" : "secondary"} className="ml-2">
                    {sdkLoaded ? "Loaded" : "Loading..."}
                  </Badge>
                </div>
                <div>
                  <label className="text-sm font-medium">Programmatic Join</label>
                  <Badge variant="default" className="ml-2">
                    Enabled
                  </Badge>
                </div>
              </div>

              {isJoined && (
                <div className="pt-2 border-t">
                  <div className="flex items-center gap-2 text-sm">
                    <Users className="h-4 w-4" />
                    <span>{participantCount} participants in meeting</span>
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

          {/* Programmatic Join Notice */}
          <Alert>
            <AlertDescription>
              <strong>Programmatic Join Enabled:</strong> This uses Zoom's programmatic join feature for seamless meeting access. 
              Make sure "Programmatic join use case" is enabled in your Zoom Dashboard.
            </AlertDescription>
          </Alert>

          {/* Zoom Meeting Container */}
          <div 
            ref={zoomContainerRef} 
            className="w-full h-96 bg-gray-900 rounded-lg flex items-center justify-center relative overflow-hidden"
            id="zoom-container"
          >
            {!isJoined ? (
              <div className="text-center space-y-4 text-white">
                <Video className="h-16 w-16 mx-auto opacity-50" />
                <div>
                  <h3 className="text-xl font-semibold">Ready to Join Meeting</h3>
                  <p className="text-sm opacity-75">
                    Click the button below to join via programmatic join
                  </p>
                </div>
                <Button 
                  onClick={joinMeeting} 
                  disabled={isLoading || !meetingConfig || !sdkLoaded || !backendAvailable}
                  className="bg-green-600 hover:bg-green-700 text-white"
                  size="lg"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Joining...
                    </>
                  ) : (
                    <>
                      <Video className="h-4 w-4 mr-2" />
                      Join via Programmatic Join
                    </>
                  )}
                </Button>
                {!backendAvailable && (
                  <p className="text-sm text-red-400">
                    Backend API unavailable - Please check deployment
                  </p>
                )}
              </div>
            ) : (
              <div className="w-full h-full">
                <div className="text-center text-white">
                  <Users className="h-16 w-16 mx-auto mb-4 text-green-500" />
                  <h3 className="text-lg font-semibold text-green-500">You're in the Meeting</h3>
                  <p className="text-sm opacity-75">
                    Programmatic join successful - {participantCount} participants
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Meeting Controls */}
          {isJoined && (
            <div className="flex flex-wrap justify-center gap-2">
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
                variant={isScreenSharing ? "default" : "outline"}
                size="sm"
                onClick={toggleScreenShare}
                className="flex items-center gap-2"
              >
                <Monitor className="h-4 w-4" />
                {isScreenSharing ? "Stop Share" : "Share Screen"}
              </Button>

              <Button
                variant="outline"
                size="sm"
                className="flex items-center gap-2"
              >
                <Settings className="h-4 w-4" />
                Settings
              </Button>

              <Button
                variant="destructive"
                size="sm"
                onClick={leaveMeeting}
                className="flex items-center gap-2"
              >
                <Phone className="h-4 w-4" />
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

export function JoinClassButtonProgrammatic({ meetingNumber, className }: JoinClassButtonProps) {
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

      <ZoomMeetingProgrammatic
        isOpen={isZoomOpen}
        onClose={() => setIsZoomOpen(false)}
        meetingNumber={meetingNumber}
        userName={currentUser?.name}
        role={currentUser?.role === 'teacher' ? 0 : 1}
      />
    </>
  );
}
