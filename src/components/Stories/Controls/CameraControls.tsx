import React from 'react';
import { Camera, Video, FileImage } from 'lucide-react';
import { motion } from 'framer-motion';

interface CameraControlsProps {
  activeTab: 'camera' | 'video' | 'upload';
  isRecording: boolean;
  onCapture: () => void;
  onStartRecording: () => void;
  onStopRecording: () => void;
  onTabChange: (tab: 'camera' | 'video' | 'upload') => void;
}

export const CameraControls: React.FC<CameraControlsProps> = ({
  activeTab,
  isRecording,
  onCapture,
  onStartRecording,
  onStopRecording,
  onTabChange
}) => {
  return (
    <div className="flex items-center justify-between px-8 py-4">
      <motion.button
        onClick={() => onTabChange('upload')}
        className="p-4 rounded-full bg-white/10 text-white"
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
      >
        <FileImage size={24} />
      </motion.button>
      
      {activeTab === 'video' ? (
        <motion.button
          onClick={isRecording ? onStopRecording : onStartRecording}
          className={`p-6 rounded-full ${
            isRecording ? 'bg-red-600' : 'bg-red-500'
          }`}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          animate={isRecording ? { scale: [1, 1.1, 1] } : {}}
          transition={{ repeat: Infinity, duration: 2 }}
        >
          <div className={`w-6 h-6 ${
            isRecording ? 'bg-white rounded' : 'rounded-full bg-white'
          }`}></div>
        </motion.button>
      ) : (
        <motion.button
          onClick={onCapture}
          className="p-6 rounded-full border-4 border-white"
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
        >
          <div className="w-6 h-6 rounded-full bg-white"></div>
        </motion.button>
      )}
      
      <motion.button
        onClick={() => onTabChange(activeTab === 'video' ? 'camera' : 'video')}
        className="p-4 rounded-full bg-white/10 text-white"
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
      >
        {activeTab === 'video' ? <Camera size={24} /> : <Video size={24} />}
      </motion.button>
    </div>
  );
};