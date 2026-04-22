import React, { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Monitor, MonitorOff, Users, Eye, EyeOff, Settings, Maximize2, Minimize2 } from 'lucide-react';
import { toast } from 'sonner';

interface ScreenShareManagerProps {
  meeting: any;
  isHost: boolean;
  currentUser: any;
  onShareStatusChange?: (isSharing: boolean) => void;
}

interface ShareStatus {
  isSharing: boolean;
  isViewing: boolean;
  shareSource: string;
  viewerCount: number;
  activeSharer?: any;
}

export default function ScreenShareManager({
  meeting,
  isHost,
  currentUser,
  onShareStatusChange
}: ScreenShareManagerProps) {
  const [shareStatus, setShareStatus] = useState<ShareStatus>({
    isSharing: false,
    isViewing: false,
    shareSource: '',
    viewerCount: 0
  });
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [availableSources, setAvailableSources] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const shareContainerRef = useRef<HTMLDivElement>(null);

  // Initialize screen sharing capabilities
  useEffect(() => {
    if (meeting && typeof window !== 'undefined') {
      initializeScreenSharing();
    }
  }, [meeting]);

  const initializeScreenSharing = async () => {
    try {
      // Check if screen sharing is available
      if (!navigator.mediaDevices || !navigator.mediaDevices.getDisplayMedia) {
        setError('Screen sharing is not supported in this browser');
        return;
      }

      // Get available screen sources
      const sources = await getScreenSources();
      setAvailableSources(sources);
      
      console.log('Screen sharing initialized with sources:', sources);
    } catch (err) {
      console.error('Error initializing screen sharing:', err);
      setError('Failed to initialize screen sharing');
    }
  };

  const getScreenSources = async (): Promise<any[]> => {
    try {
      // Get available screen sources (windows, tabs, monitors)
      const sources = [];
      
      // For now, we'll use the default screen capture API
      // In a full implementation, you might use Electron's desktopCapturer or other APIs
      sources.push({
        id: 'screen',
        name: 'Entire Screen',
        type: 'screen'
      });
      
      sources.push({
        id: 'window',
        name: 'Application Window',
        type: 'window'
      });
      
      sources.push({
        id: 'browser',
        name: 'Browser Tab',
        type: 'browser'
      });

      return sources;
    } catch (err) {
      console.error('Error getting screen sources:', err);
      return [];
    }
  };

  const startScreenShare = async (sourceId: string) => {
    try {
      setIsLoading(true);
      setError('');

      // Request screen sharing permission
      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: {
          cursor: 'always'
        },
        audio: false
      });

      if (!stream) {
        throw new Error('Failed to get screen sharing stream');
      }

      // Create video element for the shared screen
      const videoElement = document.createElement('video');
      videoElement.srcObject = stream;
      videoElement.autoplay = true;
      videoElement.muted = true;

      // Add to share container
      if (shareContainerRef.current) {
        shareContainerRef.current.innerHTML = '';
        shareContainerRef.current.appendChild(videoElement);
      }

      // Handle stream end
      stream.getVideoTracks()[0].addEventListener('ended', () => {
        stopScreenShare();
      });

      // Update share status
      const newStatus = {
        isSharing: true,
        isViewing: false,
        shareSource: sourceId,
        viewerCount: 1
      };
      setShareStatus(newStatus);
      
      // Notify parent component
      onShareStatusChange?.(true);
      
      // Show success message
      toast.success('Screen sharing started successfully');
      
      // Close dialog
      setIsDialogOpen(false);

      console.log('Screen sharing started:', sourceId);

    } catch (err) {
      console.error('Error starting screen share:', err);
      setError(err instanceof Error ? err.message : 'Failed to start screen sharing');
      toast.error('Failed to start screen sharing');
    } finally {
      setIsLoading(false);
    }
  };

  const stopScreenShare = () => {
    try {
      // Clear the share container
      if (shareContainerRef.current) {
        shareContainerRef.current.innerHTML = '';
      }

      // Update share status
      const newStatus = {
        isSharing: false,
        isViewing: false,
        shareSource: '',
        viewerCount: 0
      };
      setShareStatus(newStatus);
      
      // Notify parent component
      onShareStatusChange?.(false);
      
      toast.success('Screen sharing stopped');
      
      console.log('Screen sharing stopped');

    } catch (err) {
      console.error('Error stopping screen share:', err);
      setError('Failed to stop screen sharing');
    }
  };

  const toggleScreenView = () => {
    const newStatus = {
      ...shareStatus,
      isViewing: !shareStatus.isViewing
    };
    setShareStatus(newStatus);
    
    toast.info(shareStatus.isViewing ? 'Screen view hidden' : 'Screen view shown');
  };

  const maximizeView = () => {
    // Implement maximize functionality
    if (shareContainerRef.current) {
      shareContainerRef.current.requestFullscreen?.();
    }
  };

  const getShareIcon = () => {
    if (shareStatus.isSharing) {
      return <MonitorOff className="h-4 w-4" />;
    }
    return <Monitor className="h-4 w-4" />;
  };

  const getShareButtonText = () => {
    if (shareStatus.isSharing) {
      return 'Stop Sharing';
    }
    return 'Share Screen';
  };

  const getShareButtonVariant = () => {
    if (shareStatus.isSharing) {
      return 'destructive';
    }
    return 'default';
  };

  // Render screen sharing controls
  if (!isHost && !shareStatus.isViewing) {
    return null; // Only hosts can start sharing, participants can only view
  }

  return (
    <>
      {/* Screen Sharing Controls */}
      <Card className="w-full">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            {getShareIcon()}
            Screen Sharing
            {shareStatus.isSharing && (
              <Badge variant="default" className="ml-2">
                Live
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Share Status */}
          <div className="flex items-center justify-between">
            <div className="text-sm text-muted-foreground">
              {shareStatus.isSharing ? (
                <span className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                  Sharing your screen
                </span>
              ) : (
                'Not sharing'
              )}
            </div>
            {shareStatus.viewerCount > 0 && (
              <div className="flex items-center gap-1 text-sm text-muted-foreground">
                <Users className="h-4 w-4" />
                {shareStatus.viewerCount} viewing
              </div>
            )}
          </div>

          {/* Control Buttons */}
          <div className="flex gap-2">
            {isHost && (
              <Button
                variant={getShareButtonVariant()}
                onClick={() => {
                  if (shareStatus.isSharing) {
                    stopScreenShare();
                  } else {
                    setIsDialogOpen(true);
                  }
                }}
                disabled={isLoading}
                className="flex-1"
              >
                {isLoading ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  getShareIcon()
                )}
                {getShareButtonText()}
              </Button>
            )}

            {shareStatus.isSharing && (
              <Button
                variant="outline"
                size="sm"
                onClick={toggleScreenView}
              >
                {shareStatus.isViewing ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </Button>
            )}

            {shareStatus.isSharing && (
              <Button
                variant="outline"
                size="sm"
                onClick={maximizeView}
              >
                <Maximize2 className="h-4 w-4" />
              </Button>
            )}
          </div>

          {/* Error Display */}
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Screen Share Preview */}
          {shareStatus.isSharing && shareStatus.isViewing && (
            <div className="border rounded-lg overflow-hidden bg-black">
              <div
                ref={shareContainerRef}
                className="w-full h-64 flex items-center justify-center"
              >
                <p className="text-white text-sm">Screen share preview...</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Screen Source Selection Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Select Screen to Share</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            {availableSources.map((source) => (
              <Button
                key={source.id}
                variant="outline"
                onClick={() => startScreenShare(source.id)}
                disabled={isLoading}
                className="w-full justify-start"
              >
                <Monitor className="h-4 w-4 mr-2" />
                {source.name}
              </Button>
            ))}
            
            {availableSources.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-4">
                No screen sources available
              </p>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
