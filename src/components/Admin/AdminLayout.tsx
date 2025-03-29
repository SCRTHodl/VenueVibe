import React, { useState } from 'react';
import { Shield, Users, Settings, Brain, LayoutDashboard, ChevronRight, Sparkles, BarChart2, Calendar } from 'lucide-react';
import { ModerationDashboard } from './ModerationDashboard';
import { UserManagement } from './UserManagement';
import { AdminSettings } from './AdminSettings';
import { AIInstructionsManager } from './AIInstructionsManager';
import { FeaturedContentManager } from './FeaturedContentManager';
import { AIContentPerformance } from './AIContentPerformance';
import SpecialEventsManager from './SpecialEventsManager';
import { Button } from '../ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/card';

interface AdminLayoutProps {
  onClose?: () => void;
}

export const AdminLayout: React.FC<AdminLayoutProps> = ({ onClose }) => {
  const [activeTab, setActiveTab] = useState<'moderation' | 'users' | 'settings' | 'ai' | 'featured' | 'performance' | 'specialEvents'>('moderation');

  const tabs = [
    { id: 'moderation', label: 'Moderation', icon: Shield },
    { id: 'users', label: 'Users', icon: Users },
    { id: 'settings', label: 'Settings', icon: Settings },
    { id: 'ai', label: 'AI Instructions', icon: Brain },
    { id: 'featured', label: 'Featured Content', icon: Sparkles },
    { id: 'performance', label: 'AI Analytics', icon: BarChart2 },
    { id: 'specialEvents', label: 'Special Events', icon: Calendar }
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
      case 'featured':
        return <FeaturedContentManager />;
      case 'performance':
        return <AIContentPerformance />;
      case 'specialEvents':
        return <SpecialEventsManager />;
      default:
        return null;
    }
  };

  return (
    <div className="flex flex-col h-full w-full">
      <div className="flex items-center justify-between p-4 border-b">
        <h2 className="text-xl font-semibold">Admin Panel</h2>
        {onClose && (
          <Button variant="ghost" onClick={onClose}>
            Close
          </Button>
        )}
      </div>

      <div className="flex flex-col sm:flex-row h-full">
        <div className="w-full sm:w-64 border-r overflow-y-auto">
          <nav className="p-4 space-y-2">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center space-x-3 p-3 rounded-lg transition-colors ${
                  activeTab === tab.id
                    ? 'bg-primary text-primary-foreground'
                    : 'hover:bg-muted'
                }`}
              >
                <tab.icon className="w-5 h-5" />
                <span>{tab.label}</span>
              </button>
            ))}
          </nav>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          <Card className="h-full">
            <CardHeader>
              <CardTitle className="text-lg font-semibold">
                {tabs.find(t => t.id === activeTab)?.label}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4">
              {renderContent()}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};