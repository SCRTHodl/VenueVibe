import React, { useState, useEffect } from 'react';
import { Settings, Save, RefreshCw, AlertTriangle } from 'lucide-react';
import { motion } from 'framer-motion';
import { supabase } from '../../lib/supabase';

interface AdminSetting {
  key: string;
  value: any;
  description: string;
}

export const AdminSettings: React.FC = () => {
  const [settings, setSettings] = useState<AdminSetting[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  // Fetch settings
  useEffect(() => {
    const fetchSettings = async () => {
      setIsLoading(true);
      try {
        const { data, error } = await supabase
          .from('admin_panel.settings')
          .select('*');

        if (error) throw error;
        setSettings(data || []);
      } catch (error) {
        console.error('Error fetching settings:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchSettings();
  }, []);

  // Save settings
  const handleSave = async () => {
    setIsSaving(true);
    try {
      for (const setting of settings) {
        const { error } = await supabase.rpc('admin_panel.update_setting', {
          p_key: setting.key,
          p_value: setting.value,
          p_description: setting.description
        });

        if (error) throw error;
      }

      setHasChanges(false);
    } catch (error) {
      console.error('Error saving settings:', error);
      alert('Failed to save settings. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  // Update setting value
  const updateSetting = (key: string, value: any) => {
    setSettings(prev => prev.map(setting => 
      setting.key === key ? { ...setting, value } : setting
    ));
    setHasChanges(true);
  };

  return (
    <div className="flex flex-col h-full bg-[#121826]">
      {/* Header */}
      <div className="p-4 border-b border-gray-700">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Settings className="text-[--color-accent-primary]" />
            System Settings
          </h2>

          <button
            onClick={handleSave}
            disabled={!hasChanges || isSaving}
            className={`px-4 py-2 rounded-lg text-white flex items-center gap-2 ${
              hasChanges 
                ? 'bg-[--color-accent-primary] hover:bg-[--color-accent-primary]/90' 
                : 'bg-gray-700 cursor-not-allowed'
            }`}
          >
            {isSaving ? (
              <>
                <RefreshCw size={18} className="animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save size={18} />
                Save Changes
              </>
            )}
          </button>
        </div>

        {hasChanges && (
          <div className="flex items-center gap-2 text-yellow-400 text-sm">
            <AlertTriangle size={16} />
            <span>You have unsaved changes</span>
          </div>
        )}
      </div>

      {/* Settings list */}
      <div className="flex-1 overflow-y-auto p-4">
        {isLoading ? (
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[--color-accent-primary]"></div>
          </div>
        ) : settings.length > 0 ? (
          <div className="space-y-6">
            {settings.map((setting) => (
              <motion.div
                key={setting.key}
                className="bg-[#1a2234] rounded-lg p-4 border border-gray-700"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
              >
                <h3 className="text-white font-medium mb-2">{setting.key}</h3>
                <p className="text-gray-400 text-sm mb-4">{setting.description}</p>

                {typeof setting.value === 'boolean' ? (
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={setting.value}
                      onChange={(e) => updateSetting(setting.key, e.target.checked)}
                      className="form-checkbox h-4 w-4 text-[--color-accent-primary] rounded border-gray-600 bg-gray-700"
                    />
                    <span className="text-gray-300">Enabled</span>
                  </label>
                ) : typeof setting.value === 'number' ? (
                  <input
                    type="number"
                    value={setting.value}
                    onChange={(e) => updateSetting(setting.key, parseFloat(e.target.value))}
                    className="w-full bg-[#121826] border border-gray-600 rounded px-3 py-2 text-white"
                  />
                ) : typeof setting.value === 'object' ? (
                  <textarea
                    value={JSON.stringify(setting.value, null, 2)}
                    onChange={(e) => {
                      try {
                        const value = JSON.parse(e.target.value);
                        updateSetting(setting.key, value);
                      } catch (error) {
                        // Invalid JSON, ignore
                      }
                    }}
                    className="w-full bg-[#121826] border border-gray-600 rounded px-3 py-2 text-white font-mono text-sm h-40"
                  />
                ) : (
                  <input
                    type="text"
                    value={setting.value}
                    onChange={(e) => updateSetting(setting.key, e.target.value)}
                    className="w-full bg-[#121826] border border-gray-600 rounded px-3 py-2 text-white"
                  />
                )}
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <Settings size={48} className="text-gray-500 mx-auto mb-3" />
            <h3 className="text-xl font-medium text-white mb-1">No settings found</h3>
            <p className="text-gray-400">Add system settings to get started</p>
          </div>
        )}
      </div>
    </div>
  );
};