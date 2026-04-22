import React, { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Monitor, MonitorOff, Users, Eye, EyeOff, Settings, Maximize2, Minimize2, Share, Share2 } from 'lucide-react';
import { toast } from 'sonner';

interface ZoomScreenShareProps {
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
  shareQuality: 'low' | 'medium' | 'high';
}

export default function ZoomScreenShare({
  meeting,
  isHost,
  currentUser,
  onShareStatusChange
}: ZoomScreenShareProps) {
  const [shareStatus, setShareStatus] = useState<ShareStatus>({
    isSharing: false,
    isViewing: false,
    shareSource: '',
    viewerCount: 0,
    shareQuality: 'high'
  });
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [availableSources, setAvailableSources] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [shareSettings, setShareSettings] = useState({
    shareAudio: false,
    shareVideo: true,
    optimizeFor: 'video' as 'video' | 'text' | 'detail'
  });
  const shareContainerRef = useRef<HTMLDivElement>(null);
  const zoomSdkRef = useRef<any>(null);

  // Initialize Zoom SDK screen sharing
  useEffect(() => {
    if (meeting && typeof window !== 'undefined') {
      initializeZoomScreenSharing();
    }
  }, [meeting]);

  const initializeZoomScreenSharing = async () => {
    try {
      // Check if Zoom SDK is available
      if (typeof window !== 'undefined' && (window as any).ZoomMtg) {
        zoomSdkRef.current = (window as any).ZoomMtg;
        console.log('Zoom SDK available for screen sharing');
        
        // Set up event listeners for screen sharing
        setupZoomEventListeners();
      } else {
        console.log('Zoom SDK not available, using browser screen sharing');
      }

      // Get available screen sources
      const sources = await getScreenSources();
      setAvailableSources(sources);
      
    } catch (err) {
      console.error('Error initializing screen sharing:', err);
      setError('Failed to initialize screen sharing');
    }
  };

  const setupZoomEventListeners = () => {
    if (!zoomSdkRef.current) return;

    // Listen for screen share events
    zoomSdkRef.current.inMeeting?.serviceListeners?.('shareScreen', () => {
      console.log('Screen share started');
      setShareStatus(prev => ({ ...prev, isSharing: true }));
      onShareStatusChange?.(true);
      toast.success('Screen sharing started');
    });

    zoomSdkRef.current.inMeeting?.serviceListeners?.('stopScreenShare', () => {
      console.log('Screen share stopped');
      setShareStatus(prev => ({ ...prev, isSharing: false }));
      onShareStatusChange?.(false);
      toast.success('Screen sharing stopped');
    });

    zoomSdkRef.current.inMeeting?.serviceListeners?.('activeShareChange', (data: any) => {
      console.log('Active share changed:', data);
      if (data.state === 'Active') {
        setShareStatus(prev => ({
          ...prev,
          isViewing: true,
          activeSharer: data.userId,
          viewerCount: data.participantCount || 1
        }));
      } else {
        setShareStatus(prev => ({
          ...prev,
          isViewing: false,
          activeSharer: undefined,
          viewerCount: 0
        }));
      }
    });
  };

  const getScreenSources = async (): Promise<any[]> => {
    try {
      const sources = [];
      
      // Check if we can get detailed screen sources
      if (navigator.mediaDevices && navigator.mediaDevices.getDisplayMedia) {
        sources.push({
          id: 'screen',
          name: 'Entire Screen',
          type: 'screen',
          thumbnail: 'screen'
        });
        
        sources.push({
          id: 'window',
          name: 'Application Window',
          type: 'window',
          thumbnail: 'window'
        });
        
        sources.push({
          id: 'browser',
          name: 'Browser Tab',
          type: 'browser',
          thumbnail: 'browser'
        });
      }

      return sources;
    } catch (err) {
      console.error('Error getting screen sources:', err);
      return [];
    }
  };

  const startZoomScreenShare = async (sourceId: string) => {
    try {
      setIsLoading(true);
      setError('');

      // Try to use Zoom SDK first
      if (zoomSdkRef.current && zoomSdkRef.current.inMeeting?.shareScreen) {
        console.log('Starting Zoom screen share with source:', sourceId);
        
        // Use Zoom's native screen sharing
        zoomSdkRef.current.inMeeting.shareScreen({
          shareAudio: shareSettings.shareAudio,
          shareVideo: shareSettings.shareVideo,
          optimizeFor: shareSettings.optimizeFor,
          success: () => {
            console.log('Zoom screen share started successfully');
            setIsDialogOpen(false);
          },
          error: (err: any) => {
            console.error('Zoom screen share error:', err);
            // Fallback to browser screen sharing
            startBrowserScreenShare(sourceId);
          }
        });
      } else {
        // Fallback to browser screen sharing
        startBrowserScreenShare(sourceId);
      }

    } catch (err) {
      console.error('Error starting Zoom screen share:', err);
      setError(err instanceof Error ? err.message : 'Failed to start screen sharing');
      toast.error('Failed to start screen sharing');
    } finally {
      setIsLoading(false);
    }
  };

  const startBrowserScreenShare = async (sourceId: string) => {
    try {
      console.log('Starting browser screen share with source:', sourceId);

      // Request screen sharing permission
      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: {
          cursor: 'always',
          frameRate: { ideal: 30, max: 60 },
          width: { ideal: 1920, max: 3840 },
          height: { ideal: 1080, max: 2160 }
        },
        audio: shareSettings.shareAudio
      });

      if (!stream) {
        throw new Error('Failed to get screen sharing stream');
      }

      // Create video element for the shared screen
      const videoElement = document.createElement('video');
      videoElement.srcObject = stream;
      videoElement.autoplay = true;
      videoElement.muted = true;
      videoElement.style.width = '100%';
      videoElement.style.height = '100%';
      videoElement.style.objectFit = 'contain';

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
        viewerCount: 1,
        shareQuality: 'high' as const
      };
      setShareStatus(newStatus);
      
      // Notify parent component
      onShareStatusChange?.(true);
      
      // Show success message
      toast.success('Screen sharing started successfully');
      
      // Close dialog
      setIsDialogOpen(false);

      console.log('Browser screen sharing started:', sourceId);

    } catch (err) {
      console.error('Error starting browser screen share:', err);
      setError(err instanceof Error ? err.message : 'Failed to start screen sharing');
      toast.error('Failed to start screen sharing');
    }
  };

  const stopScreenShare = () => {
    try {
      // Try to stop Zoom screen share first
      if (zoomSdkRef.current && zoomSdkRef.current.inMeeting?.stopShare) {
        console.log('Stopping Zoom screen share');
        zoomSdkRef.current.inMeeting.stopShare();
      }

      // Clear the share container
      if (shareContainerRef.current) {
        shareContainerRef.current.innerHTML = '';
      }

      // Update share status
      const newStatus = {
        isSharing: false,
        isViewing: false,
        shareSource: '',
        viewerCount: 0,
        shareQuality: 'high' as const
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
              <Badge variant="default" className="ml-2 animate-pulse">
                <div className="w-2 h-2 bg-red-500 rounded-full mr-1"></div>
                Live
              </Badge>
            )}
            {shareStatus.isViewing && (
              <Badge variant="secondary" className="ml-2">
                <Eye className="h-3 w-3 mr-1" />
                Viewing
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
                  <Badge variant="outline" className="ml-2">
                    {shareStatus.shareQuality}
                  </Badge>
                </span>
              ) : shareStatus.isViewing ? (
                <span className="flex items-center gap-2">
                  <Eye className="h-4 w-4" />
                  Viewing shared screen
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

          {/* Share Settings */}
          {isHost && !shareStatus.isSharing && (
            <div className="space-y-2">
              <h4 className="text-sm font-medium">Share Settings:</h4>
              <div className="flex gap-2">
                <Button
                  variant={shareSettings.shareAudio ? "default" : "outline"}
                  size="sm"
                  onClick={() => setShareSettings(prev => ({ ...prev, shareAudio: !prev.shareAudio }))}
                >
                  Share Audio
                </Button>
                <Button
                  variant={shareSettings.shareVideo ? "default" : "outline"}
                  size="sm"
                  onClick={() => setShareSettings(prev => ({ ...prev, shareVideo: !prev.shareVideo }))}
                >
                  Share Video
                </Button>
              </div>
            </div>
          )}

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
                onClick={() => startZoomScreenShare(source.id)}
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
