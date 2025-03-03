import React, { useState } from 'react';
import { QrCode, CheckCircle, AlertCircle, KeyRound } from 'lucide-react';
import { EVENT_THEMES } from '../../constants';
import type { EventTheme } from '../../types';

interface InviteCodeEntryProps {
  onSuccess: (inviteCode: string, theme?: EventTheme) => void;
  onCancel: () => void;
}

export const InviteCodeEntry: React.FC<InviteCodeEntryProps> = ({ onSuccess, onCancel }) => {
  const [inviteCode, setInviteCode] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');
  const [showScanner, setShowScanner] = useState(false);
  const [matchedTheme, setMatchedTheme] = useState<EventTheme | undefined>(undefined);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteCode.trim()) return;
    
    setStatus('loading');
    
    try {
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 800));
      
      // For demo purposes, check if the code matches any in our constants
      // In a real app, this would be a call to check the code in a database
      let foundTheme: EventTheme | undefined;
      const upperCaseCode = inviteCode.toUpperCase();
      
      // Check for special event codes
      if (upperCaseCode === 'SPRING2025') {
        foundTheme = EVENT_THEMES.find(theme => theme.id === 'spring-training');
      } else if (upperCaseCode === 'ART2025') {
        foundTheme = EVENT_THEMES.find(theme => theme.id === 'first-friday');
      } else if (upperCaseCode === 'SUNS2025') {
        foundTheme = EVENT_THEMES.find(theme => theme.id === 'suns-playoff');
      }
      
      if (foundTheme) {
        setMatchedTheme(foundTheme);
        setStatus('success');
        
        // Small delay before returning success
        setTimeout(() => {
          onSuccess(inviteCode, foundTheme);
        }, 1000);
      } else if (
        upperCaseCode === 'CIBO2025' || 
        upperCaseCode === 'CHURCHILL25' || 
        upperCaseCode === 'DROPOUT25' || 
        upperCaseCode === 'POSTINO25' ||
        upperCaseCode === 'MISSION25'
      ) {
        // Valid venue-specific code
        setStatus('success');
        
        // Small delay before returning success
        setTimeout(() => {
          onSuccess(inviteCode);
        }, 1000);
      } else {
        setStatus('error');
        setErrorMessage('Invalid invitation code. Please check and try again.');
      }
    } catch (error) {
      console.error('Error validating invite code:', error);
      setStatus('error');
      setErrorMessage('Unable to validate code. Please try again.');
    }
  };

  const toggleScanner = () => {
    setShowScanner(!showScanner);
  };

  const simulateScan = (code: string) => {
    setInviteCode(code);
    setShowScanner(false);
    
    // Automatically submit after scan
    setTimeout(() => {
      handleSubmit(new Event('submit') as any);
    }, 500);
  };

  if (status === 'success') {
    return (
      <div className="bg-green-900/30 rounded-lg p-4 text-center border border-green-900/50">
        <CheckCircle size={32} className="text-green-500 mx-auto mb-2" />
        <h3 className="font-semibold text-green-200 mb-1">
          {matchedTheme ? 'Special Event Joined!' : 'Invitation Accepted!'}
        </h3>
        <p className="text-sm text-green-300 mb-4">
          {matchedTheme 
            ? `You've joined the ${matchedTheme.name} event.` 
            : "You've successfully joined using an invitation code."}
        </p>
      </div>
    );
  }

  return (
    <div className="bg-[#121826] rounded-lg shadow-lg border border-blue-900/50 overflow-hidden">
      <div className="bg-[#1a2234] p-4 border-b border-blue-900/30">
        <h2 className="font-medium text-white flex items-center gap-2">
          <KeyRound size={18} className="text-blue-400" />
          Enter Invitation Code
        </h2>
      </div>
      
      {showScanner ? (
        <div className="p-4 space-y-4">
          <div className="aspect-video bg-[#0f1623] rounded-lg flex items-center justify-center border border-gray-700">
            <div className="text-center p-4">
              <QrCode size={80} className="text-blue-400 mx-auto mb-4" />
              <p className="text-gray-300 mb-2">QR Code Scanner</p>
              <p className="text-xs text-gray-400">
                Point your camera at a QR code to scan
                <br />
                <span className="text-blue-400">(Simulated in this demo)</span>
              </p>
              
              <div className="flex flex-wrap gap-2 justify-center mt-4">
                <button
                  onClick={() => simulateScan('SPRING2025')}
                  className="mt-2 bg-blue-600 hover:bg-blue-500 text-white px-3 py-1.5 rounded text-sm"
                >
                  Scan Spring Training
                </button>
                <button
                  onClick={() => simulateScan('CIBO2025')}
                  className="mt-2 bg-blue-600 hover:bg-blue-500 text-white px-3 py-1.5 rounded text-sm"
                >
                  Scan Restaurant Code
                </button>
              </div>
            </div>
          </div>
          
          <button
            onClick={toggleScanner}
            className="w-full bg-[#0f1623] text-white px-4 py-2 rounded-lg hover:bg-[#0a101b] border border-gray-700"
          >
            Enter Code Manually
          </button>
        </div>
      ) : (
        <div className="p-4">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="inviteCode" className="block text-sm font-medium text-gray-300 mb-1">
                Invite Code
              </label>
              <input
                type="text"
                id="inviteCode"
                value={inviteCode}
                onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
                placeholder="Enter invitation code (e.g., SPRING2025)"
                className="w-full px-3 py-2 rounded-lg bg-[#0f1623] border border-gray-600 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
              />
            </div>

            {status === 'error' && (
              <div className="flex items-center gap-2 text-red-400 text-sm">
                <AlertCircle size={16} />
                <span>{errorMessage}</span>
              </div>
            )}
            
            <div className="flex items-center gap-3">
              <button
                type="submit"
                disabled={status === 'loading' || !inviteCode.trim()}
                className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {status === 'loading' ? (
                  <span className="flex items-center justify-center gap-2">
                    <div className="animate-spin h-4 w-4 border-2 border-white/50 border-t-white rounded-full"></div>
                    Validating...
                  </span>
                ) : 'Join'}
              </button>
              
              <button
                type="button"
                onClick={toggleScanner}
                className="bg-[#0f1623] text-white p-2 rounded-lg hover:bg-[#0a101b] border border-gray-600"
                title="Scan QR Code"
              >
                <QrCode size={20} />
              </button>
            </div>
            
            <button
              type="button"
              onClick={onCancel}
              className="w-full bg-gray-800 hover:bg-gray-700 text-white px-4 py-2 rounded-lg text-sm"
            >
              Cancel
            </button>
          </form>
          
          <div className="mt-4 text-xs text-gray-400">
            <p>Enter an invitation code to join a special event or group.</p>
            <p className="mt-1">For demo, try: <span className="font-mono bg-[#0f1623] px-1.5 py-0.5 rounded text-blue-300">SPRING2025</span> or any venue code</p>
          </div>
        </div>
      )}
    </div>
  );
};