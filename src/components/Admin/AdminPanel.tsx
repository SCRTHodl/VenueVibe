import React, { useState } from 'react';
import { useAdmin } from '../../contexts/AdminContext';
import { useUser } from '../../contexts/UserContext';
import InviteCodeManager from './InviteCodeManager';
import PromotionSettings from './PromotionSettings';
import { Clipboard, Gift, Shield, Coins, Users, BarChart } from 'lucide-react';

interface AdminPanelProps {
  onClose: () => void;
}

const AdminPanel: React.FC<AdminPanelProps> = ({ onClose }) => {
  const { isAdmin } = useUser();
  const [activeTab, setActiveTab] = useState<string>('promotion');

  // If not admin, show access denied
  if (!isAdmin) {
    return (
      <div className="p-6 bg-red-100 border border-red-400 text-red-700 rounded">
        <h3 className="font-bold text-lg mb-2">Access Denied</h3>
        <p>You do not have administrator privileges to access this panel.</p>
        <button
          onClick={onClose}
          className="mt-4 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
        >
          Close
        </button>
      </div>
    );
  }

  const renderTabContent = () => {
    switch (activeTab) {
      case 'inviteCodes':
        return <InviteCodeManager />;
      case 'promotion':
        return <PromotionSettings />;
      case 'moderation':
        return (
          <div className="p-6">
            <h2 className="text-xl font-bold mb-4">Content Moderation</h2>
            <p className="text-gray-500">Content moderation settings and tools will be displayed here.</p>
          </div>
        );
      case 'tokens':
        return (
          <div className="p-6">
            <h2 className="text-xl font-bold mb-4">Token Economy</h2>
            <p className="text-gray-500">Token economy management tools will be displayed here.</p>
          </div>
        );
      case 'users':
        return (
          <div className="p-6">
            <h2 className="text-xl font-bold mb-4">User Management</h2>
            <p className="text-gray-500">User management tools will be displayed here.</p>
          </div>
        );
      case 'analytics':
        return (
          <div className="p-6">
            <h2 className="text-xl font-bold mb-4">Analytics Dashboard</h2>
            <p className="text-gray-500">Analytics dashboard will be displayed here.</p>
          </div>
        );
      default:
        return <PromotionSettings />;
    }
  };

  return (
    <div className="flex flex-col h-full max-h-[80vh]">
      <div className="flex border-b">
        <div className="w-64 border-r bg-gray-50 p-4">
          <h2 className="font-bold text-xl mb-6">Admin Panel</h2>
          
          <nav className="space-y-1">
            <button 
              onClick={() => setActiveTab('promotion')}
              className={`flex items-center w-full px-3 py-2 text-left rounded-md ${
                activeTab === 'promotion' 
                  ? 'bg-blue-100 text-blue-700' 
                  : 'hover:bg-gray-100'
              }`}
            >
              <Gift className="w-5 h-5 mr-2" />
              <span>Promotion</span>
            </button>
            
            <button 
              onClick={() => setActiveTab('inviteCodes')}
              className={`flex items-center w-full px-3 py-2 text-left rounded-md ${
                activeTab === 'inviteCodes' 
                  ? 'bg-blue-100 text-blue-700' 
                  : 'hover:bg-gray-100'
              }`}
            >
              <Clipboard className="w-5 h-5 mr-2" />
              <span>Invite Codes</span>
            </button>
            
            <button 
              onClick={() => setActiveTab('moderation')}
              className={`flex items-center w-full px-3 py-2 text-left rounded-md ${
                activeTab === 'moderation' 
                  ? 'bg-blue-100 text-blue-700' 
                  : 'hover:bg-gray-100'
              }`}
            >
              <Shield className="w-5 h-5 mr-2" />
              <span>Moderation</span>
            </button>
            
            <button 
              onClick={() => setActiveTab('tokens')}
              className={`flex items-center w-full px-3 py-2 text-left rounded-md ${
                activeTab === 'tokens' 
                  ? 'bg-blue-100 text-blue-700' 
                  : 'hover:bg-gray-100'
              }`}
            >
              <Coins className="w-5 h-5 mr-2" />
              <span>Token Economy</span>
            </button>
            
            <button 
              onClick={() => setActiveTab('users')}
              className={`flex items-center w-full px-3 py-2 text-left rounded-md ${
                activeTab === 'users' 
                  ? 'bg-blue-100 text-blue-700' 
                  : 'hover:bg-gray-100'
              }`}
            >
              <Users className="w-5 h-5 mr-2" />
              <span>Users</span>
            </button>
            
            <button 
              onClick={() => setActiveTab('analytics')}
              className={`flex items-center w-full px-3 py-2 text-left rounded-md ${
                activeTab === 'analytics' 
                  ? 'bg-blue-100 text-blue-700' 
                  : 'hover:bg-gray-100'
              }`}
            >
              <BarChart className="w-5 h-5 mr-2" />
              <span>Analytics</span>
            </button>
          </nav>
          
          <div className="mt-8">
            <button
              onClick={onClose}
              className="w-full px-4 py-2 bg-gray-200 rounded hover:bg-gray-300"
            >
              Close Admin Panel
            </button>
          </div>
        </div>
        
        <div className="flex-1 overflow-y-auto">
          {renderTabContent()}
        </div>
      </div>
    </div>
  );
};

export default AdminPanel;
