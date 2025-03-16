import React, { useState } from 'react';
import { useInviteCode } from '../../contexts/InviteCodeContext';
import { EventTheme } from '../../types';

interface InviteCodeModalProps {
  onClose: () => void;
}

const InviteCodeModal: React.FC<InviteCodeModalProps> = ({ onClose }) => {
  const [code, setCode] = useState<string>('');
  const { handleInviteCodeSuccess } = useInviteCode();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!code.trim()) {
      return;
    }
    
    // Example theme for demo - in real app would be fetched from the server
    const demoTheme: EventTheme = {
      id: '1',
      name: 'Summer Festival',
      primaryColor: '#FF9F1C',
      secondaryColor: '#2EC4B6',
      accentColor: '#E71D36',
      fontFamily: 'Poppins, sans-serif',
      logoUrl: 'https://example.com/summer-fest-logo.png'
    };
    
    handleInviteCodeSuccess(code, demoTheme);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full">
        <h2 className="text-2xl font-bold mb-4">Enter Invite Code</h2>
        
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <input
              type="text"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="Enter your invite code"
              className="w-full p-2 border border-gray-300 rounded"
              autoFocus
            />
          </div>
          
          <div className="flex justify-end space-x-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              Submit
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default InviteCodeModal;
