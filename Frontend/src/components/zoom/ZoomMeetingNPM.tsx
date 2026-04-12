import React, { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Video, VideoOff, Mic, MicOff, Users, Phone, Monitor, Settings } from 'lucide-react';
import { useAuthStore } from '@/lib/auth-store';
import { toast } from 'sonner';

// Import Zoom Meeting SDK from npm package
import { ZoomMtg } from '@zoom/meetingsdk';

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

export default function JoinClassButtonNPM({ 
  meetingNumber, 
  className 
}: { 
  meetingNumber?: string; 
  className?: string;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [sdkLoaded, setSdkLoaded] = useState(false);
  const [meetingConfig, setMeetingConfig] = useState<MeetingConfig | null>(null);
  const [isJoined, setIsJoined] = useState(false);
  const zoomContainerRef = useRef<HTMLDivElement>(null);
  const { currentUser } = useAuthStore();

  // Initialize Zoom Meeting SDK from npm package
  useEffect(() => {
    const initializeZoomSDK = () => {
      try {
        console.log('Initializing Zoom SDK from npm package...');
        
        // Check if ZoomMtg is available
        if (typeof ZoomMtg !== 'undefined') {
          console.log('Zoom SDK available from npm package');
          
          // Initialize Zoom SDK
          ZoomMtg.setZoomJSLib('https://source.zoom.us/2.18.0/lib', '/av');
          ZoomMtg.preLoadWasm();
          ZoomMtg.prepareWebSDK();
          
          // Initialize Zoom client for v6.0.0
          ZoomMtg.init({
            leaveUrl: 'https://quran-academy-production.up.railway.app',
            isSupportAV: true,
            success: (success: any) => {
              console.log('Zoom SDK initialized successfully:', success);
              setSdkLoaded(true);
            },
            error: (error: any) => {
              console.error('Zoom SDK initialization error:', error);
              setError('Failed to initialize Zoom SDK');
              toast.error('Failed to initialize Zoom SDK');
            }
          });
          
          return;
        }

        console.log('Zoom SDK not available, checking imports...');
        setTimeout(() => {
          if (typeof ZoomMtg !== 'undefined') {
            console.log('Zoom SDK initialized successfully from npm package');
            setSdkLoaded(true);
          } else {
            console.error('Zoom SDK not available from npm package');
            setError('Zoom SDK not available. Please check installation.');
            toast.error('Zoom SDK not available');
          }
        }, 1000);
      } catch (error) {
        console.error('Error initializing Zoom SDK:', error);
        setError('Failed to initialize Zoom SDK');
        toast.error('Failed to initialize Zoom SDK');
      }
    };

    if (isOpen && !sdkLoaded) {
      initializeZoomSDK();
    }
  }, [isOpen, sdkLoaded]);

  // Generate signature when component opens
  useEffect(() => {
    if (isOpen && meetingNumber) {
      generateSignature();
    }
  }, [isOpen, meetingNumber]);

  const generateSignature = async () => {
    try {
      setIsLoading(true);
      setError('');

      console.log('Attempting backend signature generation...');
      console.log('FRONTEND DEBUG: Current API URL =', import.meta.env.VITE_API_URL || 'NOT SET');
      
      // TEMPORARY FIX: Use correct backend URL directly
      const correctBackendUrl = 'https://quran-acadamy-crm-production.up.railway.app/api/zoom/signature-test';
      console.log('FRONTEND DEBUG: Using corrected URL =', correctBackendUrl);
      
      const response = await fetch(correctBackendUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          meetingNumber,
          role: 1, // Participant role
        }),
      });

      if (response.ok) {
        const data = await response.json();
        console.log('Backend signature generated successfully');
        
        const config: MeetingConfig = {
          meetingNumber: meetingNumber || '10000001663',
          userName: currentUser?.name || 'Admin',
          role: 1,
          signature: data.signature || 'test-signature',
          sdkKey: 'YNdDIn95StmFL25wVBoGQ'
        };
        
        setMeetingConfig(config);
        console.log('Zoom meeting config prepared:', config);
      } else {
        throw new Error(`Backend responded with ${response.status}: ${response.statusText}`);
      }
    } catch (err) {
      console.error('Error generating signature:', err);
      setError('Failed to generate meeting signature. Please try again.');
      toast.error('Failed to join meeting');
    } finally {
      setIsLoading(false);
    }
  };

  const joinMeeting = async () => {
    if (!meetingConfig) {
      setError('Meeting not ready. Please wait...');
      return;
    }

    if (!zoomContainerRef.current) {
      setError('Zoom container not found. Please refresh the page.');
      return;
    }

    try {
      setIsLoading(true);
      setError('');

      console.log('Joining Zoom meeting with v6.0.0 API...');
      
      // Join meeting using Zoom SDK v6.0.0 API
      ZoomMtg.join({
        meetingNumber: meetingConfig.meetingNumber,
        userName: meetingConfig.userName,
        signature: meetingConfig.signature,
        sdkKey: meetingConfig.sdkKey,
        passWord: '',
        success: (success: any) => {
          console.log('Successfully joined Zoom meeting:', success);
          setIsJoined(true);
          toast.success('Joined Zoom meeting successfully');
        },
        error: (error: any) => {
          console.error('Error joining Zoom meeting:', error);
          setError('Failed to join meeting: ' + (error.message || 'Unknown error'));
          toast.error('Failed to join meeting');
        }
      });

      console.log('Zoom meeting join initiated with config:', meetingConfig);
    } catch (err) {
      console.error('Error joining meeting:', err);
      setError('Failed to join meeting. Please try again.');
      toast.error('Failed to join meeting');
    } finally {
      setIsLoading(false);
    }
  };

  const leaveMeeting = () => {
    try {
      ZoomMtg.leave();
      setIsJoined(false);
      setIsOpen(false);
      toast.success('Left meeting');
    } catch (error) {
      console.error('Error leaving meeting:', error);
    }
  };

  return (
    <>
      <Button
        onClick={() => setIsOpen(true)}
        className={className}
        disabled={!meetingNumber}
      >
        <Video className="w-4 h-4 mr-2" />
        Join Class
      </Button>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Zoom Meeting</DialogTitle>
            <DialogDescription>
              Join your Quran Academy class via Zoom Meeting
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {!isJoined ? (
              <Card>
                <CardHeader>
                  <CardTitle>Meeting Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Badge variant="outline">
                      Meeting Number: {meetingNumber || 'N/A'}
                    </Badge>
                  </div>
                  <div>
                    <Badge variant="outline">
                      User: {currentUser?.name || 'Guest'}
                    </Badge>
                  </div>
                  <Button
                    onClick={joinMeeting}
                    disabled={isLoading || !sdkLoaded || !meetingConfig}
                    className="w-full"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Joining...
                      </>
                    ) : (
                      <>
                        <Video className="w-4 h-4 mr-2" />
                        Join Meeting
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span>Meeting in Progress</span>
                    <Badge variant="default">Connected</Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div
                    ref={zoomContainerRef}
                    className="w-full h-[600px] bg-gray-100 rounded-lg"
                    id="zoomContainer"
                  />
                  <div className="mt-4 flex justify-center">
                    <Button onClick={leaveMeeting} variant="destructive">
                      <Phone className="w-4 h-4 mr-2" />
                      Leave Meeting
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
        console.log('Initializing Zoom SDK from npm package...');
        
        // Check if ZoomMtg is available
        if (typeof ZoomMtg !== 'undefined') {
          console.log('Zoom SDK available from npm package');
          
          // Initialize Zoom SDK
          ZoomMtg.setZoomJSLib('https://source.zoom.us/2.18.0/lib', '/av');
          ZoomMtg.preLoadWasm();
          ZoomMtg.prepareWebSDK();
          
          // Initialize Zoom client for v6.0.0
          ZoomMtg.init({
            leaveUrl: 'https://quran-academy-production.up.railway.app',
            isSupportAV: true,
            success: (success: any) => {
              console.log('Zoom SDK initialized successfully:', success);
              setSdkLoaded(true);
            },
            error: (error: any) => {
              console.error('Zoom SDK initialization error:', error);
              setError('Failed to initialize Zoom SDK');
              toast.error('Failed to initialize Zoom SDK');
            }
          });
          
          setSdkLoaded(true);
          console.log('Zoom SDK initialized successfully');
          return;
        }

        console.log('Zoom SDK not available, checking imports...');
        // Try to access the SDK differently
        setTimeout(() => {
          if (typeof ZoomMtg !== 'undefined') {
            console.log('Zoom SDK initialized successfully from npm package');
            setSdkLoaded(true);
          } else {
            console.error('Zoom SDK not available from npm package');
            console.log('ZoomMtg type:', typeof ZoomMtg);
            console.log('ZoomMtg value:', ZoomMtg);
            setError('Zoom SDK not available. Please check installation.');
            toast.error('Zoom SDK not available');
          }
        }, 1000);
      } catch (error) {
        console.error('Error initializing Zoom SDK:', error);
        setError('Failed to initialize Zoom SDK');
        toast.error('Failed to initialize Zoom SDK');
      }
    };

    if (isOpen && !sdkLoaded) {
      initializeZoomSDK();
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
        console.log('Attempting backend signature generation...');
        console.log('FRONTEND DEBUG: Current API URL =', import.meta.env.VITE_API_URL || 'NOT SET');
        
        // TEMPORARY FIX: Use correct backend URL directly
        const correctBackendUrl = 'https://quran-acadamy-crm-production.up.railway.app/api/zoom/signature-test';
        console.log('FRONTEND DEBUG: Using corrected URL =', correctBackendUrl);
        
        const response = await fetch(correctBackendUrl, {
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
          throw new Error(`Backend responded with ${response.status}: ${response.statusText}`);
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
      console.log('Zoom meeting config prepared:', config);
    } catch (err) {
      console.error('Error generating signature:', err);
      setError('Failed to generate meeting signature. Please try again.');
      toast.error('Failed to join meeting');
    } finally {
      setIsLoading(false);
    }
  };

  const joinMeeting = async () => {
    if (!meetingConfig) {
      setError('Meeting not ready. Please wait...');
      return;
    }

    // Check if Zoom SDK is loaded
    if (!ZoomMtg) {
      console.log('Zoom SDK not loaded');
      setError('Zoom SDK not loaded. Please refresh the page.');
      return;
    }

    if (!zoomContainerRef.current) {
      console.log('Zoom container not found');
      setError('Zoom container not found. Please refresh the page.');
      return;
    }

    try {
      setIsLoading(true);
      setError('');

      console.log('Joining Zoom meeting with v6.0.0 API...');
      
      // Join meeting using Zoom SDK v6.0.0 API
      ZoomMtg.join({
        meetingNumber: meetingConfig.meetingNumber,
        userName: meetingConfig.userName,
        signature: meetingConfig.signature,
        sdkKey: meetingConfig.sdkKey,
        passWord: '',
        success: (success: any) => {
          console.log('Successfully joined Zoom meeting:', success);
          setIsJoined(true);
          toast.success('Joined Zoom meeting successfully');
        },
        error: (error: any) => {
          console.error('Error joining Zoom meeting:', error);
          setError('Failed to join meeting: ' + (error.message || 'Unknown error'));
          toast.error('Failed to join meeting');
        }
      });

      // Setup event listeners for v6.0.0
      ZoomMtg.inMeeting({
        listener: (event: any) => {
          console.log('Zoom meeting event:', event);
          
          if (event.type === 'meeting-ended') {
            console.log('Meeting ended');
            setIsJoined(false);
            setParticipantCount(0);
            onClose();
          }
        }
      });

      console.log('Zoom meeting join initiated with config:', meetingConfig);
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
            Zoom Meeting - NPM Package
          </DialogTitle>
          <DialogDescription>
            Join your scheduled Quran class via Zoom video conference using npm package
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
                    {sdkLoaded ? "Loaded (NPM)" : "Loading..."}
                  </Badge>
                </div>
                <div>
                  <label className="text-sm font-medium">Package Type</label>
                  <Badge variant="default" className="ml-2">
                    @zoom/meetingsdk
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

          {/* NPM Package Notice */}
          <Alert>
            <AlertDescription>
              <strong>NPM Package Integration:</strong> Using @zoom/meetingsdk npm package for proper React integration 
              without CDN script loading issues.
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
                    Click the button below to join via npm package integration
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
                      Join via NPM Package
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
                    NPM package integration successful - {participantCount} participants
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

export function JoinClassButtonNPM({ meetingNumber, className }: JoinClassButtonProps) {
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

      <ZoomMeetingNPM
        isOpen={isZoomOpen}
        onClose={() => setIsZoomOpen(false)}
        meetingNumber={meetingNumber}
        userName={currentUser?.name}
        role={currentUser?.role === 'teacher' ? 0 : 1}
      />
    </>
  );
}
