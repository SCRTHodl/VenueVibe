import React from 'react';

/**
 * Debug component to help verify the Admin Panel is rendering correctly
 */
const AdminPanelDebug: React.FC = () => {
  return (
    <div className="fixed bottom-4 right-4 bg-yellow-100 border border-yellow-500 p-3 rounded-md z-50 text-xs">
      <div className="font-bold mb-1">Admin Panel Debug</div>
      <div>Version: {new Date().toISOString()}</div>
      <div>Special Events Tab Included: YES</div>
    </div>
  );
};

export default AdminPanelDebug;
