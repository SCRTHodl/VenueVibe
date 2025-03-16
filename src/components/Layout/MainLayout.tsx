import React, { useState } from 'react';
import PromotionBanner from '../Promotion/PromotionBanner';
import CreatePostForm from '../Posts/CreatePostForm';
import PostsList from '../Posts/PostsList';
import { usePromotion } from '../../contexts/PromotionContext';
import { useUser } from '../../contexts/UserContext';
import { Toaster } from 'react-hot-toast';
import { ThemeCustomizer } from '../ThemeCustomizer/ThemeCustomizer';
import { Palette } from 'lucide-react';

interface MainLayoutProps {
  children?: React.ReactNode;
}

const MainLayout: React.FC<MainLayoutProps> = ({ children }) => {
  const { promotionSettings } = usePromotion();
  const { currentUser, isAdmin, setShowUserSettings, userTheme, updateUserTheme } = useUser();
  const [showThemeCustomizer, setShowThemeCustomizer] = useState(false);
  
  // Apply theme styles if a promotion theme is active
  const theme = promotionSettings.promotionTheme;
  
  const pageStyle = theme ? {
    fontFamily: theme.fontFamily,
    '--primary-color': theme.primaryColor,
    '--secondary-color': theme.secondaryColor,
    '--accent-color': theme.accentColor,
  } as React.CSSProperties : {};
  
  return (
    <div style={pageStyle} className="min-h-screen bg-gray-100">
      {/* Toast notifications */}
      <Toaster position="top-right" />
      
      {/* Promotion Banner */}
      <PromotionBanner />
      
      {/* Theme Customizer */}
      {showThemeCustomizer && (
        <ThemeCustomizer
          currentTheme={userTheme}
          onThemeChange={(newTheme) => {
            updateUserTheme(newTheme);
          }}
          onClose={() => setShowThemeCustomizer(false)}
        />
      )}
      
      {/* Main Navigation */}
      <header className="app-header bg-gradient-to-r from-[--color-accent-primary] to-[--color-accent-secondary] text-white shadow-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-3 flex justify-between items-center">
          <div className="flex items-center">
            <h1 className="text-xl font-bold text-white">
              {theme?.logoUrl ? (
                <img 
                  src={theme.logoUrl} 
                  alt="Logo" 
                  className="h-8"
                />
              ) : (
                'SottoCity'
              )}
            </h1>
          </div>
          
          <div className="flex items-center space-x-4">
            {isAdmin && (
              <button className="text-sm font-medium text-white hover:text-gray-200">
                Admin Panel
              </button>
            )}
            
            <button 
              className="flex items-center text-sm font-medium text-white hover:text-gray-200" 
              onClick={() => setShowThemeCustomizer(true)}
            >
              <Palette className="w-5 h-5 mr-1" />
              <span className="hidden sm:inline">Customize</span>
            </button>
            
            <div className="flex items-center cursor-pointer" onClick={() => setShowUserSettings(true)}>
              <img 
                src={currentUser?.avatar || 'https://via.placeholder.com/40'} 
                alt="Profile" 
                className="w-8 h-8 rounded-full border-2 border-white"
              />
              <span className="ml-2 text-sm font-medium hidden sm:block text-white">
                {currentUser?.name || 'Guest'}
              </span>
            </div>
          </div>
        </div>
      </header>
      
      {/* Main Content */}
      <main className="container mx-auto px-4 py-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Sidebar - Left */}
          <div className="hidden md:block">
            <div className="bg-white rounded-lg shadow p-4 mb-4">
              <h2 className="font-bold text-lg mb-3">Menu</h2>
              <nav className="space-y-2">
                <a href="#" className="block px-3 py-2 bg-blue-50 text-blue-700 rounded-lg font-medium">
                  Home
                </a>
                <a href="#" className="block px-3 py-2 hover:bg-gray-50 rounded-lg">
                  My Groups
                </a>
                <a href="#" className="block px-3 py-2 hover:bg-gray-50 rounded-lg">
                  Explore
                </a>
                <a href="#" className="block px-3 py-2 hover:bg-gray-50 rounded-lg">
                  Messages
                </a>
                <a href="#" className="block px-3 py-2 hover:bg-gray-50 rounded-lg">
                  Notifications
                </a>
              </nav>
            </div>
            
            {promotionSettings.isEnabled && (
              <div className="bg-white rounded-lg shadow p-4">
                <h2 className="font-bold text-lg mb-2">{promotionSettings.specialOffer || 'Special Offer'}</h2>
                <p className="text-gray-600 mb-3">{promotionSettings.contentFocus || 'Check out our latest offers'}</p>
                
                {promotionSettings.promotionalBoxes && promotionSettings.promotionalBoxes.length > 0 && (
                  <div className="grid grid-cols-1 gap-3 mb-3">
                    {promotionSettings.promotionalBoxes.map((box, index) => (
                      <div key={index} className="border border-dashed border-gray-300 p-3 rounded-lg">
                        <h3 className="font-medium">{box.title || 'Promotion'}</h3>
                        <p className="text-sm text-gray-600">{box.description || 'Limited time offer'}</p>
                      </div>
                    ))}
                  </div>
                )}
                
                {promotionSettings.customBannerUrl && (
                  <div className="mb-3">
                    <img 
                      src={promotionSettings.customBannerUrl} 
                      alt="Promotional" 
                      className="w-full h-auto rounded-lg"
                    />
                  </div>
                )}
                
                <button className="w-full py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600">
                  Learn More
                </button>
              </div>
            )}
          </div>
          
          {/* Main Content */}
          <div className="md:col-span-2">
            <CreatePostForm />
            
            {/* Main Content Area */}
            {children ? children : <PostsList />}
          </div>
        </div>
      </main>
    </div>
  );
};

export default MainLayout;
