import React, { useEffect, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Video, Phone } from 'lucide-react';
import { useAuthStore } from '@/lib/auth-store';
import { toast } from 'sonner';

// Import Zoom Meeting SDK from npm package
import { ZoomMtg } from '@zoom/meetingsdk';

interface MeetingConfig {
  meetingNumber: string;
  userName: string;
  role: number;
  signature: string;
  sdkKey: string;
  password: string;
}

export default function ZoomMeetingClean() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [sdkLoaded, setSdkLoaded] = useState(false);
  const [meetingConfig, setMeetingConfig] = useState<MeetingConfig | null>(null);
  const [isJoined, setIsJoined] = useState(false);
  const [meeting, setMeeting] = useState<any>(null);
  const zoomContainerRef = useRef<HTMLDivElement>(null);
  const { currentUser } = useAuthStore();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // Get meeting details from URL
  const meetingNumber = searchParams.get('meetingNumber');
  const role = parseInt(searchParams.get('role') || '1');

  // Initialize Zoom Meeting SDK
  useEffect(() => {
    const initializeZoomSDK = () => {
      try {
        console.log('Initializing Zoom SDK v6.0.0...');
        
        // Check if ZoomMtg is available
        if (typeof ZoomMtg !== 'undefined') {
          console.log('Zoom SDK available from npm package');
          setSdkLoaded(true);
          return;
        }
        
        console.error('Zoom SDK not available');
        setError('Zoom SDK not loaded');
      } catch (err) {
        console.error('Error initializing Zoom SDK:', err);
        setError('Failed to initialize Zoom SDK');
      }
    };

    if (!sdkLoaded) {
      initializeZoomSDK();
    }
  }, [sdkLoaded]);

  // Generate signature when component loads
  useEffect(() => {
    if (meetingNumber && sdkLoaded) {
      generateSignature();
    }
  }, [meetingNumber, sdkLoaded]);

  const generateSignature = async () => {
    try {
      setIsLoading(true);
      setError('');

      if (!meetingNumber) {
        throw new Error('No meeting number provided in URL');
      }

      console.log('Generating signature for meeting:', meetingNumber, 'role:', role);
      
      // First, get meeting details to extract password
      const meetingDetailsUrl = `https://quran-acadamy-crm-production.up.railway.app/api/meetings/${meetingNumber}`;
      
      const meetingResponse = await fetch(meetingDetailsUrl);
      if (!meetingResponse.ok) {
        throw new Error('Failed to fetch meeting details');
      }
      
      const meetingData = await meetingResponse.json();
      console.log('Meeting details fetched:', meetingData);
      
      if (!meetingData.success || !meetingData.meeting) {
        throw new Error('Meeting not found or invalid');
      }
      
      const meeting = meetingData.meeting;
      // Use the password from API response first, then meeting plainPassword, then fallback
      const meetingPassword = meetingData.password || meetingData.meeting.plainPassword || meetingData.meeting.zoomPassword || "123456";
      
      console.log('Meeting password extracted:', meetingPassword);
      console.log('Password debug:', {
        apiPassword: meetingData.password,
        plainPassword: meetingData.meeting.plainPassword,
        zoomPassword: meetingData.meeting.zoomPassword,
        debug: meetingData.debug
      });
      
      // Generate signature
      const signatureUrl = 'https://quran-acadamy-crm-production.up.railway.app/api/zoom/signature-test';
      
      const signatureResponse = await fetch(signatureUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          meetingNumber: meetingNumber,
          role: role,
        }),
      });

      if (signatureResponse.ok) {
        const signatureData = await signatureResponse.json();
        console.log('Backend signature generated successfully');
        
        if (!signatureData.signature) {
          throw new Error('No signature returned from backend');
        }
        
        const config: MeetingConfig = {
          meetingNumber: meetingNumber,
          userName: currentUser?.name || 'User',
          role: role,
          signature: signatureData.signature,
          sdkKey: process.env.VITE_ZOOM_SDK_KEY || 'YNdDIn95StmFL25wVBoGQ',
          password: meetingPassword
        };
        
        setMeetingConfig(config);
        console.log('Zoom meeting config prepared:', config);
      } else {
        const errorData = await signatureResponse.json();
        throw new Error(`Signature generation failed: ${errorData.error || signatureResponse.statusText}`);
      }
    } catch (err) {
      console.error('Error generating signature:', err);
      setError(err instanceof Error ? err.message : 'Failed to generate meeting signature. Please try again.');
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

      console.log('Joining Zoom meeting with classic ZoomMtg API...');
      
      // Initialize Zoom SDK with correct v6.0.0 options
      ZoomMtg.init({
        leaveUrl: '/',
        disablePreview: true,
        success: () => {
          console.log('Zoom SDK initialized successfully');
          
          // Join meeting
          ZoomMtg.join({
            meetingNumber: meetingConfig.meetingNumber,
            userName: meetingConfig.userName,
            signature: meetingConfig.signature,
            sdkKey: meetingConfig.sdkKey,
            passWord: meetingConfig.password,
            success: (success: any) => {
              console.log('Successfully joined Zoom meeting:', success);
              setIsJoined(true);
              toast.success('Joined Zoom meeting successfully');
            },
            error: (error: any) => {
              console.error('Error joining Zoom meeting:', error);
              setError('Failed to join meeting: ' + (error.errorMessage || error.message || 'Unknown error'));
              toast.error('Failed to join meeting');
            }
          });
        },
        error: (error: any) => {
          console.error('Zoom SDK initialization error:', error);
          setError('Failed to initialize Zoom SDK: ' + (error.errorMessage || error.message || 'Unknown error'));
          toast.error('Failed to initialize Zoom SDK');
        }
      });
      
    } catch (err) {
      console.error('Error joining meeting:', err);
      setError('Failed to join meeting: ' + (err instanceof Error ? err.message : 'Unknown error'));
      toast.error('Failed to join meeting');
    } finally {
      setIsLoading(false);
    }
  };

  const leaveMeeting = () => {
    try {
      setIsJoined(false);
      navigate('/dashboard');
      toast.success('Left meeting');
    } catch (error) {
      console.error('Error leaving meeting:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-6xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Zoom Meeting</h1>
              <p className="text-gray-600">Meeting ID: {meetingNumber || 'N/A'}</p>
            </div>
            <Button 
              onClick={() => navigate('/dashboard')} 
              variant="outline"
            >
              Back to Dashboard
            </Button>
          </div>

          {error && (
            <Alert variant="destructive" className="mb-6">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Video className="w-5 h-5" />
                  Meeting Room
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
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
                        <p className="text-sm mt-2">Meeting Number: {meetingNumber}</p>
                        <p className="text-sm">User: {currentUser?.name || 'Guest'}</p>
                        <p className="text-sm">SDK Status: {sdkLoaded ? 'Loaded' : 'Loading...'}</p>
                      </div>
                    </div>
                  )}
                </div>
                
                {!isJoined ? (
                  <Button
                    onClick={joinMeeting}
                    disabled={isLoading || !sdkLoaded || !meetingConfig}
                    className="w-full"
                    size="lg"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Joining Meeting...
                      </>
                    ) : (
                      <>
                        <Video className="w-4 h-4 mr-2" />
                        Join Meeting
                      </>
                    )}
                  </Button>
                ) : (
                  <div className="flex justify-center">
                    <Button onClick={leaveMeeting} variant="destructive" size="lg">
                      <Phone className="w-4 h-4 mr-2" />
                      Leave Meeting
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
