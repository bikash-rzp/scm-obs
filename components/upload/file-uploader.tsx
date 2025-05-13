import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, FileText, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { uploadExcelFile } from '@/lib/api';
import { toast } from 'sonner';
import { UploadResponse } from '@/lib/types';

interface FileUploaderProps {
  onUploadSuccess?: (response: UploadResponse) => void;
}

const FileUploader = ({ onUploadSuccess }: FileUploaderProps) => {
  const [uploading, setUploading] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    // Filter for Excel files only
    const excelFiles = acceptedFiles.filter(file => 
      file.type === 'application/vnd.ms-excel' || 
      file.type === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
      file.name.endsWith('.xlsx') || 
      file.name.endsWith('.xls')
    );
    
    if (excelFiles.length < acceptedFiles.length) {
      toast.warning('Some files were ignored because they are not Excel files.');
    }
    
    setSelectedFiles(excelFiles);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({ 
    onDrop,
    accept: {
      'application/vnd.ms-excel': ['.xls'],
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx']
    }
  });

  const handleUpload = async () => {
    if (selectedFiles.length === 0) return;
    
    setUploading(true);
    
    try {
      for (const file of selectedFiles) {
        toast.info(`Uploading ${file.name}...`);
        const response = await uploadExcelFile(file);
        toast.success(`Uploaded ${file.name} successfully!`);
        
        if (onUploadSuccess) {
          onUploadSuccess(response);
        }
      }
    } catch (error) {
      console.error('Upload error:', error);
      toast.error('Failed to upload files. Please try again.');
    } finally {
      setUploading(false);
      setSelectedFiles([]);
    }
  };

  const clearFiles = () => {
    setSelectedFiles([]);
  };

  return (
    <div className="space-y-4">
      <div
        {...getRootProps()}
        className={`border-2 border-dashed rounded-lg p-8 cursor-pointer transition-colors ${
          isDragActive ? 'border-primary bg-primary/5' : 'border-muted-foreground/20'
        }`}
      >
        <input {...getInputProps()} />
        <div className="flex flex-col items-center justify-center gap-2 text-center">
          <Upload className="h-10 w-10 text-muted-foreground" />
          <h3 className="text-lg font-medium">
            {isDragActive ? 'Drop the files here...' : 'Drag & drop Excel files here'}
          </h3>
          <p className="text-sm text-muted-foreground">
            Or click to browse your device
          </p>
        </div>
      </div>

      {selectedFiles.length > 0 && (
        <Card className="p-4">
          <h3 className="text-sm font-medium mb-2">Selected Files ({selectedFiles.length})</h3>
          <ul className="space-y-2">
            {selectedFiles.map((file, index) => (
              <li key={index} className="flex items-center gap-2 text-sm">
                <FileText className="h-4 w-4 text-muted-foreground" />
                <span>{file.name}</span>
                <span className="text-xs text-muted-foreground ml-auto">
                  {(file.size / 1024).toFixed(1)} KB
                </span>
              </li>
            ))}
          </ul>
          <div className="flex gap-2 mt-4">
            <Button 
              onClick={handleUpload} 
              disabled={uploading}
              className="w-full"
            >
              {uploading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Upload {selectedFiles.length} {selectedFiles.length === 1 ? 'File' : 'Files'}
            </Button>
            <Button 
              variant="outline" 
              onClick={clearFiles}
              disabled={uploading}
            >
              Clear
            </Button>
          </div>
        </Card>
      )}
    </div>
  );
};

export default FileUploader; 