import React, { useState } from 'react';
import { QrCode, CheckCircle, AlertCircle } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { PromoEvent } from '../../types';

interface PromoCodeEntryProps {
  onSuccess?: (event: PromoEvent) => void;
}

export const PromoCodeEntry: React.FC<PromoCodeEntryProps> = ({ onSuccess }) => {
  const [promoCode, setPromoCode] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');
  const [showScanner, setShowScanner] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!promoCode.trim()) return;
    
    setStatus('loading');
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 800));
      
      // Mock data for demonstration
      const mockEvent: PromoEvent = {
        id: "event-123",
        title: "Summer Cocktail Festival",
        description: "Join us for a weekend celebration of craft cocktails, featuring local mixologists and special tasting menus.",
        venue: {
          id: "123e4567-e89b-12d3-a456-426614174001",
          name: "The Churchill Social",
          description: "Hip bar with craft cocktails",
          latitude: 33.5997,
          longitude: -111.7631,
          participants: 142,
          time: "Opens 4PM - 2AM",
          category: "bar",
          promoCode: promoCode.toUpperCase(),
          isPromoting: true
        },
        startDate: new Date(Date.now() + 86400000).toISOString(), // Tomorrow
        endDate: new Date(Date.now() + 86400000 * 3).toISOString(), // 3 days from now
        promoCode: promoCode.toUpperCase(),
        benefit: "Buy one cocktail, get one free",
        currentAttendees: 87,
        attendeeLimit: 150,
        organizer: {
          name: "Scottsdale Nightlife Association",
          logo: "https://images.unsplash.com/photo-1582584893578-55faab279191?w=200&h=200&fit=crop"
        },
        status: "active"
      };
      
      setStatus('success');
      if (onSuccess) {
        onSuccess(mockEvent);
      }
      
    } catch (error) {
      console.error('Error validating promo code:', error);
      setStatus('error');
      setErrorMessage('Invalid promotion code. Please try again.');
    }
  };

  const toggleScanner = () => {
    setShowScanner(!showScanner);
  };

  if (status === 'success') {
    return (
      <div className="bg-green-900/30 rounded-lg p-4 text-center border border-green-900/50">
        <CheckCircle size={32} className="text-green-500 mx-auto mb-2" />
        <h3 className="font-semibold text-green-200 mb-1">Promotion Applied!</h3>
        <p className="text-sm text-green-300 mb-4">
          You've successfully unlocked a special offer.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-[#121826] rounded-lg p-4 shadow-sm border border-blue-900/50">
      <h3 className="font-semibold text-white mb-4 flex items-center gap-2">
        <QrCode size={18} className="text-blue-400" />
        Enter Promotion Code
      </h3>
      
      {showScanner ? (
        <div className="space-y-4">
          <div className="aspect-video bg-[#0f1623] rounded-lg flex items-center justify-center border border-gray-700">
            <div className="text-center p-4">
              <p className="text-gray-300 mb-2">QR Code Scanner</p>
              <p className="text-xs text-gray-400">
                Point your camera at a QR code to scan
                <br />
                <span className="text-blue-400">(Simulated in this demo)</span>
              </p>
              
              <button
                onClick={() => {
                  setPromoCode('SCOTTSDALE25');
                  setShowScanner(false);
                }}
                className="mt-4 bg-blue-600 hover:bg-blue-500 text-white px-3 py-1.5 rounded text-sm"
              >
                Simulate Scan
              </button>
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
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="promoCode" className="block text-sm font-medium text-gray-300 mb-1">
              Promotion Code
            </label>
            <input
              type="text"
              id="promoCode"
              value={promoCode}
              onChange={(e) => setPromoCode(e.target.value.toUpperCase())}
              placeholder="Enter code (e.g., SUMMER2025)"
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
              disabled={status === 'loading' || !promoCode.trim()}
              className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {status === 'loading' ? (
                <span className="flex items-center justify-center gap-2">
                  <div className="animate-spin h-4 w-4 border-2 border-white/50 border-t-white rounded-full"></div>
                  Validating...
                </span>
              ) : 'Apply Code'}
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
        </form>
      )}
      
      <div className="mt-4 text-xs text-gray-400">
        Enter a promotion code to unlock special offers, event access, or exclusive content from local venues and event organizers.
      </div>
    </div>
  );
};