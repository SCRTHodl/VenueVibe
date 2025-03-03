import React, { useState, useRef, useEffect } from 'react';
import { Calendar, MapPin, Tag, Users, X, ChevronRight, QrCode, Award, ChevronsRight, Star, Clock, ExternalLink, Sparkles } from 'lucide-react';
import { TEST_GROUPS, EVENT_THEMES } from '../../constants';
import type { EventTheme, Group } from '../../types';
import { motion, AnimatePresence } from 'framer-motion';

interface EventModalProps {
  theme: EventTheme;
  onClose: () => void;
}

export const EventModal: React.FC<EventModalProps> = ({ theme, onClose }) => {
  const [activeTab, setActiveTab] = useState<'info' | 'venues' | 'share'>('info');
  const [highlightIndex, setHighlightIndex] = useState(0);
  const [animateShine, setAnimateShine] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);
  
  // Filter groups that are associated with this event theme
  const relatedVenues = TEST_GROUPS.filter(group => 
    group.eventTheme?.id === theme.id
  );

  // Format dates in a user-friendly way
  const formatDate = (dateStr?: string) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { 
      weekday: 'short',
      month: 'short', 
      day: 'numeric' 
    });
  };
  
  const startDate = formatDate(theme.startDate);
  const endDate = formatDate(theme.endDate);
  
  // Generate QR code URL for sharing
  const getQrCodeUrl = () => {
    const inviteText = `Join me at ${theme.name} on MapChat! Use invite code: SPRING2025`;
    return `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(inviteText)}`;
  };
  
  // Highlight different venues periodically
  useEffect(() => {
    if (relatedVenues.length <= 1) return;
    
    const interval = setInterval(() => {
      setHighlightIndex(prev => (prev + 1) % relatedVenues.length);
    }, 3000);
    
    return () => clearInterval(interval);
  }, [relatedVenues.length]);
  
  // Trigger shine animation periodically
  useEffect(() => {
    const interval = setInterval(() => {
      setAnimateShine(true);
      setTimeout(() => setAnimateShine(false), 2000);
    }, 8000);
    
    return () => clearInterval(interval);
  }, []);
  
  // Scroll to highlighted venue
  useEffect(() => {
    if (activeTab === 'venues' && contentRef.current) {
      const highlightedElement = document.getElementById(`venue-${relatedVenues[highlightIndex]?.id}`);
      if (highlightedElement) {
        contentRef.current.scrollTo({
          top: highlightedElement.offsetTop - 100,
          behavior: 'smooth'
        });
      }
    }
  }, [highlightIndex, activeTab, relatedVenues]);

  return (
    <motion.div 
      className="bg-[#121826] rounded-lg shadow-xl overflow-hidden w-full max-w-lg max-h-[90vh] flex flex-col relative"
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.3 }}
      style={{ borderColor: theme.accentColor }}
    >
      {/* Animated shine effect overlay */}
      <AnimatePresence>
        {animateShine && (
          <motion.div 
            className="absolute inset-0 pointer-events-none z-10"
            initial={{ 
              background: `linear-gradient(45deg, transparent 20%, ${theme.accentColor}20 40%, ${theme.accentColor}40 50%, ${theme.accentColor}20 60%, transparent 80%)`,
              backgroundSize: "200% 200%",
              backgroundPosition: "-100% 0"
            }}
            animate={{ 
              backgroundPosition: ["0% 0%", "100% 100%"] 
            }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1.5, ease: "easeInOut" }}
          />
        )}
      </AnimatePresence>
      
      {/* Header with event banner */}
      <div className="relative h-48 overflow-hidden">
        {theme.bannerUrl && (
          <>
            <img 
              src={theme.bannerUrl} 
              alt={theme.name} 
              className="w-full h-full object-cover"
            />
            <motion.div 
              className="absolute inset-0 opacity-70"
              style={{ background: `linear-gradient(to bottom, ${theme.primaryColor}90, ${theme.secondaryColor})` }}
              animate={{ 
                background: [
                  `linear-gradient(to bottom, ${theme.primaryColor}90, ${theme.secondaryColor})`,
                  `linear-gradient(to bottom, ${theme.primaryColor}70, ${theme.secondaryColor})`,
                  `linear-gradient(to bottom, ${theme.primaryColor}90, ${theme.secondaryColor})`
                ]
              }}
              transition={{ duration: 4, repeat: Infinity, repeatType: "reverse" }}
            />
            {/* Decorative elements */}
            <div className="absolute inset-0 overflow-hidden">
              <motion.div 
                className="w-40 h-40 rounded-full absolute -top-10 -right-10 opacity-30"
                style={{ background: theme.accentColor }}
                initial={{ scale: 1 }}
                animate={{ scale: [1, 1.1, 1] }}
                transition={{ duration: 8, repeat: Infinity, repeatType: "reverse" }}
              />
              <motion.div 
                className="absolute top-1/2 left-1/4"
                animate={{ y: [0, -10, 0] }}
                transition={{ duration: 4, repeat: Infinity, repeatType: "reverse" }}
              >
                <Sparkles className="text-white opacity-50" size={20} />
              </motion.div>
              <motion.div 
                className="absolute bottom-1/4 right-1/3"
                animate={{ y: [0, 10, 0] }}
                transition={{ duration: 5, repeat: Infinity, repeatType: "reverse", delay: 1 }}
              >
                <Sparkles className="text-white opacity-50" size={16} />
              </motion.div>
            </div>
          </>
        )}
        
        <div className="absolute top-0 left-0 right-0 p-4 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <motion.div
              className="p-1.5 rounded-full"
              style={{ background: theme.accentColor }}
              animate={{ scale: [1, 1.05, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              <Award size={16} className="text-white" />
            </motion.div>
            <h2 className="text-xl font-bold text-white">
              {theme.name}
            </h2>
          </div>
          <button 
            onClick={onClose}
            className="bg-black/30 p-1.5 rounded-full text-white hover:bg-black/50"
          >
            <X size={20} />
          </button>
        </div>
        
        <div className="absolute bottom-0 left-0 right-0 p-4">
          {theme.description && (
            <p className="text-white text-sm">{theme.description}</p>
          )}
          <div className="flex items-center gap-2 text-xs text-white mt-2">
            <motion.div 
              className="flex items-center gap-1"
              animate={{ opacity: [0.9, 1, 0.9] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              <Calendar size={12} className="text-white" />
              <span>{startDate} - {endDate}</span>
            </motion.div>
            <span className="opacity-50">•</span>
            <motion.div 
              className="flex items-center gap-1"
              animate={{ opacity: [0.9, 1, 0.9] }}
              transition={{ duration: 2, repeat: Infinity, delay: 0.5 }}
            >
              <Tag size={12} className="text-white" />
              <span>Special Offers</span>
            </motion.div>
          </div>
        </div>
      </div>
      
      {/* Tab Navigation */}
      <div className="flex border-b border-gray-700">
        <button
          className={`flex-1 py-3 text-sm font-medium relative overflow-hidden
            ${activeTab === 'info' 
              ? 'text-white' 
              : 'text-gray-400'
            }`}
          style={{ borderColor: activeTab === 'info' ? theme.accentColor : 'transparent' }}
          onClick={() => setActiveTab('info')}
        >
          <div className="relative z-10">Information</div>
          {activeTab === 'info' && (
            <motion.div 
              className="absolute inset-0 -z-0"
              style={{ background: `linear-gradient(to right, ${theme.primaryColor}50, ${theme.secondaryColor}50)` }}
              layoutId="tabHighlight"
            />
          )}
          {activeTab === 'info' && (
            <motion.div 
              className="absolute bottom-0 left-0 right-0 h-0.5"
              style={{ background: theme.accentColor }}
              layoutId="tabIndicator"
            />
          )}
        </button>
        <button
          className={`flex-1 py-3 text-sm font-medium relative overflow-hidden
            ${activeTab === 'venues' 
              ? 'text-white' 
              : 'text-gray-400'
            }`}
          style={{ borderColor: activeTab === 'venues' ? theme.accentColor : 'transparent' }}
          onClick={() => setActiveTab('venues')}
        >
          <div className="relative z-10">Venues ({relatedVenues.length})</div>
          {activeTab === 'venues' && (
            <motion.div 
              className="absolute inset-0 -z-0"
              style={{ background: `linear-gradient(to right, ${theme.primaryColor}50, ${theme.secondaryColor}50)` }}
              layoutId="tabHighlight"
            />
          )}
          {activeTab === 'venues' && (
            <motion.div 
              className="absolute bottom-0 left-0 right-0 h-0.5"
              style={{ background: theme.accentColor }}
              layoutId="tabIndicator"
            />
          )}
        </button>
        <button
          className={`flex-1 py-3 text-sm font-medium relative overflow-hidden
            ${activeTab === 'share' 
              ? 'text-white' 
              : 'text-gray-400'
            }`}
          style={{ borderColor: activeTab === 'share' ? theme.accentColor : 'transparent' }}
          onClick={() => setActiveTab('share')}
        >
          <div className="relative z-10">Invite Friends</div>
          {activeTab === 'share' && (
            <motion.div 
              className="absolute inset-0 -z-0"
              style={{ background: `linear-gradient(to right, ${theme.primaryColor}50, ${theme.secondaryColor}50)` }}
              layoutId="tabHighlight"
            />
          )}
          {activeTab === 'share' && (
            <motion.div 
              className="absolute bottom-0 left-0 right-0 h-0.5"
              style={{ background: theme.accentColor }}
              layoutId="tabIndicator"
            />
          )}
        </button>
      </div>
      
      {/* Content Area */}
      <div ref={contentRef} className="flex-1 overflow-y-auto p-4">
        <AnimatePresence mode="wait">
          {activeTab === 'info' && (
            <motion.div 
              className="space-y-4"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3 }}
              key="info-tab"
            >
              <div 
                className="bg-blue-900/20 p-4 rounded-lg border border-blue-900/40 relative overflow-hidden"
                style={{ borderColor: `${theme.accentColor}40` }}
              >
                <motion.div 
                  className="absolute -right-16 -top-16 w-32 h-32 rounded-full opacity-20"
                  style={{ background: theme.accentColor }}
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ duration: 8, repeat: Infinity, repeatType: "reverse" }}
                />
                
                <h3 className="font-medium text-white mb-2 flex items-center gap-2">
                  <span className="relative">
                    Event Information
                    <motion.div 
                      className="absolute bottom-0 left-0 right-0 h-1 rounded-full"
                      style={{ background: theme.accentColor }}
                      animate={{ opacity: [0.3, 0.6, 0.3] }}
                      transition={{ duration: 2, repeat: Infinity }}
                    />
                  </span>
                </h3>
                <p className="text-gray-300 text-sm relative z-10">
                  {theme.description || `Welcome to ${theme.name}, a special event with exclusive venues and activities!`}
                </p>
                
                <div className="mt-3 space-y-2 relative z-10">
                  <div className="flex items-center gap-2 text-sm text-gray-300">
                    <Calendar size={16} className="text-blue-400" />
                    <span>{startDate} - {endDate}</span>
                  </div>
                  
                  <motion.div 
                    className="flex items-center gap-2 text-sm text-gray-300"
                    animate={{ x: [0, 5, 0] }}
                    transition={{ duration: 5, repeat: Infinity, repeatType: "reverse" }}
                  >
                    <Users size={16} className="text-blue-400" />
                    <span>{Math.floor(Math.random() * 500) + 200} people attending</span>
                  </motion.div>
                </div>
              </div>
              
              <div>
                <h3 className="font-medium text-white mb-2 flex items-center gap-2">
                  <motion.span
                    animate={{ color: [theme.accentColor, 'white', theme.accentColor] }}
                    transition={{ duration: 3, repeat: Infinity }}
                  >
                    Special Offers
                  </motion.span>
                </h3>
                <motion.div 
                  className="bg-blue-900/20 p-3 rounded-lg border border-blue-900/40 mb-3 relative overflow-hidden"
                  style={{ borderColor: `${theme.accentColor}30` }}
                  whileHover={{ 
                    scale: 1.02,
                    borderColor: `${theme.accentColor}60`,
                    transition: { duration: 0.2 }
                  }}
                >
                  {/* Animated glow effect */}
                  <motion.div 
                    className="absolute -inset-1 opacity-30 rounded-lg z-0"
                    style={{ background: theme.accentColor }}
                    animate={{ opacity: [0.1, 0.2, 0.1] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  />
                  
                  <div className="flex justify-between items-center relative z-10">
                    <div className="flex items-center gap-2">
                      <Tag size={16} className="text-green-400" />
                      <span className="text-white font-medium">20% Off All Drinks</span>
                    </div>
                    <motion.span 
                      className="text-xs text-gray-400"
                      initial={{ opacity: 0.7 }}
                      whileHover={{ opacity: 1 }}
                    >
                      All Venues
                    </motion.span>
                  </div>
                </motion.div>
                
                <motion.div 
                  className="bg-blue-900/20 p-3 rounded-lg border border-blue-900/40 relative overflow-hidden"
                  style={{ borderColor: `${theme.accentColor}30` }}
                  whileHover={{ 
                    scale: 1.02, 
                    borderColor: `${theme.accentColor}60`,
                    transition: { duration: 0.2 }
                  }}
                >
                  {/* Animated glow effect */}
                  <motion.div 
                    className="absolute -inset-1 opacity-30 rounded-lg z-0"
                    style={{ background: theme.accentColor }}
                    animate={{ opacity: [0.1, 0.2, 0.1] }}
                    transition={{ duration: 2, repeat: Infinity, delay: 1 }}
                  />
                  
                  <div className="flex justify-between items-center relative z-10">
                    <div className="flex items-center gap-2">
                      <Tag size={16} className="text-green-400" />
                      <span className="text-white font-medium">BOGO Appetizers</span>
                    </div>
                    <motion.span 
                      className="text-xs text-gray-400"
                      initial={{ opacity: 0.7 }}
                      whileHover={{ opacity: 1 }}
                    >
                      Select Venues
                    </motion.span>
                  </div>
                </motion.div>
              </div>
              
              {/* Featured Guests or Artists Section */}
              <div>
                <h3 className="font-medium text-white mb-2 flex items-center gap-2">
                  <Star size={16} className="text-yellow-400" />
                  Featured Highlights
                </h3>
                
                <motion.div 
                  className="grid grid-cols-2 gap-2"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.3, duration: 0.5 }}
                >
                  <div className="bg-blue-900/20 p-3 rounded-lg border border-blue-900/40">
                    <div className="font-medium text-gray-200 mb-1">Live DJ Sets</div>
                    <div className="text-xs text-gray-400">Fri-Sun, 8PM-2AM</div>
                  </div>
                  
                  <div className="bg-blue-900/20 p-3 rounded-lg border border-blue-900/40">
                    <div className="font-medium text-gray-200 mb-1">Tasting Events</div>
                    <div className="text-xs text-gray-400">Daily, 5PM-7PM</div>
                  </div>
                  
                  <div className="bg-blue-900/20 p-3 rounded-lg border border-blue-900/40">
                    <div className="font-medium text-gray-200 mb-1">Prize Drawings</div>
                    <div className="text-xs text-gray-400">Every hour on weekends</div>
                  </div>
                  
                  <div className="bg-blue-900/20 p-3 rounded-lg border border-blue-900/40">
                    <div className="font-medium text-gray-200 mb-1">VIP Packages</div>
                    <div className="text-xs text-gray-400">Limited availability</div>
                  </div>
                </motion.div>
              </div>
            </motion.div>
          )}
          
          {activeTab === 'venues' && (
            <motion.div 
              className="space-y-3"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3 }}
              key="venues-tab"
            >
              <p className="text-sm text-gray-300 mb-2 flex items-center gap-2">
                <MapPin size={14} className="text-blue-400" />
                <span>Participating venues for {theme.name}:</span>
              </p>
              
              {relatedVenues.length > 0 ? (
                relatedVenues.map((venue, index) => (
                  <motion.div 
                    id={`venue-${venue.id}`}
                    key={venue.id}
                    className={`bg-[#1a2234] rounded-lg overflow-hidden border border-blue-900/40 relative ${
                      highlightIndex === index ? 'ring-2' : ''
                    }`}
                    style={{ 
                      ringColor: theme.accentColor,
                      borderColor: highlightIndex === index ? `${theme.accentColor}60` : undefined 
                    }}
                    whileHover={{ 
                      scale: 1.02,
                      transition: { duration: 0.2 }
                    }}
                    animate={{ 
                      y: highlightIndex === index ? [0, -2, 0] : 0,
                      boxShadow: highlightIndex === index ? [
                        `0 0 0 rgba(0,0,0,0)`, 
                        `0 0 15px ${theme.accentColor}40`,
                        `0 0 0 rgba(0,0,0,0)`
                      ] : "none"
                    }}
                    transition={{ duration: 2, repeat: highlightIndex === index ? Infinity : 0 }}
                  >
                    <div className="flex">
                      {/* Venue image */}
                      {venue.photos && venue.photos.length > 0 && (
                        <div className="w-24 h-24 relative">
                          <img 
                            src={venue.photos[0]} 
                            alt={venue.name}
                            className="w-full h-full object-cover"
                          />
                          {highlightIndex === index && (
                            <motion.div 
                              className="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent opacity-30"
                              initial={{ x: '-100%' }}
                              animate={{ x: '100%' }}
                              transition={{ repeat: Infinity, duration: 1.5, repeatDelay: 0.5 }}
                            />
                          )}
                        </div>
                      )}
                      
                      {/* Venue info */}
                      <div className="p-3 flex-1">
                        <div className="flex justify-between">
                          <h4 className="text-white font-medium">{venue.name}</h4>
                          {highlightIndex === index && (
                            <motion.div 
                              initial={{ scale: 0 }}
                              animate={{ scale: [0, 1.2, 1] }}
                              transition={{ duration: 0.5 }}
                            >
                              <Star size={16} className="text-yellow-400" />
                            </motion.div>
                          )}
                        </div>
                        <div className="flex items-center gap-2 text-xs text-gray-400 mt-1">
                          <MapPin size={12} />
                          <span>{venue.category}</span>
                          <Clock size={12} className="ml-1" />
                          <span>{venue.time.replace('Opens ', '')}</span>
                        </div>
                        <div className="flex justify-between items-center mt-2">
                          <div className="text-xs bg-blue-900/40 text-blue-300 px-2 py-0.5 rounded-full">
                            {venue.inviteCode}
                          </div>
                          <motion.div
                            animate={{ x: highlightIndex === index ? [0, 3, 0] : 0 }}
                            transition={{ repeat: Infinity, duration: 1, repeatDelay: 0.5 }}
                          >
                            <ChevronRight size={16} className="text-blue-400" />
                          </motion.div>
                        </div>
                      </div>
                    </div>
                    
                    {/* Special offer badge for highlighted venue */}
                    {highlightIndex === index && (
                      <motion.div 
                        className="absolute top-1 right-1 bg-black/40 backdrop-blur-sm px-2 py-0.5 rounded-full text-[10px] border border-white/10"
                        style={{ color: theme.accentColor }}
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.8 }}
                      >
                        FEATURED
                      </motion.div>
                    )}
                  </motion.div>
                ))
              ) : (
                <div className="text-center py-8 text-gray-400">
                  <p>No participating venues found.</p>
                </div>
              )}
            </motion.div>
          )}
          
          {activeTab === 'share' && (
            <motion.div 
              className="space-y-4 text-center"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3 }}
              key="share-tab"
            >
              <p className="text-gray-300">Share this event with friends:</p>
              
              <motion.div 
                className="bg-white p-4 rounded-lg inline-block mx-auto relative overflow-hidden"
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.2 }}
                whileHover={{ boxShadow: `0 0 20px ${theme.accentColor}40` }}
              >
                <img src={getQrCodeUrl()} alt="QR Code" className="w-40 h-40" />
                
                {/* Scanning animation effect */}
                <motion.div 
                  className="absolute left-0 right-0 h-2 bg-green-500/30 blur-sm"
                  initial={{ top: "0%" }}
                  animate={{ top: ["0%", "100%", "0%"] }}
                  transition={{ duration: 2, repeat: Infinity, repeatDelay: 1 }}
                />
              </motion.div>
              
              <div>
                <p className="text-sm text-gray-400 mb-2">Or use invite code:</p>
                <motion.div 
                  className="bg-blue-900/20 p-2 rounded-lg inline-block"
                  whileHover={{ scale: 1.05 }}
                  style={{ border: `1px solid ${theme.accentColor}30` }}
                >
                  <motion.p 
                    className="font-mono text-lg tracking-wider"
                    style={{ color: theme.accentColor }}
                    animate={{ 
                      textShadow: [
                        `0 0 0px ${theme.accentColor}00`,
                        `0 0 10px ${theme.accentColor}80`,
                        `0 0 0px ${theme.accentColor}00`
                      ]
                    }}
                    transition={{ duration: 2, repeat: Infinity }}
                  >
                    SPRING2025
                  </motion.p>
                </motion.div>
              </div>
              
              <div className="flex gap-3 justify-center mt-4">
                <motion.button 
                  className="text-white px-4 py-2 rounded-lg text-sm flex items-center gap-2"
                  style={{ background: `linear-gradient(to right, ${theme.primaryColor}, ${theme.secondaryColor})` }}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => {
                    // Simulate copy to clipboard
                    navigator.clipboard.writeText('SPRING2025');
                    alert('Invite code copied to clipboard!');
                  }}
                >
                  <QrCode size={16} />
                  Copy Invite Code
                </motion.button>
                <motion.button 
                  className="bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded-lg text-sm flex items-center gap-2"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => {
                    // Simulate share functionality
                    alert('Sharing event invite!');
                  }}
                >
                  <ExternalLink size={16} />
                  Share Link
                </motion.button>
              </div>
              
              {/* Animated benefits section */}
              <motion.div 
                className="mt-4 p-3 rounded-lg border"
                style={{ 
                  background: `linear-gradient(to right, ${theme.primaryColor}10, ${theme.secondaryColor}10)`,
                  borderColor: `${theme.accentColor}30`
                }}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
              >
                <h4 className="text-white font-medium mb-2">Benefits for inviting friends:</h4>
                <ul className="text-sm text-left space-y-2">
                  <motion.li 
                    className="flex items-center gap-2 text-gray-300"
                    initial={{ x: -10, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ delay: 0.7 }}
                  >
                    <ChevronsRight size={14} className="text-green-400" />
                    <span>Exclusive drink specials</span>
                  </motion.li>
                  <motion.li 
                    className="flex items-center gap-2 text-gray-300"
                    initial={{ x: -10, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ delay: 0.9 }}
                  >
                    <ChevronsRight size={14} className="text-green-400" />
                    <span>Priority seating at venues</span>
                  </motion.li>
                  <motion.li 
                    className="flex items-center gap-2 text-gray-300"
                    initial={{ x: -10, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ delay: 1.1 }}
                  >
                    <ChevronsRight size={14} className="text-green-400" />
                    <span>Earn points for every friend who joins</span>
                  </motion.li>
                </ul>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      
      {/* Footer Actions */}
      <div className="border-t border-gray-700 p-4">
        <motion.button
          onClick={onClose}
          className="w-full py-2.5 rounded-lg text-white font-medium relative overflow-hidden"
          style={{ background: `linear-gradient(to right, ${theme.primaryColor}, ${theme.secondaryColor})` }}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <span className="relative z-10">Close</span>
          <motion.div 
            className="absolute inset-0 opacity-20"
            animate={{ 
              background: [
                `linear-gradient(90deg, transparent, ${theme.accentColor}, transparent)`,
                `linear-gradient(90deg, transparent, ${theme.accentColor}00, transparent)`
              ]
            }}
            transition={{ duration: 1.5, repeat: Infinity }}
          />
        </motion.button>
      </div>
    </motion.div>
  );
};