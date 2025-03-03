import React, { useState } from 'react';
import { X, Check, Palette, Sunrise, Moon, Copy, CheckCircle as CircleCheck, Link, QrCode, Calendar } from 'lucide-react';
import type { AppTheme, EventTheme } from '../../types';
import { EVENT_THEMES } from '../../constants';

interface ThemeCustomizerProps {
  currentTheme: AppTheme;
  onThemeChange: (theme: AppTheme) => void;
  onClose: () => void;
}

export const ThemeCustomizer: React.FC<ThemeCustomizerProps> = ({
  currentTheme,
  onThemeChange,
  onClose
}) => {
  const [theme, setTheme] = useState<AppTheme>({...currentTheme});
  const [copiedToClipboard, setCopiedToClipboard] = useState(false);
  const [activeTab, setActiveTab] = useState<'custom' | 'events'>('custom');
  const [linkedEvent, setLinkedEvent] = useState<EventTheme | null>(null);
  
  // Predefined theme options
  const themePresets = [
    {
      name: "Midnight Purple",
      theme: {
        primary: '#8b5cf6',
        secondary: '#3b82f6',
        accent: '#10b981',
        background: '#000000',
        cardBackground: '#0a0a0a',
        textPrimary: '#ffffff',
        textSecondary: '#a1a1aa'
      }
    },
    {
      name: "Deep Ocean",
      theme: {
        primary: '#3b82f6',
        secondary: '#06b6d4',
        accent: '#10b981',
        background: '#030712',
        cardBackground: '#0f172a',
        textPrimary: '#f8fafc',
        textSecondary: '#94a3b8'
      }
    },
    {
      name: "Dark Ember",
      theme: {
        primary: '#ef4444',
        secondary: '#f97316',
        accent: '#eab308',
        background: '#09090b',
        cardBackground: '#18181b',
        textPrimary: '#fafafa',
        textSecondary: '#a1a1aa'
      }
    },
    {
      name: "Emerald Night",
      theme: {
        primary: '#10b981',
        secondary: '#06b6d4',
        accent: '#8b5cf6',
        background: '#020617',
        cardBackground: '#0f172a',
        textPrimary: '#f1f5f9',
        textSecondary: '#94a3b8'
      }
    }
  ];
  
  const handleColorChange = (colorKey: keyof AppTheme, value: string) => {
    setTheme({
      ...theme,
      [colorKey]: value
    });
  };
  
  const applyTheme = () => {
    onThemeChange(theme);
  };
  
  const handlePresetSelect = (presetTheme: AppTheme) => {
    setTheme(presetTheme);
    setLinkedEvent(null);
  };
  
  const handleEventThemeSelect = (eventTheme: EventTheme) => {
    // Generate theme colors from event theme
    const newTheme: AppTheme = {
      primary: eventTheme.primaryColor,
      secondary: eventTheme.secondaryColor,
      accent: eventTheme.accentColor,
      background: '#000000', // Keep black background
      cardBackground: '#0a0a0a', // Keep dark card background
      textPrimary: '#ffffff',
      textSecondary: '#a1a1aa'
    };
    
    setTheme(newTheme);
    setLinkedEvent(eventTheme);
  };
  
  const exportTheme = () => {
    const themeString = JSON.stringify(theme, null, 2);
    navigator.clipboard.writeText(themeString);
    setCopiedToClipboard(true);
    setTimeout(() => setCopiedToClipboard(false), 2000);
  };
  
  // Preview of current theme
  const ThemePreview = () => (
    <div 
      className="theme-preview rounded-lg overflow-hidden mb-4 shadow-lg border border-gray-800"
      style={{ background: theme.cardBackground }}
    >
      {/* Header of preview */}
      <div className="p-3 border-b border-gray-800" style={{ background: `linear-gradient(to right, ${theme.primary}50, ${theme.secondary}50)` }}>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full" style={{ background: theme.primary }}></div>
          <h4 className="text-sm font-medium" style={{ color: theme.textPrimary }}>Theme Preview</h4>
        </div>
      </div>
      
      {/* Content of preview */}
      <div className="p-3">
        {/* Color pills */}
        <div className="flex gap-2 mb-3">
          <div className="w-6 h-6 rounded-full shadow-sm" style={{ background: theme.primary }}></div>
          <div className="w-6 h-6 rounded-full shadow-sm" style={{ background: theme.secondary }}></div>
          <div className="w-6 h-6 rounded-full shadow-sm" style={{ background: theme.accent }}></div>
        </div>
        
        {/* Text examples */}
        <div 
          className="p-3 rounded-lg mb-3 shadow-sm" 
          style={{ 
            background: theme.background,
            border: `1px solid ${theme.primary}20` 
          }}
        >
          <div className="mb-1" style={{ color: theme.textPrimary }}>Primary Text Example</div>
          <div style={{ color: theme.textSecondary }}>Secondary Text Example</div>
        </div>
        
        {/* Button example */}
        <button 
          className="w-full px-4 py-2 rounded-lg text-white shadow-md text-sm font-medium"
          style={{ background: `linear-gradient(to right, ${theme.primary}, ${theme.secondary})` }}
        >
          Button Example
        </button>
      </div>
      
      {linkedEvent && (
        <div className="bg-black/50 p-2 text-center">
          <div className="text-xs flex items-center justify-center gap-1">
            <Link size={10} className="text-blue-400" />
            <span className="text-white">Linked to {linkedEvent.name}</span>
          </div>
        </div>
      )}
    </div>
  );
  
  return (
    <div 
      className="bg-[--color-bg-primary] rounded-xl border border-[--color-accent-primary]/20 shadow-xl w-full max-w-md max-h-[90vh] overflow-hidden flex flex-col"
    >
      <div className="flex items-center justify-between p-4 border-b border-[--color-accent-primary]/10">
        <h2 className="text-lg font-semibold flex items-center gap-2 text-[--color-text-primary]">
          <Palette className="text-[--color-accent-primary]" size={20} />
          Theme Customization
        </h2>
        <button onClick={onClose} className="p-1 rounded-full hover:bg-[--color-accent-primary]/10">
          <X className="text-[--color-text-secondary]" size={20} />
        </button>
      </div>
      
      {/* Tab navigation */}
      <div className="flex border-b border-gray-800">
        <button
          onClick={() => setActiveTab('custom')}
          className={`flex-1 py-2.5 text-sm font-medium ${
            activeTab === 'custom' 
              ? 'text-[--color-accent-primary] border-b-2 border-[--color-accent-primary]' 
              : 'text-gray-400'
          }`}
        >
          Custom Themes
        </button>
        <button
          onClick={() => setActiveTab('events')}
          className={`flex-1 py-2.5 text-sm font-medium ${
            activeTab === 'events' 
              ? 'text-[--color-accent-primary] border-b-2 border-[--color-accent-primary]' 
              : 'text-gray-400'
          }`}
        >
          Event Themes
        </button>
      </div>
      
      <div className="p-4 space-y-6 flex-1 overflow-y-auto">
        <ThemePreview />
        
        {activeTab === 'custom' ? (
          <>
            {/* Theme presets */}
            <div>
              <h3 className="text-sm font-medium text-[--color-text-primary] mb-2">Preset Themes</h3>
              <div className="grid grid-cols-2 gap-2">
                {themePresets.map((preset, index) => (
                  <button
                    key={index}
                    onClick={() => handlePresetSelect(preset.theme)}
                    className="px-3 py-2 rounded-lg text-xs font-medium border border-[--color-accent-primary]/20 hover:border-[--color-accent-primary]/40 text-[--color-text-primary]"
                    style={{
                      background: `linear-gradient(135deg, ${preset.theme.primary}20, ${preset.theme.secondary}20)`
                    }}
                  >
                    <div className="flex items-center gap-1.5">
                      <div 
                        className="w-3 h-3 rounded-full" 
                        style={{ background: preset.theme.primary }}
                      ></div>
                      {preset.name}
                    </div>
                  </button>
                ))}
              </div>
            </div>
            
            {/* Color customization */}
            <div className="space-y-3">
              <h3 className="text-sm font-medium text-[--color-text-primary] mb-2">Custom Colors</h3>
              
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-[--color-text-secondary] block mb-1">Primary</label>
                  <div className="flex items-center">
                    <input 
                      type="color" 
                      value={theme.primary}
                      onChange={(e) => handleColorChange('primary', e.target.value)}
                      className="color-picker mr-2"
                    />
                    <input 
                      type="text" 
                      value={theme.primary}
                      onChange={(e) => handleColorChange('primary', e.target.value)}
                      className="w-full bg-[--color-bg-tertiary] border border-gray-700 rounded px-2 py-1 text-xs text-[--color-text-primary]"
                    />
                  </div>
                </div>
                
                <div>
                  <label className="text-xs text-[--color-text-secondary] block mb-1">Secondary</label>
                  <div className="flex items-center">
                    <input 
                      type="color" 
                      value={theme.secondary}
                      onChange={(e) => handleColorChange('secondary', e.target.value)}
                      className="color-picker mr-2"
                    />
                    <input 
                      type="text" 
                      value={theme.secondary}
                      onChange={(e) => handleColorChange('secondary', e.target.value)}
                      className="w-full bg-[--color-bg-tertiary] border border-gray-700 rounded px-2 py-1 text-xs text-[--color-text-primary]"
                    />
                  </div>
                </div>
                
                <div>
                  <label className="text-xs text-[--color-text-secondary] block mb-1">Accent</label>
                  <div className="flex items-center">
                    <input 
                      type="color" 
                      value={theme.accent}
                      onChange={(e) => handleColorChange('accent', e.target.value)}
                      className="color-picker mr-2"
                    />
                    <input 
                      type="text" 
                      value={theme.accent}
                      onChange={(e) => handleColorChange('accent', e.target.value)}
                      className="w-full bg-[--color-bg-tertiary] border border-gray-700 rounded px-2 py-1 text-xs text-[--color-text-primary]"
                    />
                  </div>
                </div>
                
                <div>
                  <label className="text-xs text-[--color-text-secondary] block mb-1">Background</label>
                  <div className="flex items-center">
                    <input 
                      type="color" 
                      value={theme.background}
                      onChange={(e) => handleColorChange('background', e.target.value)}
                      className="color-picker mr-2"
                    />
                    <input 
                      type="text" 
                      value={theme.background}
                      onChange={(e) => handleColorChange('background', e.target.value)}
                      className="w-full bg-[--color-bg-tertiary] border border-gray-700 rounded px-2 py-1 text-xs text-[--color-text-primary]"
                    />
                  </div>
                </div>
                
                <div>
                  <label className="text-xs text-[--color-text-secondary] block mb-1">Card Background</label>
                  <div className="flex items-center">
                    <input 
                      type="color" 
                      value={theme.cardBackground}
                      onChange={(e) => handleColorChange('cardBackground', e.target.value)}
                      className="color-picker mr-2"
                    />
                    <input 
                      type="text" 
                      value={theme.cardBackground}
                      onChange={(e) => handleColorChange('cardBackground', e.target.value)}
                      className="w-full bg-[--color-bg-tertiary] border border-gray-700 rounded px-2 py-1 text-xs text-[--color-text-primary]"
                    />
                  </div>
                </div>
                
                <div>
                  <label className="text-xs text-[--color-text-secondary] block mb-1">Text Color</label>
                  <div className="flex items-center">
                    <input 
                      type="color" 
                      value={theme.textPrimary}
                      onChange={(e) => handleColorChange('textPrimary', e.target.value)}
                      className="color-picker mr-2"
                    />
                    <input 
                      type="text" 
                      value={theme.textPrimary}
                      onChange={(e) => handleColorChange('textPrimary', e.target.value)}
                      className="w-full bg-[--color-bg-tertiary] border border-gray-700 rounded px-2 py-1 text-xs text-[--color-text-primary]"
                    />
                  </div>
                </div>
              </div>
            </div>
          </>
        ) : (
          // Event themes tab
          <div className="space-y-4">
            <div className="text-sm text-gray-300 mb-2">
              Link your theme to a special event to match branding and join event-specific features.
            </div>
            
            {EVENT_THEMES.map((eventTheme) => (
              <div 
                key={eventTheme.id}
                className={`p-3 rounded-lg border cursor-pointer transition-all ${
                  linkedEvent?.id === eventTheme.id 
                    ? 'border-blue-500 bg-blue-900/20' 
                    : 'border-gray-700 hover:border-gray-500'
                }`}
                onClick={() => handleEventThemeSelect(eventTheme)}
              >
                <div className="flex gap-3 items-center">
                  <div 
                    className="w-12 h-12 rounded-lg flex items-center justify-center"
                    style={{ 
                      background: `linear-gradient(135deg, ${eventTheme.primaryColor}, ${eventTheme.secondaryColor})`,
                      boxShadow: `0 4px 10px ${eventTheme.primaryColor}40`
                    }}
                  >
                    {linkedEvent?.id === eventTheme.id ? (
                      <CircleCheck className="text-white" size={24} />
                    ) : (
                      <QrCode className="text-white" size={24} />
                    )}
                  </div>
                  
                  <div className="flex-1">
                    <h3 className="font-medium text-white">{eventTheme.name}</h3>
                    
                    <div className="flex items-center gap-2 text-xs text-gray-400 mt-1">
                      {eventTheme.startDate && eventTheme.endDate && (
                        <div className="flex items-center gap-1">
                          <Calendar size={12} />
                          <span>
                            {new Date(eventTheme.startDate).toLocaleDateString()} - {new Date(eventTheme.endDate).toLocaleDateString()}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                
                <div className="flex mt-2 gap-2">
                  <div 
                    className="w-6 h-6 rounded-full shadow-sm" 
                    style={{ background: eventTheme.primaryColor }}
                    title="Primary Color"
                  ></div>
                  <div 
                    className="w-6 h-6 rounded-full shadow-sm" 
                    style={{ background: eventTheme.secondaryColor }}
                    title="Secondary Color"
                  ></div>
                  <div 
                    className="w-6 h-6 rounded-full shadow-sm" 
                    style={{ background: eventTheme.accentColor }}
                    title="Accent Color"
                  ></div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      
      {/* Actions */}
      <div className="p-4 border-t border-[--color-accent-primary]/10">
        <div className="flex gap-3">
          <button
            onClick={exportTheme}
            className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-[--color-bg-tertiary] text-[--color-text-primary] border border-[--color-accent-primary]/20 hover:border-[--color-accent-primary]/40 flex-1"
          >
            {copiedToClipboard ? (
              <>
                <CircleCheck size={16} className="text-green-500" />
                <span>Copied!</span>
              </>
            ) : (
              <>
                <Copy size={16} />
                <span>Export</span>
              </>
            )}
          </button>
          
          <button
            onClick={applyTheme}
            className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-gradient-to-r from-[--color-accent-primary] to-[--color-accent-secondary] text-white flex-1 shadow-lg"
          >
            <Check size={16} />
            <span>Apply Theme</span>
          </button>
        </div>
        
        {linkedEvent && (
          <div className="text-center mt-3 text-xs text-gray-400 flex items-center justify-center gap-1">
            <Link size={12} className="text-blue-400" />
            <span>This theme is linked to the {linkedEvent.name} event</span>
          </div>
        )}
      </div>
    </div>
  );
};