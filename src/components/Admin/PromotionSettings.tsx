import React, { useState } from 'react';
import { usePromotion } from '../../contexts/PromotionContext';
import { useUser } from '../../contexts/UserContext';
import { EventTheme, PromotionBox } from '../../types';
import { X, Plus, Image } from 'lucide-react';
import { toast } from 'react-hot-toast';

const PromotionSettings: React.FC = () => {
  const { promotionSettings, handleUpdatePromotionSettings } = usePromotion();
  const { isAdmin } = useUser();
  
  const [headingText, setHeadingText] = useState<string>(promotionSettings.headingText);
  const [subheadingText, setSubheadingText] = useState<string>(promotionSettings.subheadingText);
  const [bannerText, setBannerText] = useState<string>(promotionSettings.bannerText);
  const [isEnabled, setIsEnabled] = useState<boolean>(promotionSettings.isEnabled);
  const [selectedTheme, setSelectedTheme] = useState<string>(
    promotionSettings.promotionTheme ? promotionSettings.promotionTheme.id : 'none'
  );
  const [newBoxTitle, setNewBoxTitle] = useState<string>('');
  const [newBoxContent, setNewBoxContent] = useState<string>('');
  const [newImageUrl, setNewImageUrl] = useState<string>('');
  
  // Pre-defined themes
  const availableThemes: EventTheme[] = [
    {
      id: '1',
      name: 'Summer Festival',
      primaryColor: '#FF9F1C',
      secondaryColor: '#2EC4B6',
      accentColor: '#E71D36',
      fontFamily: 'Poppins, sans-serif',
      logoUrl: 'https://example.com/summer-fest-logo.png'
    },
    {
      id: '2',
      name: 'Winter Wonderland',
      primaryColor: '#5D5C61',
      secondaryColor: '#379683',
      accentColor: '#7395AE',
      fontFamily: 'Montserrat, sans-serif',
      logoUrl: 'https://example.com/winter-logo.png'
    },
    {
      id: '3',
      name: 'Neon Nights',
      primaryColor: '#231651',
      secondaryColor: '#4DCCBD',
      accentColor: '#FF0022',
      fontFamily: 'Roboto, sans-serif',
      logoUrl: 'https://example.com/neon-logo.png'
    }
  ];
  
  // Handle save changes
  const handleSave = async () => {
    try {
      const selectedThemeObj = selectedTheme !== 'none' 
        ? availableThemes.find(t => t.id === selectedTheme) 
        : null;
      
      await handleUpdatePromotionSettings({
        isEnabled,
        headingText,
        subheadingText,
        bannerText,
        promotionTheme: selectedThemeObj || null
      });
    } catch (error) {
      console.error('Error saving promotion settings:', error);
      toast.error('Failed to save promotion settings');
    }
  };
  
  // Add a new discount box
  const handleAddDiscountBox = () => {
    if (!newBoxTitle.trim() || !newBoxContent.trim()) {
      toast.error('Please enter both title and content for the discount box');
      return;
    }
    
    const newBox: PromotionBox = {
      id: Date.now().toString(),
      title: newBoxTitle,
      content: newBoxContent
    };
    
    // Update the promotion settings
    handleUpdatePromotionSettings({
      discountBoxes: [...promotionSettings.discountBoxes, newBox]
    });
    
    // Reset form
    setNewBoxTitle('');
    setNewBoxContent('');
  };
  
  // Remove a discount box
  const handleRemoveDiscountBox = (id: string) => {
    const updatedBoxes = promotionSettings.discountBoxes.filter(box => box.id !== id);
    handleUpdatePromotionSettings({ discountBoxes: updatedBoxes });
  };
  
  // Add a new promotional image
  const handleAddImage = () => {
    if (!newImageUrl.trim()) {
      toast.error('Please enter an image URL');
      return;
    }
    
    // Update the promotion settings
    handleUpdatePromotionSettings({
      promotionalImages: [...promotionSettings.promotionalImages, newImageUrl]
    });
    
    // Reset form
    setNewImageUrl('');
  };
  
  // Remove a promotional image
  const handleRemoveImage = (index: number) => {
    const updatedImages = [...promotionSettings.promotionalImages];
    updatedImages.splice(index, 1);
    handleUpdatePromotionSettings({ promotionalImages: updatedImages });
  };
  
  // If not admin, show access denied
  if (!isAdmin) {
    return (
      <div className="p-4 bg-red-100 border border-red-400 text-red-700 rounded">
        <h3 className="font-bold">Access Denied</h3>
        <p>You do not have permission to manage promotion settings.</p>
      </div>
    );
  }
  
  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-xl font-bold mb-6">Promotion Settings</h2>
      
      <div className="space-y-6">
        {/* Enable/Disable Promotions */}
        <div className="flex items-center">
          <label className="mr-2 font-medium">Enable Promotions:</label>
          <input
            type="checkbox"
            checked={isEnabled}
            onChange={(e) => setIsEnabled(e.target.checked)}
            className="h-5 w-5"
          />
        </div>
        
        {/* Theme Selection */}
        <div>
          <label className="block mb-1 font-medium">Theme</label>
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
        
        {/* Banner Text */}
        <div>
          <label className="block mb-1 font-medium">Banner Text</label>
          <input 
            type="text" 
            value={bannerText}
            onChange={(e) => setBannerText(e.target.value)}
            className="w-full p-2 border border-gray-300 rounded"
            placeholder="Enter banner text"
          />
        </div>
        
        {/* Heading Text */}
        <div>
          <label className="block mb-1 font-medium">Heading Text</label>
          <input 
            type="text" 
            value={headingText}
            onChange={(e) => setHeadingText(e.target.value)}
            className="w-full p-2 border border-gray-300 rounded"
            placeholder="Enter heading text"
          />
        </div>
        
        {/* Subheading Text */}
        <div>
          <label className="block mb-1 font-medium">Subheading Text</label>
          <input 
            type="text" 
            value={subheadingText}
            onChange={(e) => setSubheadingText(e.target.value)}
            className="w-full p-2 border border-gray-300 rounded"
            placeholder="Enter subheading text"
          />
        </div>
        
        {/* Discount Boxes */}
        <div>
          <h3 className="font-medium mb-3">Discount Boxes</h3>
          
          {/* List of existing discount boxes */}
          <div className="space-y-2 mb-4">
            {promotionSettings.discountBoxes.map(box => (
              <div key={box.id} className="flex items-center justify-between p-2 border border-gray-200 rounded">
                <div>
                  <p className="font-medium">{box.title}</p>
                  <p className="text-sm text-gray-600">{box.content}</p>
                </div>
                <button 
                  onClick={() => handleRemoveDiscountBox(box.id)}
                  className="text-red-500 hover:text-red-700"
                >
                  <X size={18} />
                </button>
              </div>
            ))}
          </div>
          
          {/* Add new discount box */}
          <div className="p-3 border border-dashed border-gray-300 rounded">
            <h4 className="text-sm font-medium mb-2">Add New Discount Box</h4>
            <div className="space-y-2">
              <input 
                type="text" 
                value={newBoxTitle}
                onChange={(e) => setNewBoxTitle(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded"
                placeholder="Box title"
              />
              <textarea 
                value={newBoxContent}
                onChange={(e) => setNewBoxContent(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded"
                placeholder="Box content"
                rows={2}
              />
              <button
                onClick={handleAddDiscountBox}
                className="flex items-center px-3 py-1 bg-green-500 text-white rounded hover:bg-green-600"
              >
                <Plus size={16} className="mr-1" />
                Add Box
              </button>
            </div>
          </div>
        </div>
        
        {/* Promotional Images */}
        <div>
          <h3 className="font-medium mb-3">Promotional Images</h3>
          
          {/* List of existing images */}
          <div className="grid grid-cols-2 gap-2 mb-4">
            {promotionSettings.promotionalImages.map((imageUrl, index) => (
              <div key={index} className="relative group">
                <img 
                  src={imageUrl} 
                  alt={`Promotional image ${index + 1}`}
                  className="w-full h-24 object-cover rounded"
                />
                <button 
                  onClick={() => handleRemoveImage(index)}
                  className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <X size={14} />
                </button>
              </div>
            ))}
          </div>
          
          {/* Add new image */}
          <div className="p-3 border border-dashed border-gray-300 rounded">
            <h4 className="text-sm font-medium mb-2">Add New Image</h4>
            <div className="space-y-2">
              <input 
                type="text" 
                value={newImageUrl}
                onChange={(e) => setNewImageUrl(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded"
                placeholder="Image URL"
              />
              <button
                onClick={handleAddImage}
                className="flex items-center px-3 py-1 bg-green-500 text-white rounded hover:bg-green-600"
              >
                <Image size={16} className="mr-1" />
                Add Image
              </button>
            </div>
          </div>
        </div>
        
        {/* Save Button */}
        <div className="pt-4 border-t border-gray-200">
          <button
            onClick={handleSave}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
};

export default PromotionSettings;
