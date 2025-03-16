import React, { useState } from 'react';
import { useInviteCode } from '../../contexts/InviteCodeContext';
import { useUser } from '../../contexts/UserContext';
import { EventTheme, InviteCode } from '../../types';
import { toast } from 'react-hot-toast';

const InviteCodeManager: React.FC = () => {
  const { inviteCodes, loadInviteCodes, handleCreateInviteCode, toggleInviteCodeStatus } = useInviteCode();
  const { isAdmin } = useUser();
  
  const [newCode, setNewCode] = useState<string>('');
  const [selectedTheme, setSelectedTheme] = useState<string>('none');
  const [maxUses, setMaxUses] = useState<number>(100);
  const [expiryDate, setExpiryDate] = useState<string>('');
  
  // Pre-defined themes
  const availableThemes: EventTheme[] = [
    {
      id: '1',
      name: 'Summer Festival',
      primaryColor: '#FF9F1C',
      secondaryColor: '#2EC4B6',
      accentColor: '#E71D36',
      bannerUrl: 'https://example.com/summer-fest-logo.png',
      description: 'Summer Festival',
      startDate: new Date().toISOString(),
      endDate: new Date(new Date().setMonth(new Date().getMonth() + 3)).toISOString(),
      isActive: true
    },
    {
      id: '2',
      name: 'Winter Wonderland',
      primaryColor: '#5D5C61',
      secondaryColor: '#379683',
      accentColor: '#7395AE',
      bannerUrl: 'https://example.com/winter-logo.png',
      description: 'Winter Wonderland',
      startDate: new Date().toISOString(),
      endDate: new Date(new Date().setMonth(new Date().getMonth() + 3)).toISOString(),
      isActive: true
    },
    {
      id: '3',
      name: 'Neon Nights',
      primaryColor: '#231651',
      secondaryColor: '#4DCCBD',
      accentColor: '#FF0022',
      bannerUrl: 'https://example.com/neon-logo.png',
      description: 'Neon Nights',
      startDate: new Date().toISOString(),
      endDate: new Date(new Date().setMonth(new Date().getMonth() + 3)).toISOString(),
      isActive: true
    }
  ];
  
  // Handle form submission for new invite code
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newCode.trim()) {
      toast.error('Please enter a code');
      return;
    }
    
    try {
      // Create the invite code object
      const inviteCodeData: Partial<InviteCode> = {
        code: newCode,
        is_active: true,
        max_uses: maxUses,
        uses: 0
      };
      
      // Add theme if selected
      if (selectedTheme !== 'none') {
        const theme = availableThemes.find(t => t.id === selectedTheme);
        if (theme) {
          inviteCodeData.themeId = theme.id;
        }
      }
      
      // Add expiry date if set
      if (expiryDate) {
        inviteCodeData.expiry_date = new Date(expiryDate).toISOString();
      }
      
      // Call the handler to create the invite code
      await handleCreateInviteCode(inviteCodeData);
      
      // Reset form
      setNewCode('');
      setSelectedTheme('none');
      setMaxUses(100);
      setExpiryDate('');
      
    } catch (error) {
      console.error('Error creating invite code:', error);
      toast.error('Failed to create invite code');
    }
  };
  
  // Function to toggle active status of an invite code
  const handleToggleStatus = async (id: string, currentStatus: boolean) => {
    try {
      await toggleInviteCodeStatus(id, !currentStatus);
    } catch (error) {
      console.error('Error toggling status:', error);
      toast.error('Failed to update invite code status');
    }
  };
  
  // Function to reload invite codes
  const handleRefresh = () => {
    loadInviteCodes();
    toast.success('Invite codes refreshed');
  };
  
  // If not admin, show access denied
  if (!isAdmin) {
    return (
      <div className="p-4 bg-red-100 border border-red-400 text-red-700 rounded">
        <h3 className="font-bold">Access Denied</h3>
        <p>You do not have permission to manage invite codes.</p>
      </div>
    );
  }
  
  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold">Invite Codes Management</h2>
        <button 
          onClick={handleRefresh}
          className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Refresh
        </button>
      </div>
      
      {/* Create new invite code form */}
      <div className="mb-8 p-4 bg-gray-50 rounded-lg">
        <h3 className="font-bold mb-4">Create New Invite Code</h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block mb-1">Invite Code</label>
            <input 
              type="text" 
              value={newCode}
              onChange={(e) => setNewCode(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded"
              placeholder="Enter code (e.g. SUMMER2023)"
            />
          </div>
          
          <div>
            <label className="block mb-1">Theme</label>
            <select 
              value={selectedTheme}
              onChange={(e) => setSelectedTheme(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded"
            >
              <option value="none">No Theme</option>
              {availableThemes.map(theme => (
                <option key={theme.id} value={theme.id}>{theme.name}</option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="block mb-1">Max Uses</label>
            <input 
              type="number" 
              value={maxUses}
              onChange={(e) => setMaxUses(parseInt(e.target.value))}
              className="w-full p-2 border border-gray-300 rounded"
              min="1"
            />
          </div>
          
          <div>
            <label className="block mb-1">Expiry Date (optional)</label>
            <input 
              type="date" 
              value={expiryDate}
              onChange={(e) => setExpiryDate(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded"
            />
          </div>
          
          <button 
            type="submit"
            className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
          >
            Create Invite Code
          </button>
        </form>
      </div>
      
      {/* List of invite codes */}
      <div>
        <h3 className="font-bold mb-4">Existing Invite Codes</h3>
        
        {inviteCodes.length === 0 ? (
          <p className="text-gray-500">No invite codes found.</p>
        ) : (
          <div className="space-y-4">
            {inviteCodes.map(code => (
              <div key={code.id} className="p-4 border border-gray-200 rounded-lg">
                <div className="flex justify-between">
                  <div>
                    <p className="font-bold">{code.code}</p>
                    <p className="text-sm text-gray-600">
                      Created: {new Date(code.created_at || '').toLocaleDateString()}
                    </p>
                    {code.expiry_date && (
                      <p className="text-sm text-gray-600">
                        Expires: {new Date(code.expiry_date).toLocaleDateString()}
                      </p>
                    )}
                    <p className="text-sm text-gray-600">
                      Uses: {code.uses} / {code.max_uses}
                    </p>
                    {code.themeId && (
                      <p className="text-sm font-medium mt-1" style={{ color: availableThemes.find(t => t.id === code.themeId)?.primaryColor }}>
                        Theme: {availableThemes.find(t => t.id === code.themeId)?.name}
                      </p>
                    )}
                  </div>
                  
                  <div>
                    <button
                      onClick={() => handleToggleStatus(code.id, code.is_active)}
                      className={`px-3 py-1 rounded ${
                        code.is_active 
                          ? 'bg-red-100 text-red-700 hover:bg-red-200' 
                          : 'bg-green-100 text-green-700 hover:bg-green-200'
                      }`}
                    >
                      {code.is_active ? 'Deactivate' : 'Activate'}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default InviteCodeManager;
