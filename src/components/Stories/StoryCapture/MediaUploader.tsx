import React, { useState, useRef } from 'react';
import { FileImage, Upload, X, Image, Film } from 'lucide-react';

interface MediaUploaderProps {
  onMediaSelect: (file: File) => void;
}

export const MediaUploader: React.FC<MediaUploaderProps> = ({ onMediaSelect }) => {
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };
  
  const handleDragLeave = () => {
    setIsDragging(false);
  };
  
  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      validateAndProcessFile(file);
    }
  };
  
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      validateAndProcessFile(file);
      
      // Reset the input value to allow selecting the same file again
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };
  
  const validateAndProcessFile = (file: File) => {
    // Check if file is an image or video
    if (!file.type.startsWith('image/') && !file.type.startsWith('video/')) {
      alert('Please select an image or video file.');
      return;
    }
    
    // Check file size (10MB limit for example)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      alert('File size exceeds the limit (10MB).');
      return;
    }
    
    onMediaSelect(file);
  };
  
  const triggerFileInput = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };
  
  return (
    <div className="w-full h-full flex flex-col items-center justify-center p-6">
      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*,video/*"
        onChange={handleFileChange}
        style={{ display: 'none' }}
      />
      
      {/* Drop zone */}
      <div
        className={`w-full max-w-md h-64 border-2 border-dashed rounded-lg flex flex-col items-center justify-center p-6 transition-colors ${
          isDragging ? 'border-blue-500 bg-blue-500/10' : 'border-gray-600 bg-gray-800/50'
        }`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={triggerFileInput}
      >
        <FileImage 
          size={48} 
          className={`mb-4 ${isDragging ? 'text-blue-400' : 'text-gray-400'}`} 
        />
        
        <h3 className="text-lg font-medium text-white mb-2">
          {isDragging ? 'Drop to upload' : 'Upload media'}
        </h3>
        
        <p className="text-sm text-gray-400 text-center mb-4">
          Drag and drop or click to select an image or video
        </p>
        
        <button
          type="button"
          className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-full text-white text-sm flex items-center gap-1"
        >
          <Upload size={16} />
          Browse Files
        </button>
      </div>
      
      {/* Accepted file types */}
      <div className="mt-6 flex flex-col items-center">
        <p className="text-sm text-gray-400 mb-2">Accepted file types:</p>
        <div className="flex gap-6">
          <div className="flex items-center gap-1 text-gray-300 text-sm">
            <Image size={16} className="text-purple-400" />
            Images
          </div>
          <div className="flex items-center gap-1 text-gray-300 text-sm">
            <Film size={16} className="text-green-400" />
            Videos
          </div>
        </div>
      </div>
    </div>
  );
};

export default MediaUploader;
