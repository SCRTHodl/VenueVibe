import React from 'react';
import { Users, Award, Gift, Heart, Bell } from 'lucide-react';
import type { ActivityEvent } from '../../types';
import { formatTimeAgo } from '../../lib/utils';

interface NotificationsProps {
  activityEvents: ActivityEvent[];
}

export const Notifications: React.FC<NotificationsProps> = ({ activityEvents }) => {
  // Generate additional mock notifications for the view
  const generateMockNotifications = () => {
    const additionalNotifications: ActivityEvent[] = [
      {
        id: 'notif-1',
        type: 'join',
        user_name: 'Alex',
        group_name: 'Culinary Dropout',
        created_at: new Date(Date.now() - 20 * 60000).toISOString()
      },
      {
        id: 'notif-2',
        type: 'badge',
        user_name: 'Sarah',
        badge_name: 'Explorer Pro',
        created_at: new Date(Date.now() - 45 * 60000).toISOString()
      },
      {
        id: 'notif-3',
        type: 'like',
        user_name: 'Michael',
        target_name: 'Your post',
        created_at: new Date(Date.now() - 1.5 * 60 * 60000).toISOString()
      },
      {
        id: 'notif-4',
        type: 'gift',
        user_name: 'Jessica',
        gift_type: '🎁 Welcome Gift',
        target_name: 'You',
        created_at: new Date(Date.now() - 2 * 60 * 60000).toISOString()
      },
      {
        id: 'notif-5',
        type: 'join',
        user_name: 'David',
        group_name: 'The Churchill Social',
        created_at: new Date(Date.now() - 3 * 60 * 60000).toISOString()
      }
    ];
    
    return [...activityEvents, ...additionalNotifications].sort((a, b) => 
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
  };
  
  const allNotifications = generateMockNotifications();
  
  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'join':
        return <Users size={18} className="text-green-400" />;
      case 'badge':
        return <Award size={18} className="text-yellow-400" />;
      case 'gift':
        return <Gift size={18} className="text-purple-400" />;
      case 'like':
        return <Heart size={18} className="text-red-400" />;
      default:
        return <Bell size={18} className="text-blue-400" />;
    }
  };
  
  const getNotificationContent = (notification: ActivityEvent) => {
    switch (notification.type) {
      case 'join':
        return (
          <span>
            <span className="font-medium text-white">{notification.user_name}</span>
            <span className="text-gray-300"> joined </span>
            <span className="font-medium text-white">{notification.group_name}</span>
          </span>
        );
      case 'badge':
        return (
          <span>
            <span className="font-medium text-white">{notification.user_name}</span>
            <span className="text-gray-300"> earned the </span>
            <span className="font-medium text-yellow-300">{notification.badge_name}</span>
            <span className="text-gray-300"> badge</span>
          </span>
        );
      case 'gift':
        return (
          <span>
            <span className="font-medium text-white">{notification.user_name}</span>
            <span className="text-gray-300"> sent </span>
            <span className="font-medium text-purple-300">{notification.gift_type}</span>
            <span className="text-gray-300"> to </span>
            <span className="font-medium text-white">{notification.target_name}</span>
          </span>
        );
      case 'like':
        return (
          <span>
            <span className="font-medium text-white">{notification.user_name}</span>
            <span className="text-gray-300"> liked </span>
            <span className="font-medium text-white">{notification.target_name}</span>
          </span>
        );
      default:
        return null;
    }
  };
  
  return (
    <div className="flex flex-col h-full bg-[#121826]">
      <div className="p-4 border-b border-gray-700">
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <Bell size={20} className="text-blue-400" />
          Notifications
        </h2>
      </div>
      
      <div className="flex-1 overflow-y-auto divide-y divide-gray-700/50">
        {allNotifications.length > 0 ? (
          allNotifications.map(notification => (
            <div key={notification.id} className="p-4 flex items-start gap-3 hover:bg-[#1a2234] cursor-pointer">
              <div className="mt-0.5 p-2 rounded-full bg-[#1a2234]">
                {getNotificationIcon(notification.type)}
              </div>
              <div className="flex-1">
                <div className="text-sm">
                  {getNotificationContent(notification)}
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  {formatTimeAgo(new Date(notification.created_at))}
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="flex flex-col items-center justify-center h-full p-4 text-center">
            <Bell size={40} className="text-gray-600 mb-3" />
            <h3 className="text-lg font-medium text-white mb-1">No Notifications</h3>
            <p className="text-sm text-gray-400">You're all caught up!</p>
          </div>
        )}
      </div>
    </div>
  );
};