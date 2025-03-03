import React, { useState } from 'react';
import { Send, CheckCircle, AlertCircle, QrCode } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import type { Group } from '../../types';

interface EventSignupProps {
  group: Group;
}

export const EventSignup: React.FC<EventSignupProps> = ({ group }) => {
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [participants, setParticipants] = useState('1');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');
  const [showQrCode, setShowQrCode] = useState(false);
  const [inviteCode, setInviteCode] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('loading');
    
    try {
      const { error } = await supabase
        .from('event_signups')
        .insert([{
          group_id: group.id,
          email,
          name,
          participants: parseInt(participants, 10)
        }]);

      if (error) throw error;
      
      // Generate random invite code
      const code = Math.random().toString(36).substring(2, 10).toUpperCase();
      setInviteCode(code);
      setStatus('success');
    } catch (err) {
      console.error('Signup error:', err);
      setStatus('error');
      setErrorMessage('Unable to process signup. Please try again.');
    }
  };

  if (status === 'success' && !showQrCode) {
    return (
      <div className="bg-green-900/30 rounded-lg p-4 text-center border border-green-900/50">
        <CheckCircle size={32} className="text-green-500 mx-auto mb-2" />
        <h3 className="font-semibold text-green-200 mb-1">You're all set!</h3>
        <p className="text-sm text-green-300 mb-4">
          We'll send you an email with all the details.
        </p>
        <div className="flex justify-center">
          <button
            onClick={() => setShowQrCode(true)}
            className="flex items-center gap-2 bg-green-600 hover:bg-green-500 px-4 py-2 rounded-lg text-white transition-colors shadow-md"
          >
            <QrCode size={18} />
            <span>View Invite QR Code</span>
          </button>
        </div>
      </div>
    );
  }

  if (showQrCode) {
    // Show QR code for invitation
    const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(`https://mapchat.app/invite/${inviteCode}`)}`;
    
    return (
      <div className="bg-blue-900/30 rounded-lg p-4 text-center border border-blue-900/50">
        <h3 className="font-semibold text-white mb-4">Your Invitation QR Code</h3>
        <div className="bg-white p-3 rounded-lg inline-block mb-4">
          <img src={qrCodeUrl} alt="Invitation QR Code" className="w-48 h-48" />
        </div>
        <p className="text-sm text-blue-200 mb-2">Share this code with your friends!</p>
        <div className="bg-blue-900/50 p-2 rounded-lg mb-4">
          <p className="font-mono text-blue-200 text-lg tracking-wider">{inviteCode}</p>
        </div>
        <button
          onClick={() => setShowQrCode(false)}
          className="bg-blue-600 hover:bg-blue-500 px-4 py-2 rounded-lg text-white transition-colors shadow-md"
        >
          Back to Confirmation
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="bg-[#121826] rounded-lg p-4 shadow-sm border border-blue-900/50">
        <h3 className="font-semibold text-white mb-4">Sign Up for Event</h3>
        
        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-300 mb-1">
              Your Name
            </label>
            <input
              type="text"
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-[#0f1623] border border-gray-600 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
              required
            />
          </div>
          
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-1">
              Email Address
            </label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-[#0f1623] border border-gray-600 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
              required
            />
          </div>
          
          <div>
            <label htmlFor="participants" className="block text-sm font-medium text-gray-300 mb-1">
              Number of Participants
            </label>
            <select
              id="participants"
              value={participants}
              onChange={(e) => setParticipants(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-[#0f1623] border border-gray-600 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
            >
              {[1, 2, 3, 4, 5].map(num => (
                <option key={num} value={num}>{num}</option>
              ))}
            </select>
          </div>

          {status === 'error' && (
            <div className="flex items-center gap-2 text-red-400 text-sm">
              <AlertCircle size={16} />
              <span>{errorMessage}</span>
            </div>
          )}
          
          <button
            type="submit"
            disabled={status === 'loading'}
            className="w-full flex items-center justify-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {status === 'loading' ? (
              <span className="flex items-center gap-2">
                <div className="animate-spin h-4 w-4 border-2 border-white/50 border-t-white rounded-full"></div>
                Processing...
              </span>
            ) : (
              <>
                <Send size={16} />
                Sign Up Now
              </>
            )}
          </button>
        </form>
      </div>

      <div className="bg-blue-900/20 rounded-lg p-4 text-sm text-blue-300 border border-blue-900/30">
        <div className="flex items-center gap-2 mb-2">
          <QrCode size={16} className="text-blue-400" />
          <p className="font-medium text-blue-200">Invite Links & QR Codes</p>
        </div>
        <p className="mb-2">After signing up, you'll receive:</p>
        <ul className="list-disc list-inside space-y-1 ml-1">
          <li>Unique shareable QR code</li>
          <li>Digital invite to share with friends</li>
          <li>Personalized welcome package</li>
        </ul>
      </div>
    </div>
  );
};