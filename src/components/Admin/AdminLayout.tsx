import React, { useState } from 'react';
import { Shield, Users, Settings, Brain, LayoutDashboard, ChevronRight } from 'lucide-react';
import { ModerationDashboard } from './ModerationDashboard';
import { UserManagement } from './UserManagement';
import { AdminSettings } from './AdminSettings';
import { AIInstructionsManager } from './AIInstructionsManager';

interface AdminLayoutProps {
  onClose?: () => void;
}

export const AdminLayout: React.FC<AdminLayoutProps> = ({ onClose }) => {
  const [activeTab, setActiveTab] = useState<'moderation' | 'users' | 'settings' | 'ai'>('moderation');

  const tabs = [
    { id: 'moderation', label: 'Moderation', icon: Shield },
    { id: 'users', label: 'Users', icon: Users },
    { id: 'settings', label: 'Settings', icon: Settings },
    { id: 'ai', label: 'AI Instructions', icon: Brain }
  ];

  const renderContent = () => {
    switch (activeTab) {
      case 'moderation':
        return <ModerationDashboard />;
      case 'users':
        return <UserManagement />;
      case 'settings':
        return <AdminSettings />;
      case 'ai':
        return <AIInstructionsManager />;
      default:
        return null;
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#121826] flex">
      {/* Sidebar */}
      <div className="w-64 border-r border-gray-700 p-4">
        <div className="flex items-center gap-2 mb-8">
          <LayoutDashboard size={24} className="text-[--color-accent-primary]" />
          <h1 className="text-xl font-bold text-white">Admin Panel</h1>
        </div>

        <nav className="space-y-2">
          {tabs.map(tab => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm transition-colors ${
                  activeTab === tab.id 
                    ? 'bg-[--color-accent-primary]/20 text-[--color-accent-primary]' 
                    : 'text-gray-400 hover:bg-[#1a2234]'
                }`}
              >
                <Icon size={18} />
                <span>{tab.label}</span>
                {activeTab === tab.id && (
                  <ChevronRight size={16} className="ml-auto" />
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Main content */}
      <div className="flex-1 overflow-hidden">
        {renderContent()}
      </div>
    </div>
  );
};