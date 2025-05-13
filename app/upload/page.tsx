'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import FileUploader from '@/components/upload/file-uploader';
import { UploadResponse } from '@/lib/types';
import { AlertTriangle, CheckCircle2, FileText } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

export default function UploadPage() {
  const [lastUpload, setLastUpload] = useState<UploadResponse | null>(null);

  const handleUploadSuccess = (response: UploadResponse) => {
    setLastUpload(response);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Data Upload</h1>
        <p className="text-muted-foreground">Upload Excel files from various sources to ingest into the system.</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Upload Excel Files</CardTitle>
            <CardDescription>
              Upload Excel files containing device activities. The system will automatically detect and process the data.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <FileUploader onUploadSuccess={handleUploadSuccess} />
          </CardContent>
        </Card>

        {lastUpload && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle>Upload Results</CardTitle>
              <CardDescription>
                Summary of the most recent file processing
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3">
                <FileText className="h-5 w-5 text-muted-foreground" />
                <div>
                  <div className="font-medium">{lastUpload.filename}</div>
                  <div className="text-sm text-muted-foreground">Processed successfully</div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="rounded-lg bg-muted p-3">
                  <div className="text-sm font-medium text-muted-foreground">Activities Added</div>
                  <div className="text-2xl font-bold">{lastUpload.activities_added}</div>
                </div>
                <div className="rounded-lg bg-muted p-3">
                  <div className="text-sm font-medium text-muted-foreground">Devices Affected</div>
                  <div className="text-2xl font-bold">{lastUpload.devices_affected}</div>
                </div>
              </div>

              <div className="rounded-lg bg-muted p-3">
                <div className="text-sm font-medium text-muted-foreground">New Devices</div>
                <div className="text-2xl font-bold">{lastUpload.new_devices}</div>
              </div>

              {lastUpload.anomalies_detected > 0 ? (
                <Alert variant="destructive">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertTitle>Anomalies Detected</AlertTitle>
                  <AlertDescription>
                    {lastUpload.anomalies_detected} anomalies were detected during processing.
                    Check the Anomalies section for details.
                  </AlertDescription>
                </Alert>
              ) : (
                <Alert variant="default" className="bg-green-50 border-green-200">
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                  <AlertTitle className="text-green-700">No Anomalies</AlertTitle>
                  <AlertDescription className="text-green-600">
                    No anomalies were detected during processing.
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
} 