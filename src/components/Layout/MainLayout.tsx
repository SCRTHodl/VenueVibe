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
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  
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
          <div className="flex items-center gap-4">
            <button
              onClick={() => setIsSidebarOpen(true)}
              className="md:hidden p-2 rounded-lg hover:bg-white/10"
              aria-label="Toggle navigation"
            >
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 6h16M4 12h16M4 18h16"
                />
              </svg>
            </button>
            <h1 className="text-xl font-bold">VenueVibe</h1>
          </div>
          
          <div className="hidden md:flex items-center gap-4">
            <button
              onClick={() => setShowThemeCustomizer(true)}
              className="p-2 rounded-lg hover:bg-white/10"
              aria-label="Customize theme"
            >
              <Palette className="w-5 h-5" />
            </button>
            
            {currentUser && (
              <div className="flex items-center gap-2">
                <span className="text-sm">{currentUser.name}</span>
                <button
                  onClick={() => setShowUserSettings(true)}
                  className="p-2 rounded-lg hover:bg-white/10"
                  aria-label="User settings"
                >
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5.121 17.804A13.937 13.937 0 0112 16c2.5 0 4.847.655 6.879 1.804M15 10a3 3 0 11-6 0 3 3 0 016 0zm6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Mobile sidebar */}
      {isSidebarOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-20 md:hidden" onClick={() => setIsSidebarOpen(false)} />
      )}
      
      <div className="flex flex-col md:flex-row h-full">
        {/* Sidebar */}
        <nav
          className={`fixed inset-y-0 left-0 w-64 bg-white shadow-lg transform transition-transform duration-300 ease-in-out z-20 ${
            isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
          }`}
        >
          <div className="h-full flex flex-col">
            <div className="p-4 border-b">
              <h2 className="text-xl font-bold">Menu</h2>
            </div>
            <div className="flex-1 overflow-y-auto p-4">
              <ul className="space-y-2">
                <li>
                  <a href="/" className="block p-3 rounded-lg hover:bg-gray-100">
                    Home
                  </a>
                </li>
                <li>
                  <a href="/events" className="block p-3 rounded-lg hover:bg-gray-100">
                    Events
                  </a>
                </li>
                <li>
                  <a href="/nfts" className="block p-3 rounded-lg hover:bg-gray-100">
                    NFTs
                  </a>
                </li>
                <li>
                  <a href="/badges" className="block p-3 rounded-lg hover:bg-gray-100">
                    Badges
                  </a>
                </li>
                {isAdmin && (
                  <li>
                    <a href="/admin" className="block p-3 rounded-lg hover:bg-gray-100">
                      Admin
                    </a>
                  </li>
                )}
              </ul>
            </div>
          </div>
        </nav>

        {/* Main content */}
        <main className="flex-1 p-4 md:p-8">
          {children}
        </main>
      </div>
    </div>
  );
};

export default MainLayout;
