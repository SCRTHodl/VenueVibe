import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../../ui/card';
import { Button } from '../../ui/button';
import { Loader2 } from 'lucide-react';
import { SpecialEvent, SpecialOffer, EventTheme } from '../../../types';

interface EventFormProps {
  event: SpecialEvent | null;
  onSave: (event: SpecialEvent | null) => void;
  isSaving?: boolean;
}

const EventForm: React.FC<EventFormProps> = ({ event, onSave, isSaving = false }) => {
  const [formData, setFormData] = useState<SpecialEvent>(() => {
    const defaultEvent: SpecialEvent = {
      id: '',
      name: '',
      description: '',
      location: '',
      startDate: '',
      endDate: '',
      imageUrl: '',
      venueId: '',
      venueName: '',
      capacity: 0,
      inviteCode: '',
      specialOffers: [],
      theme: undefined,
      isActive: false,
      createdAt: new Date().toISOString(),
      updatedBy: '',
    };

    return event ? { ...defaultEvent, ...event } : defaultEvent;
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSpecialOffersChange = (index: number, field: keyof SpecialOffer, value: any) => {
    setFormData(prev => {
      const newSpecialOffers = [...prev.specialOffers];
      newSpecialOffers[index] = { ...newSpecialOffers[index], [field]: value };
      return { ...prev, specialOffers: newSpecialOffers };
    });
  };

  const addSpecialOffer = () => {
    setFormData(prev => ({
      ...prev,
      specialOffers: [...prev.specialOffers, {
        id: '',
        title: '',
        description: '',
        discountAmount: 0,
        discountType: 'percentage',
        tokenCost: 0,
        validFrom: new Date().toISOString(),
        validUntil: new Date(Date.now() + 3600000).toISOString(),
        redemptionCode: '',
        maxRedemptions: 0,
        currentRedemptions: 0,
        isActive: true,
      }]
    }));
  };

  const removeSpecialOffer = (index: number) => {
    setFormData(prev => ({
      ...prev,
      specialOffers: prev.specialOffers.filter((_, i) => i !== index)
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle>{event ? 'Edit Event' : 'Create New Event'}</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Event Name</label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                className="w-full px-3 py-2 border rounded-md"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Location</label>
              <input
                type="text"
                name="location"
                value={formData.location}
                onChange={handleChange}
                className="w-full px-3 py-2 border rounded-md"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Start Date</label>
              <input
                type="datetime-local"
                name="startDate"
                value={formData.startDate}
                onChange={handleChange}
                className="w-full px-3 py-2 border rounded-md"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">End Date</label>
              <input
                type="datetime-local"
                name="endDate"
                value={formData.endDate}
                onChange={handleChange}
                className="w-full px-3 py-2 border rounded-md"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Description</label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              className="w-full px-3 py-2 border rounded-md"
              rows={4}
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Capacity</label>
              <input
                type="number"
                name="capacity"
                value={formData.capacity}
                onChange={handleChange}
                className="w-full px-3 py-2 border rounded-md"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Invite Code</label>
              <input
                type="text"
                name="inviteCode"
                value={formData.inviteCode}
                onChange={handleChange}
                className="w-full px-3 py-2 border rounded-md"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Special Offers</label>
            <div className="space-y-4">
              {formData.specialOffers.map((offer, index) => (
                <div key={index} className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <input
                      type="text"
                      placeholder="Offer Title"
                      value={offer.title}
                      onChange={(e) => handleSpecialOffersChange(index, 'title', e.target.value)}
                      className="w-full px-3 py-2 border rounded-md"
                    />
                  </div>
                  <div>
                    <input
                      type="text"
                      placeholder="Description"
                      value={offer.description}
                      onChange={(e) => handleSpecialOffersChange(index, 'description', e.target.value)}
                      className="w-full px-3 py-2 border rounded-md"
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <input
                      type="number"
                      placeholder="Discount Amount"
                      value={offer.discountAmount}
                      onChange={(e) => handleSpecialOffersChange(index, 'discountAmount', Number(e.target.value))}
                      className="w-full px-3 py-2 border rounded-md"
                    />
                    <button
                      type="button"
                      onClick={() => removeSpecialOffer(index)}
                      className="text-red-500 hover:text-red-700"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              ))}
              <Button
                type="button"
                onClick={addSpecialOffer}
                className="w-full sm:w-auto"
              >
                Add Special Offer
              </Button>
            </div>
          </div>

          <div className="flex justify-end gap-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onSave(null)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSaving}
              className="bg-primary text-white hover:bg-primary/90"
            >
              {isSaving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                'Save Event'
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};

export default EventForm;
