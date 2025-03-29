import React, { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { supabase } from '../../lib/supabase';
import { usePromotion } from '../../contexts/PromotionContext';
import { SpecialEvent, SpecialOffer, EventTheme } from '../../types';
import { Calendar, MapPin, Tag, Plus, Edit, Trash2, Dollar, Clock, Users } from 'lucide-react';

const SpecialEventsManager: React.FC = () => {
  const { promotionSettings, handleUpdatePromotionSettings } = usePromotion();
  const [events, setEvents] = useState<SpecialEvent[]>(promotionSettings.specialEvents || []);
  const [isLoading, setIsLoading] = useState(false);
  const [showAddEvent, setShowAddEvent] = useState(false);
  const [showEditEvent, setShowEditEvent] = useState(false);
  const [currentEvent, setCurrentEvent] = useState<SpecialEvent | null>(null);

  // Form state for new/edit event
  const [formData, setFormData] = useState({
    id: '',
    name: '',
    description: '',
    startDate: '',
    endDate: '',
    location: '',
    venueId: '',
    venueName: '',
    imageUrl: '',
    capacity: '',
    inviteCode: '',
    isActive: true,
    themeId: ''
  });

  // Special offers for the current event
  const [specialOffers, setSpecialOffers] = useState<SpecialOffer[]>([]);
  const [currentOffer, setCurrentOffer] = useState<SpecialOffer | null>(null);
  const [showAddOffer, setShowAddOffer] = useState(false);

  // Form data for offers
  const [offerFormData, setOfferFormData] = useState({
    id: '',
    title: '',
    description: '',
    discountAmount: '',
    discountType: 'percentage',
    tokenCost: '',
    validFrom: '',
    validUntil: '',
    redemptionCode: '',
    maxRedemptions: '',
    isActive: true
  });

  // Load events from context on mount
  useEffect(() => {
    if (promotionSettings.specialEvents) {
      setEvents(promotionSettings.specialEvents);
    } else {
      // If no events in context, try to load from database
      loadEventsFromDatabase();
    }
  }, [promotionSettings]);

  // Load events from the database
  const loadEventsFromDatabase = async () => {
    setIsLoading(true);
    try {
      // First get the events
      const { data: eventsData, error: eventsError } = await supabase
        .from('te_special_events')
        .select('*')
        .order('start_date', { ascending: false });

      if (eventsError) throw eventsError;

      if (eventsData && eventsData.length > 0) {
        // For each event, get its offers
        const eventsWithOffers = await Promise.all(eventsData.map(async (event) => {
          const { data: offersData, error: offersError } = await supabase
            .from('te_special_offers')
            .select('*')
            .eq('event_id', event.id);
          
          if (offersError) throw offersError;
          
          // Convert from snake_case DB format to camelCase for frontend
          const specialOffers: SpecialOffer[] = offersData ? offersData.map(offer => ({
            id: offer.id,
            title: offer.title,
            description: offer.description,
            discountAmount: offer.discount_amount,
            discountType: offer.discount_type as 'percentage' | 'fixed' | 'tokenBased',
            tokenCost: offer.token_cost,
            validFrom: offer.valid_from,
            validUntil: offer.valid_until,
            redemptionCode: offer.redemption_code,
            maxRedemptions: offer.max_redemptions,
            currentRedemptions: offer.current_redemptions,
            isActive: offer.is_active
          })) : [];
          
          return {
            id: event.id,
            name: event.name,
            description: event.description,
            startDate: event.start_date,
            endDate: event.end_date,
            location: event.location,
            venueId: event.venue_id,
            venueName: event.venue_name,
            imageUrl: event.image_url,
            capacity: event.capacity,
            inviteCode: event.invite_code,
            specialOffers,
            theme: event.theme_id ? { id: event.theme_id } as EventTheme : undefined,
            isActive: event.is_active,
            createdAt: event.created_at,
            updatedBy: event.updated_by
          };
        }));

        setEvents(eventsWithOffers);
        
        // Update context with loaded events
        handleUpdatePromotionSettings({
          specialEvents: eventsWithOffers
        });
      } else {
        // If no events found, set empty array
        setEvents([]);
      }
    } catch (error) {
      console.error('Error loading special events:', error);
      toast.error('Failed to load special events');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle input changes for event form
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target as HTMLInputElement;
    
    if (type === 'checkbox') {
      const checkbox = e.target as HTMLInputElement;
      setFormData(prev => ({ ...prev, [name]: checkbox.checked }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  // Handle offer form input changes
  const handleOfferInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target as HTMLInputElement;
    
    if (type === 'checkbox') {
      const checkbox = e.target as HTMLInputElement;
      setOfferFormData(prev => ({ ...prev, [name]: checkbox.checked }));
    } else {
      setOfferFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  // Open add event form
  const handleAddEventClick = () => {
    // Reset form data
    setFormData({
      id: '',
      name: '',
      description: '',
      startDate: new Date().toISOString().split('T')[0],
      endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      location: '',
      venueId: '',
      venueName: '',
      imageUrl: '',
      capacity: '',
      inviteCode: '',
      isActive: true,
      themeId: ''
    });
    setSpecialOffers([]);
    setShowAddEvent(true);
    setShowEditEvent(false);
  };

  // Open edit event form
  const handleEditEventClick = (event: SpecialEvent) => {
    setCurrentEvent(event);
    setFormData({
      id: event.id,
      name: event.name,
      description: event.description,
      startDate: event.startDate.split('T')[0],
      endDate: event.endDate.split('T')[0],
      location: event.location,
      venueId: event.venueId || '',
      venueName: event.venueName || '',
      imageUrl: event.imageUrl || '',
      capacity: event.capacity?.toString() || '',
      inviteCode: event.inviteCode || '',
      isActive: event.isActive,
      themeId: event.theme?.id || ''
    });
    setSpecialOffers(event.specialOffers);
    setShowEditEvent(true);
    setShowAddEvent(false);
  };

  // Handle save event
  const handleSaveEvent = async () => {
    try {
      // Validate form data
      if (!formData.name || !formData.description || !formData.startDate || !formData.endDate) {
        toast.error('Please fill in all required fields');
        return;
      }

      // Get the current user's ID from Supabase auth
      const { data: { user } } = await supabase.auth.getUser();
      const userId = user?.id || 'system';

      // Convert form data to event object
      const eventData: SpecialEvent = {
        id: formData.id || Date.now().toString(),
        name: formData.name,
        description: formData.description,
        startDate: formData.startDate,
        endDate: formData.endDate,
        location: formData.location,
        venueId: formData.venueId || undefined,
        venueName: formData.venueName || undefined,
        imageUrl: formData.imageUrl || undefined,
        capacity: formData.capacity ? parseInt(formData.capacity) : undefined,
        inviteCode: formData.inviteCode || undefined,
        specialOffers: specialOffers,
        theme: formData.themeId ? promotionSettings.promotionTheme || undefined : undefined,
        isActive: formData.isActive,
        createdAt: new Date().toISOString(),
        updatedBy: userId
      };

      // Prepare data for database (convert from camelCase to snake_case)
      const dbEventData = {
        id: eventData.id,
        name: eventData.name,
        description: eventData.description,
        start_date: eventData.startDate,
        end_date: eventData.endDate,
        location: eventData.location,
        venue_id: eventData.venueId,
        venue_name: eventData.venueName,
        image_url: eventData.imageUrl,
        capacity: eventData.capacity,
        invite_code: eventData.inviteCode,
        theme_id: formData.themeId || null,
        is_active: eventData.isActive,
        updated_by: userId
      };

      // Save event to database
      const { error: eventError } = await supabase
        .from('te_special_events')
        .upsert(dbEventData);

      if (eventError) throw eventError;

      // Save special offers to database
      if (specialOffers.length > 0) {
        // First, get existing offers to know what to delete/update
        const { data: existingOffers, error: existingOffersError } = await supabase
          .from('te_special_offers')
          .select('id')
          .eq('event_id', eventData.id);
          
        if (existingOffersError) throw existingOffersError;
        
        // Prepare offers for upsert
        const dbOffers = specialOffers.map(offer => ({
          id: offer.id,
          event_id: eventData.id,
          title: offer.title,
          description: offer.description,
          discount_amount: offer.discountAmount,
          discount_type: offer.discountType,
          token_cost: offer.tokenCost,
          valid_from: offer.validFrom,
          valid_until: offer.validUntil,
          redemption_code: offer.redemptionCode,
          max_redemptions: offer.maxRedemptions,
          current_redemptions: offer.currentRedemptions || 0,
          is_active: offer.isActive
        }));
        
        // Upsert the offers
        const { error: offersError } = await supabase
          .from('te_special_offers')
          .upsert(dbOffers);
          
        if (offersError) throw offersError;
        
        // Find and delete removed offers
        if (existingOffers) {
          const currentOfferIds = specialOffers.map(o => o.id);
          const offersToDelete = existingOffers
            .filter(o => !currentOfferIds.includes(o.id))
            .map(o => o.id);
            
          if (offersToDelete.length > 0) {
            const { error: deleteError } = await supabase
              .from('te_special_offers')
              .delete()
              .in('id', offersToDelete);
              
            if (deleteError) throw deleteError;
          }
        }
      }

      // Update events array
      let updatedEvents: SpecialEvent[];
      if (showAddEvent) {
        // Add new event
        updatedEvents = [...events, eventData];
      } else {
        // Update existing event
        updatedEvents = events.map(e => e.id === eventData.id ? eventData : e);
      }

      // Update state and context
      setEvents(updatedEvents);
      await handleUpdatePromotionSettings({
        specialEvents: updatedEvents
      });

      toast.success(showAddEvent ? 'Event added successfully' : 'Event updated successfully');
      setShowAddEvent(false);
      setShowEditEvent(false);
    } catch (error) {
      console.error('Error saving event:', error);
      toast.error('Failed to save event');
    }
  };

  // Handle delete event
  const handleDeleteEvent = async (eventId: string) => {
    if (!confirm('Are you sure you want to delete this event?')) return;

    try {
      // Delete from database
      const { error: eventError } = await supabase
        .from('te_special_events')
        .delete()
        .eq('id', eventId);

      if (eventError) throw eventError;
      
      // Special offers should automatically be deleted due to CASCADE constraint

      // Update local state
      const updatedEvents = events.filter(e => e.id !== eventId);
      setEvents(updatedEvents);
      
      // Update context
      await handleUpdatePromotionSettings({
        specialEvents: updatedEvents
      });

      toast.success('Event deleted successfully');
    } catch (error) {
      console.error('Error deleting event:', error);
      toast.error('Failed to delete event');
    }
  };

  // Handle add special offer
  const handleAddOffer = () => {
    setOfferFormData({
      id: '',
      title: '',
      description: '',
      discountAmount: '',
      discountType: 'percentage',
      tokenCost: '',
      validFrom: new Date().toISOString().split('T')[0],
      validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      redemptionCode: '',
      maxRedemptions: '',
      isActive: true
    });
    setCurrentOffer(null);
    setShowAddOffer(true);
  };

  // Handle edit special offer
  const handleEditOffer = (offer: SpecialOffer) => {
    setCurrentOffer(offer);
    setOfferFormData({
      id: offer.id,
      title: offer.title,
      description: offer.description,
      discountAmount: offer.discountAmount?.toString() || '',
      discountType: offer.discountType || 'percentage',
      tokenCost: offer.tokenCost?.toString() || '',
      validFrom: offer.validFrom.split('T')[0],
      validUntil: offer.validUntil.split('T')[0],
      redemptionCode: offer.redemptionCode || '',
      maxRedemptions: offer.maxRedemptions?.toString() || '',
      isActive: offer.isActive
    });
    setShowAddOffer(true);
  };

  // Handle save offer
  const handleSaveOffer = () => {
    try {
      // Validate form data
      if (!offerFormData.title || !offerFormData.description) {
        toast.error('Please fill in required offer fields');
        return;
      }

      // Create offer object
      const offerData: SpecialOffer = {
        id: offerFormData.id || Date.now().toString(),
        title: offerFormData.title,
        description: offerFormData.description,
        discountAmount: offerFormData.discountAmount ? parseFloat(offerFormData.discountAmount) : undefined,
        discountType: offerFormData.discountType as 'percentage' | 'fixed' | 'tokenBased',
        tokenCost: offerFormData.tokenCost ? parseInt(offerFormData.tokenCost) : undefined,
        validFrom: offerFormData.validFrom,
        validUntil: offerFormData.validUntil,
        redemptionCode: offerFormData.redemptionCode || undefined,
        maxRedemptions: offerFormData.maxRedemptions ? parseInt(offerFormData.maxRedemptions) : undefined,
        currentRedemptions: 0,
        isActive: offerFormData.isActive
      };

      // Update offers array
      let updatedOffers: SpecialOffer[];
      if (currentOffer) {
        // Edit existing offer
        updatedOffers = specialOffers.map(o => o.id === offerData.id ? offerData : o);
      } else {
        // Add new offer
        updatedOffers = [...specialOffers, offerData];
      }

      setSpecialOffers(updatedOffers);
      setShowAddOffer(false);
      toast.success(currentOffer ? 'Offer updated' : 'Offer added');
    } catch (error) {
      console.error('Error saving offer:', error);
      toast.error('Failed to save offer');
    }
  };

  // Handle delete offer
  const handleDeleteOffer = (offerId: string) => {
    if (!confirm('Are you sure you want to delete this offer?')) return;
    
    const updatedOffers = specialOffers.filter(o => o.id !== offerId);
    setSpecialOffers(updatedOffers);
    toast.success('Offer deleted');
  };

  // Render event form (add/edit)
  const renderEventForm = () => (
    <div className="bg-white p-4 rounded-md shadow">
      <h3 className="text-lg font-semibold mb-4">
        {showAddEvent ? 'Add New Event' : 'Edit Event'}
      </h3>
      
      <div className="space-y-4">
        {/* Basic Event Details */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Event Name *</label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              className="w-full p-2 border border-gray-300 rounded"
              placeholder="Enter event name"
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-1">Location *</label>
            <input
              type="text"
              name="location"
              value={formData.location}
              onChange={handleInputChange}
              className="w-full p-2 border border-gray-300 rounded"
              placeholder="Enter location"
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-1">Start Date *</label>
            <input
              type="date"
              name="startDate"
              value={formData.startDate}
              onChange={handleInputChange}
              className="w-full p-2 border border-gray-300 rounded"
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-1">End Date *</label>
            <input
              type="date"
              name="endDate"
              value={formData.endDate}
              onChange={handleInputChange}
              className="w-full p-2 border border-gray-300 rounded"
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-1">Image URL</label>
            <input
              type="text"
              name="imageUrl"
              value={formData.imageUrl}
              onChange={handleInputChange}
              className="w-full p-2 border border-gray-300 rounded"
              placeholder="Enter image URL"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-1">Venue Name</label>
            <input
              type="text"
              name="venueName"
              value={formData.venueName}
              onChange={handleInputChange}
              className="w-full p-2 border border-gray-300 rounded"
              placeholder="Enter venue name"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-1">Capacity</label>
            <input
              type="number"
              name="capacity"
              value={formData.capacity}
              onChange={handleInputChange}
              className="w-full p-2 border border-gray-300 rounded"
              placeholder="Enter capacity"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-1">Invite Code</label>
            <input
              type="text"
              name="inviteCode"
              value={formData.inviteCode}
              onChange={handleInputChange}
              className="w-full p-2 border border-gray-300 rounded"
              placeholder="Enter invite code"
            />
          </div>
        </div>
        
        <div>
          <label className="block text-sm font-medium mb-1">Description *</label>
          <textarea
            name="description"
            value={formData.description}
            onChange={handleInputChange}
            className="w-full p-2 border border-gray-300 rounded"
            placeholder="Enter event description"
            rows={3}
            required
          />
        </div>
        
        <div className="flex items-center">
          <input
            type="checkbox"
            name="isActive"
            checked={formData.isActive}
            onChange={handleInputChange}
            className="h-4 w-4 mr-2"
          />
          <label className="text-sm font-medium">Event Active</label>
        </div>

        {/* Special Offers Section */}
        <div className="border-t pt-4 mt-4">
          <div className="flex justify-between items-center mb-3">
            <h4 className="font-medium">Special Offers</h4>
            <button
              onClick={handleAddOffer}
              className="px-2 py-1 bg-green-500 text-white rounded text-sm flex items-center"
            >
              <Plus size={16} className="mr-1" />
              Add Offer
            </button>
          </div>
          
          {/* List of special offers */}
          <div className="space-y-2">
            {specialOffers.length === 0 ? (
              <p className="text-sm text-gray-500">No special offers added yet</p>
            ) : (
              specialOffers.map(offer => (
                <div key={offer.id} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                  <div>
                    <p className="font-medium">{offer.title}</p>
                    <p className="text-sm text-gray-600">{offer.description}</p>
                    <div className="flex text-xs text-gray-500 mt-1">
                      <span className="flex items-center mr-3">
                        <Dollar size={12} className="mr-1" />
                        {offer.discountType === 'percentage' 
                          ? `${offer.discountAmount}% off` 
                          : offer.discountType === 'fixed' 
                            ? `$${offer.discountAmount} off`
                            : `${offer.tokenCost} tokens`
                        }
                      </span>
                      <span className="flex items-center">
                        <Clock size={12} className="mr-1" />
                        Valid until {new Date(offer.validUntil).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                  <div className="flex">
                    <button
                      onClick={() => handleEditOffer(offer)}
                      className="p-1 text-blue-500 hover:text-blue-700"
                    >
                      <Edit size={16} />
                    </button>
                    <button
                      onClick={() => handleDeleteOffer(offer.id)}
                      className="p-1 text-red-500 hover:text-red-700"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
        
        <div className="flex justify-end space-x-2 pt-4">
          <button
            onClick={() => {
              setShowAddEvent(false);
              setShowEditEvent(false);
            }}
            className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-100"
          >
            Cancel
          </button>
          <button
            onClick={handleSaveEvent}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Save Event
          </button>
        </div>
      </div>
    </div>
  );

  // Render offer form
  const renderOfferForm = () => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white p-4 rounded-md shadow-lg w-full max-w-md">
        <h3 className="text-lg font-semibold mb-4">
          {currentOffer ? 'Edit Offer' : 'Add New Offer'}
        </h3>
        
        <div className="space-y-3">
          <div>
            <label className="block text-sm font-medium mb-1">Title *</label>
            <input
              type="text"
              name="title"
              value={offerFormData.title}
              onChange={handleOfferInputChange}
              className="w-full p-2 border border-gray-300 rounded"
              placeholder="e.g. Early Bird Discount"
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-1">Description *</label>
            <textarea
              name="description"
              value={offerFormData.description}
              onChange={handleOfferInputChange}
              className="w-full p-2 border border-gray-300 rounded"
              placeholder="Describe the offer"
              rows={2}
              required
            />
          </div>
          
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium mb-1">Discount Type</label>
              <select
                name="discountType"
                value={offerFormData.discountType}
                onChange={handleOfferInputChange}
                className="w-full p-2 border border-gray-300 rounded"
              >
                <option value="percentage">Percentage</option>
                <option value="fixed">Fixed Amount</option>
                <option value="tokenBased">Token Based</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1">
                {offerFormData.discountType === 'tokenBased' ? 'Token Cost' : 'Discount Amount'}
              </label>
              <input
                type="number"
                name={offerFormData.discountType === 'tokenBased' ? 'tokenCost' : 'discountAmount'}
                value={offerFormData.discountType === 'tokenBased' ? offerFormData.tokenCost : offerFormData.discountAmount}
                onChange={handleOfferInputChange}
                className="w-full p-2 border border-gray-300 rounded"
                placeholder={offerFormData.discountType === 'percentage' ? 'e.g. 10 for 10%' : 'Enter amount'}
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1">Valid From</label>
              <input
                type="date"
                name="validFrom"
                value={offerFormData.validFrom}
                onChange={handleOfferInputChange}
                className="w-full p-2 border border-gray-300 rounded"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1">Valid Until</label>
              <input
                type="date"
                name="validUntil"
                value={offerFormData.validUntil}
                onChange={handleOfferInputChange}
                className="w-full p-2 border border-gray-300 rounded"
              />
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-1">Redemption Code</label>
            <input
              type="text"
              name="redemptionCode"
              value={offerFormData.redemptionCode}
              onChange={handleOfferInputChange}
              className="w-full p-2 border border-gray-300 rounded"
              placeholder="Optional code to redeem offer"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-1">Max Redemptions</label>
            <input
              type="number"
              name="maxRedemptions"
              value={offerFormData.maxRedemptions}
              onChange={handleOfferInputChange}
              className="w-full p-2 border border-gray-300 rounded"
              placeholder="Leave empty for unlimited"
            />
          </div>
          
          <div className="flex items-center">
            <input
              type="checkbox"
              name="isActive"
              checked={offerFormData.isActive}
              onChange={handleOfferInputChange}
              className="h-4 w-4 mr-2"
            />
            <label className="text-sm font-medium">Offer Active</label>
          </div>
          
          <div className="flex justify-end space-x-2 pt-3">
            <button
              onClick={() => setShowAddOffer(false)}
              className="px-3 py-1 border border-gray-300 rounded hover:bg-gray-100"
            >
              Cancel
            </button>
            <button
              onClick={handleSaveOffer}
              className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              Save Offer
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  // Main component render
  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold">Special Events Manager</h2>
        <button
          onClick={handleAddEventClick}
          className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 flex items-center"
        >
          <Plus size={18} className="mr-1" />
          Add New Event
        </button>
      </div>

      {isLoading ? (
        <div className="text-center py-8">
          <p>Loading events...</p>
        </div>
      ) : (
        <div>
          {/* Event Form (Add/Edit) */}
          {(showAddEvent || showEditEvent) && renderEventForm()}

          {/* Offer Form Modal */}
          {showAddOffer && renderOfferForm()}

          {/* List of Events */}
          {!showAddEvent && !showEditEvent && (
            <div className="space-y-4">
              {events.length === 0 ? (
                <div className="text-center py-8 border border-dashed rounded-md">
                  <p className="text-gray-500">No special events added yet</p>
                  <button
                    onClick={handleAddEventClick}
                    className="mt-2 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                  >
                    Create Your First Event
                  </button>
                </div>
              ) : (
                events.map(event => (
                  <div key={event.id} className="bg-white p-4 rounded-lg shadow">
                    <div className="flex justify-between">
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold">{event.name}</h3>
                        <p className="text-sm text-gray-600 line-clamp-2 mb-2">{event.description}</p>
                        
                        <div className="flex flex-wrap gap-3 text-sm text-gray-500">
                          <span className="flex items-center">
                            <Calendar size={14} className="mr-1" />
                            {new Date(event.startDate).toLocaleDateString()} - {new Date(event.endDate).toLocaleDateString()}
                          </span>
                          <span className="flex items-center">
                            <MapPin size={14} className="mr-1" />
                            {event.location}
                          </span>
                          {event.capacity && (
                            <span className="flex items-center">
                              <Users size={14} className="mr-1" />
                              Capacity: {event.capacity}
                            </span>
                          )}
                          {event.specialOffers.length > 0 && (
                            <span className="flex items-center">
                              <Tag size={14} className="mr-1" />
                              {event.specialOffers.length} Offer(s)
                            </span>
                          )}
                        </div>
                        
                        {/* Status badge */}
                        <div className="mt-3">
                          <span className={`inline-flex px-2 py-1 text-xs rounded-full ${
                            event.isActive 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-gray-100 text-gray-800'
                          }`}>
                            {event.isActive ? 'Active' : 'Inactive'}
                          </span>
                        </div>
                      </div>
                      
                      {/* Event image */}
                      {event.imageUrl && (
                        <div className="w-24 h-24 ml-4">
                          <img 
                            src={event.imageUrl} 
                            alt={event.name}
                            className="w-full h-full object-cover rounded"
                          />
                        </div>
                      )}
                    </div>
                    
                    {/* Actions */}
                    <div className="mt-4 flex justify-end space-x-2">
                      <button
                        onClick={() => handleEditEventClick(event)}
                        className="px-3 py-1 text-sm bg-blue-500 text-white rounded hover:bg-blue-600 flex items-center"
                      >
                        <Edit size={14} className="mr-1" />
                        Edit
                      </button>
                      <button
                        onClick={() => handleDeleteEvent(event.id)}
                        className="px-3 py-1 text-sm bg-red-500 text-white rounded hover:bg-red-600 flex items-center"
                      >
                        <Trash2 size={14} className="mr-1" />
                        Delete
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default SpecialEventsManager;
