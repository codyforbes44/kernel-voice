import { Mic, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface MicrophonePermissionRequestProps {
  permissionState: 'checking' | 'granted' | 'denied' | 'prompt';
  onRequestPermission: () => Promise<boolean>;
}

const MicrophonePermissionRequest = ({ 
  permissionState, 
  onRequestPermission 
}: MicrophonePermissionRequestProps) => {
  
  if (permissionState === 'checking') {
    return (
      <div className="text-center p-4">
        <p className="text-sm text-muted-foreground">Checking microphone access...</p>
      </div>
    );
  }

  if (permissionState === 'denied') {
    return (
      <Alert variant="destructive" className="mb-4">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          <div className="space-y-2">
            <p className="font-semibold">Microphone access is blocked</p>
            <p className="text-sm">To use voice features, please enable microphone access in your browser settings:</p>
            <ol className="text-sm list-decimal list-inside space-y-1 ml-2">
              <li>Click the lock/info icon in your address bar</li>
              <li>Find "Microphone" in the permissions list</li>
              <li>Change it to "Allow"</li>
              <li>Reload this page</li>
            </ol>
          </div>
        </AlertDescription>
      </Alert>
    );
  }

  if (permissionState === 'prompt') {
    return (
      <div className="rounded-lg border border-primary/20 bg-primary/5 p-4 mb-4">
        <div className="flex items-start gap-3">
          <div className="mt-0.5">
            <Mic className="h-5 w-5 text-primary" />
          </div>
          <div className="flex-1 space-y-3">
            <div>
              <p className="font-semibold text-sm mb-1">Microphone Access Required</p>
              <p className="text-sm text-muted-foreground">
                To have voice conversations, we need access to your microphone. 
                Your browser will ask for permission when you click below.
              </p>
            </div>
            <Button 
              onClick={onRequestPermission}
              size="sm"
              className="w-full sm:w-auto"
            >
              <Mic className="h-4 w-4 mr-2" />
              Enable Microphone
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return null;
};

export default MicrophonePermissionRequest;
