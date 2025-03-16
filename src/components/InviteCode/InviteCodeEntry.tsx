import React, { useState } from 'react';
import { QrCode, CheckCircle, AlertCircle, KeyRound } from 'lucide-react';
import { EVENT_THEMES } from '../../constants';
import { supabase } from '../../lib/supabase';
import type { EventTheme } from '../../types';

// Define the InviteCode interface here to match the database structure
interface InviteCode {
  id: string;
  code: string;
  created_by: string;
  created_at?: string;
  expiry_date: string;
  max_uses: number;
  uses: number;
  is_active: boolean;
  themeId?: string; // Associated theme ID for this invite code
}

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
      // First check hardcoded demo codes for backwards compatibility
      let foundTheme: EventTheme | undefined;
      const upperCaseCode = inviteCode.toUpperCase();
      
      // Check for special event codes (demo hardcoded codes)
      if (upperCaseCode === 'SPRING2025') {
        foundTheme = EVENT_THEMES.find(theme => theme.id === 'spring-training');
      } else if (upperCaseCode === 'ART2025') {
        foundTheme = EVENT_THEMES.find(theme => theme.id === 'first-friday');
      } else if (upperCaseCode === 'SUNS2025') {
        foundTheme = EVENT_THEMES.find(theme => theme.id === 'suns-playoff');
      }
      
      // Check if this is a code from the database
      if (!foundTheme) {
        // Check the database for the invite code
        // Use public schema for invite codes
        const { data: inviteData, error } = await supabase
          .from('invite_codes')
          .select('*')
          .eq('code', upperCaseCode)
          .eq('is_active', true)
          .single();
          
        if (error) {
          console.error('Error checking invite code:', error);
          // Continue with hardcoded checks - don't show error yet
        } else if (inviteData) {
          // Valid code from database
          const dbCode = inviteData as InviteCode;
          
          // Check if code is expired
          const expiryDate = new Date(dbCode.expiry_date);
          if (expiryDate < new Date()) {
            setStatus('error');
            setErrorMessage('This invitation code has expired.');
            return;
          }
          
          // Check if code has reached max uses
          if (dbCode.uses >= dbCode.max_uses) {
            setStatus('error');
            setErrorMessage('This invitation code has reached its maximum number of uses.');
            return;
          }
          
          // If the code has an associated theme, find it
          if (dbCode.themeId) {
            foundTheme = EVENT_THEMES.find(theme => theme.id === dbCode.themeId);
          }
          
          // Update the uses count for this code
          // Update the usage count in the public schema
          await supabase
            .from('invite_codes')
            .update({ uses: dbCode.uses + 1 })
            .eq('id', dbCode.id);
            
          // Set success state - will be handled below
          setStatus('success');
        }
      }
      
      // Check for legacy venue-specific codes
      const isLegacyVenueCode = [
        'CIBO2025', 'CHURCHILL25', 'DROPOUT25', 'POSTINO25', 'MISSION25'
      ].includes(upperCaseCode);
      
      if (foundTheme || status === 'success') {
        // If we found a theme (either from hardcoded demos or from database)
        if (foundTheme) {
          setMatchedTheme(foundTheme);
        }
        setStatus('success');
        
        // Small delay before returning success
        setTimeout(() => {
          onSuccess(inviteCode, foundTheme);
        }, 1000);
      } else if (isLegacyVenueCode) {
        // Valid venue-specific code (legacy)
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