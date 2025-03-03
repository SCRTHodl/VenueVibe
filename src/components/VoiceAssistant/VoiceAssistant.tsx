import React, { useState, useEffect, useRef } from 'react';
import { Star, Mic, Share, X, Bluetooth, Volume2, Share2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface VoiceAssistantProps {
  appUrl?: string;
}

export const VoiceAssistant: React.FC<VoiceAssistantProps> = ({ 
  appUrl = window.location.href
}) => {
  // States for UI and functionality
  const [isOpen, setIsOpen] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [responseText, setResponseText] = useState('');
  const [isSharing, setIsSharing] = useState(false);
  const [bleStatus, setBleStatus] = useState<'idle' | 'scanning' | 'advertising' | 'success' | 'error'>('idle');
  const [transcript, setTranscript] = useState('');
  const [isBleSupported, setIsBleSupported] = useState(true);
  const [isAssistantSpeaking, setIsAssistantSpeaking] = useState(false);
  
  // References
  const recognitionRef = useRef<any>(null);
  const bleScannerRef = useRef<any>(null);
  const bleAdvertiserRef = useRef<any>(null);
  const speechSynthesisRef = useRef<SpeechSynthesis | null>(null);
  const voiceRef = useRef<SpeechSynthesisVoice | null>(null);
  
  // Generate a unique app ID for BLE advertising
  const appId = useRef(`mapchat-${Math.random().toString(36).substring(2, 10)}`);
  
  // Initialize speech recognition and synthesis
  useEffect(() => {
    // Check if browser supports the required APIs
    const checkBrowserSupport = () => {
      const hasSpeechRecognition = 'SpeechRecognition' in window || 'webkitSpeechRecognition' in window;
      const hasBluetooth = 'bluetooth' in navigator;
      
      if (!hasBluetooth) {
        setIsBleSupported(false);
        console.warn('Web Bluetooth API is not supported in this browser.');
      }
      
      return hasSpeechRecognition && 'speechSynthesis' in window;
    };
    
    if (!checkBrowserSupport()) {
      console.warn('Speech recognition or synthesis not supported in this browser.');
      return;
    }
    
    // Initialize speech recognition
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    recognitionRef.current = new SpeechRecognition();
    recognitionRef.current.continuous = false;
    recognitionRef.current.interimResults = true;
    
    recognitionRef.current.onresult = (event: any) => {
      const result = event.results[0];
      const transcriptText = result[0].transcript.toLowerCase();
      setTranscript(transcriptText);
      
      // If final result and is a command
      if (result.isFinal) {
        handleVoiceCommand(transcriptText);
      }
    };
    
    recognitionRef.current.onend = () => {
      setIsListening(false);
    };
    
    // Initialize speech synthesis
    speechSynthesisRef.current = window.speechSynthesis;
    
    // Get a female voice if available
    if (speechSynthesisRef.current) {
      speechSynthesisRef.current.onvoiceschanged = () => {
        const voices = speechSynthesisRef.current?.getVoices() || [];
        // Try to find a female voice
        const femaleVoice = voices.find(voice => 
          voice.name.includes('female') || 
          voice.name.includes('Samantha') || 
          voice.name.includes('Google US English Female')
        );
        voiceRef.current = femaleVoice || voices[0];
      };
      
      // Trigger voices loading
      speechSynthesisRef.current.getVoices();
    }
    
    return () => {
      // Clean up
      if (recognitionRef.current) {
        recognitionRef.current.abort();
      }
      if (speechSynthesisRef.current?.speaking) {
        speechSynthesisRef.current.cancel();
      }
      
      // Stop BLE operations
      stopBleOperations();
    };
  }, []);
  
  // Handle opening the assistant
  const handleOpenAssistant = () => {
    setIsOpen(true);
    const greeting = "Hi, I'm Jessica. How can I help you today?";
    setResponseText(greeting);
    speakText(greeting);
  };
  
  // Handle voice commands
  const handleVoiceCommand = (command: string) => {
    console.log('Voice command:', command);
    
    if (command.includes('share with nearest device') || 
        command.includes('share to nearest device') || 
        command.includes('share nearby')) {
      handleShareCommand();
    } else if (command.includes('hello') || command.includes('hi jessica')) {
      respondToUser("Hello! I'm Jessica. How can I help you today?");
    } else if (command.includes('thank you') || command.includes('thanks')) {
      respondToUser("You're welcome! Is there anything else I can help with?");
    } else if (command.includes('goodbye') || command.includes('bye')) {
      respondToUser("Goodbye! Feel free to ask for help anytime.");
      setTimeout(() => setIsOpen(false), 3000);
    } else {
      respondToUser("I'm sorry, I didn't understand that command. You can ask me to share with the nearest device.");
    }
  };
  
  // Start listening for voice commands
  const startListening = () => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.start();
        setIsListening(true);
        setTranscript('');
      } catch (error) {
        console.error('Error starting speech recognition:', error);
      }
    }
  };
  
  // Respond to user with text and speech
  const respondToUser = (text: string) => {
    setResponseText(text);
    speakText(text);
  };
  
  // Speak text using speech synthesis
  const speakText = (text: string) => {
    if (speechSynthesisRef.current) {
      // Cancel any ongoing speech
      speechSynthesisRef.current.cancel();
      
      const utterance = new SpeechSynthesisUtterance(text);
      if (voiceRef.current) {
        utterance.voice = voiceRef.current;
      }
      utterance.rate = 1;
      utterance.pitch = 1.1;
      
      utterance.onstart = () => setIsAssistantSpeaking(true);
      utterance.onend = () => setIsAssistantSpeaking(false);
      
      speechSynthesisRef.current.speak(utterance);
    }
  };
  
  // Handle "share with nearest device" command
  const handleShareCommand = () => {
    respondToUser("I'll share MapChat with nearby devices using Bluetooth. One moment please.");
    
    // After speech, start BLE advertising
    setTimeout(() => {
      startBleAdvertising();
    }, 2000);
  };
  
  // Start BLE advertising
  const startBleAdvertising = async () => {
    if (!isBleSupported) {
      respondToUser("I'm sorry, but Bluetooth sharing isn't supported on this device or browser.");
      return;
    }
    
    try {
      setIsSharing(true);
      setBleStatus('advertising');
      
      // Request Bluetooth permissions
      const bluetoothDevice = await navigator.bluetooth.requestDevice({
        filters: [{ services: ['battery_service'] }]
      });
      
      respondToUser("Excellent! I'm now broadcasting MapChat's invite to nearby devices. They'll receive a notification to join.");
      setBleStatus('success');
      
      // In a real implementation, you would set up a proper BLE advertisement
      // with your app's UUID and URL, but for demo purposes, we're just showing
      // the connection dialog and simulating success
      
      setTimeout(() => {
        setIsSharing(false);
        setBleStatus('idle');
        respondToUser("Sharing complete! Your link has been sent to nearby devices.");
      }, 3000);
      
    } catch (error) {
      console.error('Bluetooth error:', error);
      setBleStatus('error');
      respondToUser("I couldn't connect to Bluetooth. Please make sure Bluetooth is enabled and try again.");
      setIsSharing(false);
    }
  };
  
  // Clean up BLE operations
  const stopBleOperations = () => {
    // In a real implementation, this would stop any ongoing BLE operations
    setIsSharing(false);
    setBleStatus('idle');
  };
  
  return (
    <>
      {/* Star button to open assistant */}
      <motion.button
        onClick={handleOpenAssistant}
        className="fixed top-4 left-4 z-50 flex items-center justify-center p-3 rounded-full bg-gradient-to-r from-[--color-accent-primary] to-[--color-accent-secondary] text-white shadow-lg"
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
      >
        <Star size={20} />
      </motion.button>
      
      {/* Main assistant dialog */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={(e) => {
              if (e.target === e.currentTarget) {
                setIsOpen(false);
                stopBleOperations();
              }
            }}
          >
            <motion.div
              className="w-full max-w-md bg-[#121826] rounded-2xl shadow-2xl overflow-hidden border border-[--color-accent-primary]/20 relative"
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
            >
              {/* Assistant header */}
              <div className="bg-gradient-to-r from-[--color-accent-primary] to-[--color-accent-secondary] p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
                      {isAssistantSpeaking ? (
                        <Volume2 size={20} className="text-white" />
                      ) : (
                        <Star size={20} className="text-white" />
                      )}
                    </div>
                    <div>
                      <h3 className="text-white font-semibold">Jessica</h3>
                      <p className="text-white/70 text-xs">AI Assistant</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setIsOpen(false)}
                    className="p-2 rounded-full hover:bg-white/10"
                  >
                    <X size={20} className="text-white" />
                  </button>
                </div>
              </div>
              
              {/* Assistant content */}
              <div className="p-6">
                {/* Response message */}
                <div className="mb-4">
                  <div className="bg-[#1a2234] p-4 rounded-lg">
                    <p className="text-white">{responseText}</p>
                  </div>
                </div>
                
                {/* Transcript display */}
                {isListening && (
                  <div className="mb-4">
                    <div className="bg-[#1a2234]/50 p-3 rounded-lg">
                      <p className="text-gray-400 text-sm">
                        {transcript || "Listening..."}
                      </p>
                    </div>
                  </div>
                )}
                
                {/* BLE status display */}
                {isSharing && (
                  <div className="mb-4">
                    <div className={`p-3 rounded-lg ${
                      bleStatus === 'error' 
                        ? 'bg-red-500/20 text-red-300' 
                        : bleStatus === 'success'
                        ? 'bg-green-500/20 text-green-300'
                        : 'bg-blue-500/20 text-blue-300'
                    }`}>
                      <div className="flex items-center gap-2">
                        <Bluetooth size={18} className={bleStatus === 'error' ? 'text-red-300' : bleStatus === 'success' ? 'text-green-300' : 'text-blue-300'} />
                        <p className="text-sm">
                          {bleStatus === 'scanning' && 'Scanning for nearby devices...'}
                          {bleStatus === 'advertising' && 'Broadcasting MapChat invite...'}
                          {bleStatus === 'success' && 'Successfully connected!'}
                          {bleStatus === 'error' && 'Bluetooth connection failed.'}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
                
                {/* Action buttons */}
                <div className="flex justify-center space-x-4">
                  <motion.button
                    onClick={startListening}
                    disabled={isListening || isAssistantSpeaking}
                    className={`px-4 py-2 rounded-full flex items-center gap-2 ${
                      isListening 
                        ? 'bg-[--color-accent-primary] text-white' 
                        : 'bg-[#1a2234] text-white hover:bg-[#1a2234]/70'
                    } ${(isListening || isAssistantSpeaking) ? 'opacity-50 cursor-not-allowed' : ''}`}
                    whileHover={{ scale: isListening || isAssistantSpeaking ? 1 : 1.05 }}
                    whileTap={{ scale: isListening || isAssistantSpeaking ? 1 : 0.95 }}
                  >
                    <Mic size={18} className={isListening ? 'animate-pulse' : ''} />
                    {isListening ? 'Listening...' : 'Speak'}
                  </motion.button>
                  
                  <motion.button
                    onClick={() => handleShareCommand()}
                    disabled={isSharing || isListening || isAssistantSpeaking}
                    className={`px-4 py-2 rounded-full flex items-center gap-2 ${
                      isSharing
                        ? 'bg-blue-600 text-white' 
                        : 'bg-[#1a2234] text-white hover:bg-[#1a2234]/70'
                    } ${(isSharing || isListening || isAssistantSpeaking) ? 'opacity-50 cursor-not-allowed' : ''}`}
                    whileHover={{ scale: isSharing || isListening || isAssistantSpeaking ? 1 : 1.05 }}
                    whileTap={{ scale: isSharing || isListening || isAssistantSpeaking ? 1 : 0.95 }}
                  >
                    <Share2 size={18} />
                    Share Nearby
                  </motion.button>
                </div>
                
                {/* Tips */}
                <div className="mt-6 text-center">
                  <p className="text-gray-400 text-xs">Try saying: "Share with nearest device"</p>
                </div>
              </div>
              
              {/* Footer */}
              <div className="p-3 border-t border-gray-700/50 bg-[#1a2234]/50">
                <div className="flex justify-between items-center">
                  <div className="text-xs text-gray-400">
                    {!isBleSupported && "Bluetooth not supported in this browser"}
                  </div>
                  <div className="text-xs text-gray-400">
                    MapChat Assistant v1.0
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};