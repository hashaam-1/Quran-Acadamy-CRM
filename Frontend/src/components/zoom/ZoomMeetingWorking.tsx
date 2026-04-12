import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Video, VideoOff, Mic, MicOff, Users, Phone, Monitor, Settings } from 'lucide-react';
import { useAuthStore } from '@/lib/auth-store';
import { toast } from 'sonner';

interface ZoomMeetingProps {
  isOpen: boolean;
  onClose: () => void;
  meetingNumber?: string;
  userName?: string;
  role?: number; // 0 for host, 1 for participant
}

export function ZoomMeetingWorking({ isOpen, onClose, meetingNumber = '', userName = '', role = 1 }: ZoomMeetingProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [isJoined, setIsJoined] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOn, setIsVideoOn] = useState(true);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [error, setError] = useState('');
  const [participantCount, setParticipantCount] = useState(1);
  const { currentUser } = useAuthStore();

  // Simulate meeting join
  const joinMeeting = async () => {
    if (!meetingNumber) {
      setError('No meeting number available');
      return;
    }

    try {
      setIsLoading(true);
      setError('');

      // Simulate API call and SDK initialization
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Simulate successful join
      setIsJoined(true);
      setParticipantCount(Math.floor(Math.random() * 5) + 2); // Random participants
      toast.success('Successfully joined meeting');
      
      // Show demo notification
      toast.info('Demo mode: Simulated Zoom meeting interface');
    } catch (err) {
      console.error('Error joining meeting:', err);
      setError('Failed to join meeting. Please try again.');
      toast.error('Failed to join meeting');
    } finally {
      setIsLoading(false);
    }
  };

  const leaveMeeting = () => {
    setIsJoined(false);
    setIsMuted(false);
    setIsVideoOn(true);
    setIsScreenSharing(false);
    setParticipantCount(1);
    toast.success('Left meeting');
    onClose();
  };

  const toggleMute = () => {
    if (isJoined) {
      setIsMuted(!isMuted);
      toast.info(isMuted ? 'Microphone unmuted' : 'Microphone muted');
    }
  };

  const toggleVideo = () => {
    if (isJoined) {
      setIsVideoOn(!isVideoOn);
      toast.info(isVideoOn ? 'Video stopped' : 'Video started');
    }
  };

  const toggleScreenShare = () => {
    if (isJoined) {
      setIsScreenSharing(!isScreenSharing);
      toast.info(isScreenSharing ? 'Screen sharing stopped' : 'Screen sharing started');
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Video className="h-5 w-5 text-green-600" />
            Zoom Meeting - Demo Mode
          </DialogTitle>
          <DialogDescription>
            Join your scheduled Quran class via Zoom video conference (Demo Interface)
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
                  <label className="text-sm font-medium">Status</label>
                  <Badge variant={isJoined ? "default" : "secondary"}>
                    {isJoined ? "In Meeting" : "Not Joined"}
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

          {/* Demo Mode Notice */}
          <Alert>
            <AlertDescription>
              <strong>Demo Mode:</strong> This is a simulated Zoom meeting interface for testing purposes. 
              The actual Zoom integration will be available once backend deployment is complete.
            </AlertDescription>
          </Alert>

          {/* Video Area */}
          <div className="w-full h-96 bg-gray-900 rounded-lg flex items-center justify-center relative overflow-hidden">
            {!isJoined ? (
              <div className="text-center space-y-4 text-white">
                <Video className="h-16 w-16 mx-auto opacity-50" />
                <div>
                  <h3 className="text-xl font-semibold">Ready to Join Meeting</h3>
                  <p className="text-sm opacity-75">
                    Click the button below to join the Zoom meeting
                  </p>
                </div>
                <Button 
                  onClick={joinMeeting} 
                  disabled={isLoading || !meetingNumber}
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
                      Join Meeting
                    </>
                  )}
                </Button>
              </div>
            ) : (
              <div className="w-full h-full relative">
                {/* Simulated Video Grid */}
                <div className="grid grid-cols-2 gap-2 p-4 h-full">
                  {/* Main Video (You) */}
                  <div className="bg-gray-800 rounded-lg flex items-center justify-center relative">
                    <div className="text-center text-white">
                      {isVideoOn ? (
                        <div className="w-20 h-20 bg-gray-600 rounded-full flex items-center justify-center mb-2">
                          <Users className="h-10 w-10" />
                        </div>
                      ) : (
                        <div className="w-20 h-20 bg-gray-700 rounded-full flex items-center justify-center mb-2">
                          <VideoOff className="h-10 w-10" />
                        </div>
                      )}
                      <p className="text-sm font-medium">{userName || currentUser?.name || 'You'}</p>
                      {isMuted && <MicOff className="h-4 w-4 mx-auto mt-1 text-red-500" />}
                      {role === 0 && <Badge className="mt-1" variant="default">Host</Badge>}
                    </div>
                  </div>

                  {/* Other Participants */}
                  {Array.from({ length: Math.min(participantCount - 1, 3) }, (_, i) => (
                    <div key={i} className="bg-gray-800 rounded-lg flex items-center justify-center">
                      <div className="text-center text-white">
                        <div className="w-16 h-16 bg-gray-600 rounded-full flex items-center justify-center mb-2">
                          <Users className="h-8 w-8" />
                        </div>
                        <p className="text-xs">Participant {i + 1}</p>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Screen Share Overlay */}
                {isScreenSharing && (
                  <div className="absolute inset-0 bg-blue-900 bg-opacity-75 flex items-center justify-center">
                    <div className="text-center text-white">
                      <Monitor className="h-16 w-16 mx-auto mb-2" />
                      <p className="text-lg font-semibold">Screen Sharing</p>
                    </div>
                  </div>
                )}
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

export function JoinClassButtonWorking({ meetingNumber, className }: JoinClassButtonProps) {
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

      <ZoomMeetingWorking
        isOpen={isZoomOpen}
        onClose={() => setIsZoomOpen(false)}
        meetingNumber={meetingNumber}
        userName={currentUser?.name}
        role={currentUser?.role === 'teacher' ? 0 : 1}
      />
    </>
  );
}
