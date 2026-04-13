import React, { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Video, Phone } from 'lucide-react';
import { useAuthStore } from '@/lib/auth-store';
import { toast } from 'sonner';

// Import Zoom Meeting SDK from npm package - NO CDN LOADING
import { ZoomMtg } from '@zoom/meetingsdk';

interface MeetingConfig {
  meetingNumber: string;
  userName: string;
  role: number;
  signature: string;
  sdkKey: string;
}

export default function JoinClassButtonClean({ 
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
          setSdkLoaded(true);
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
      
      // Use correct backend URL directly
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

      console.log('Joining Zoom meeting with correct API...');
      
      // Initialize Zoom SDK
      ZoomMtg.setZoomJSLib('https://source.zoom.us/2.18.0/lib', '/av');
      ZoomMtg.preLoadWasm();
      ZoomMtg.prepareWebSDK();
      
      // Initialize Zoom client
      ZoomMtg.init({
        leaveUrl: 'https://quran-academy-production.up.railway.app',
        isSupportAV: true,
        success: () => {
          console.log('Zoom SDK initialized successfully');
          
          // Join meeting
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
        },
        error: (error: any) => {
          console.error('Zoom SDK initialization error:', error);
          setError('Failed to initialize Zoom SDK');
          toast.error('Failed to initialize Zoom SDK');
        }
      });
      
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

            <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span>{isJoined ? 'Meeting in Progress' : 'Meeting Details'}</span>
                    <Badge variant={isJoined ? 'default' : 'outline'}>
                      {isJoined ? 'Connected' : 'Ready'}
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Always render the Zoom container */}
                  <div
                    ref={zoomContainerRef}
                    className={`w-full h-[600px] rounded-lg ${isJoined ? 'bg-gray-100' : 'bg-gray-50 border-2 border-dashed border-gray-300'}`}
                    id="zoomContainer"
                  >
                    {!isJoined && (
                      <div className="flex items-center justify-center h-full text-gray-500">
                        <div className="text-center">
                          <Video className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                          <p>Zoom meeting will appear here</p>
                        </div>
                      </div>
                    )}
                  </div>
                  
                  {!isJoined ? (
                    <>
                      <div className="space-y-2">
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
                        <div>
                          <Badge variant="outline">
                            SDK Status: {sdkLoaded ? 'Loaded' : 'Loading...'}
                          </Badge>
                        </div>
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
                    </>
                  ) : (
                    <div className="flex justify-center">
                      <Button onClick={leaveMeeting} variant="destructive">
                        <Phone className="w-4 h-4 mr-2" />
                        Leave Meeting
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
