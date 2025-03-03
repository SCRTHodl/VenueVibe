import React from 'react';
import { Car, Clock, MapPin, DollarSign, ShieldCheck, Navigation } from 'lucide-react';

interface RydeQuestPopupProps {
  driver: {
    id: string;
    name: string;
    latitude: number;
    longitude: number;
    isOutbound?: boolean;
  };
  onClose: () => void;
}

export const RydeQuestPopup: React.FC<RydeQuestPopupProps> = ({ driver, onClose }) => {
  const isOutbound = driver.isOutbound !== false; // default to outbound if not specified
  const pricePerMile = 2.5; // Standard price
  const estimatedTime = Math.floor(Math.random() * 5) + 1; // 1-5 minutes

  return (
    <div className="text-white max-w-full w-64">
      <div 
        className={`absolute -top-10 left-1/2 -translate-x-1/2 rounded-t-lg px-3 py-1 text-sm font-medium ${
          isOutbound 
            ? 'bg-blue-500 text-white' 
            : 'bg-green-500 text-white'
        }`}
      >
        {isOutbound ? 'Heading to Destination' : 'Returning to Event'}
      </div>

      <div className="text-center mb-2">
        <div className={`inline-block p-2 rounded-full mb-1 ${
          isOutbound 
            ? 'bg-blue-500/20' 
            : 'bg-green-500/20'
        }`}>
          <div className={`p-2 rounded-full ${
            isOutbound 
              ? 'bg-gradient-to-br from-blue-500 to-blue-600' 
              : 'bg-gradient-to-br from-green-500 to-emerald-600'
          }`}>
            <Car size={26} className="text-white" />
          </div>
        </div>
        <h3 className="font-medium text-white text-lg">{driver.name}</h3>
        <div className="text-xs text-gray-400">Test Driver Account</div>
      </div>
      
      <div className="space-y-3 mb-3">
        <div className="bg-blue-900/20 p-2 rounded-lg border border-blue-900/40">
          <div className="flex justify-between items-center">
            <div className="text-sm">Trip Rate:</div>
            <div className="font-bold flex items-center">
              <DollarSign size={14} className="text-green-400" />
              <span>${pricePerMile}</span>
              <span className="text-xs text-gray-400 ml-1">/mile</span>
            </div>
          </div>
          <div className="text-xs text-gray-400 mt-0.5">
            Standard pricing in effect
          </div>
        </div>
        
        <div className="grid grid-cols-2 gap-2">
          <div className="bg-blue-900/20 p-2 rounded-lg border border-blue-900/40 flex flex-col items-center">
            <Clock size={14} className="text-blue-400 mb-1" />
            <div className="text-xs text-gray-300">Pickup in</div>
            <div className="text-base font-medium">{estimatedTime} min</div>
          </div>
          
          <div className="bg-blue-900/20 p-2 rounded-lg border border-blue-900/40 flex flex-col items-center">
            <ShieldCheck size={14} className="text-blue-400 mb-1" />
            <div className="text-xs text-gray-300">Vehicle</div>
            <div className="text-base font-medium">Tesla Y</div>
          </div>
        </div>
      </div>
      
      <div className="flex gap-2">
        <button
          onClick={onClose}
          className="flex-1 bg-[#1a2234] hover:bg-[#0f1623] py-2 rounded-lg text-sm transition-colors"
        >
          Close
        </button>
        <button
          className={`flex-1 ${
            isOutbound 
              ? 'bg-blue-600 hover:bg-blue-500' 
              : 'bg-green-600 hover:bg-green-500'
          } text-white py-2 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-1`}
        >
          <Navigation size={14} />
          Request Ride
        </button>
      </div>
      
      <div className="text-center mt-2 text-[10px] text-gray-400">
        Test account - No actual charges will be applied
      </div>
      <div className="text-center text-[10px] text-gray-500 mt-1">
        Drag this popup if needed
      </div>
    </div>
  );
};