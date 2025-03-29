import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../../ui/card';
import { Button } from '../../ui/button';
import { Loader2 } from 'lucide-react';
import { SpecialEvent, SpecialOffer, EventTheme } from '../../../types';

interface EventFormProps {
  event: SpecialEvent | null;
  onSave: (event: SpecialEvent) => void;
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
    <Card>
      <CardHeader>
        <CardTitle>Event Details</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Event Name</label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              className="w-full p-2 border border-gray-300 rounded bg-white text-black focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Description</label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              className="w-full p-2 border border-gray-300 rounded bg-white text-black focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Location</label>
            <input
              type="text"
              name="location"
              value={formData.location}
              onChange={handleChange}
              className="w-full p-2 border border-gray-300 rounded bg-white text-black focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Start Date</label>
              <input
                type="datetime-local"
                name="startDate"
                value={formData.startDate}
                onChange={handleChange}
                className="w-full p-2 border border-gray-300 rounded bg-white text-black focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">End Date</label>
              <input
                type="datetime-local"
                name="endDate"
                value={formData.endDate}
                onChange={handleChange}
                className="w-full p-2 border border-gray-300 rounded bg-white text-black focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Event Image URL</label>
            <input
              type="text"
              name="imageUrl"
              value={formData.imageUrl}
              onChange={handleChange}
              className="w-full p-2 border border-gray-300 rounded bg-white text-black focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Venue ID</label>
            <input
              type="text"
              name="venueId"
              value={formData.venueId}
              onChange={handleChange}
              className="w-full p-2 border border-gray-300 rounded bg-white text-black focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Venue Name</label>
            <input
              type="text"
              name="venueName"
              value={formData.venueName}
              onChange={handleChange}
              className="w-full p-2 border border-gray-300 rounded bg-white text-black focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Capacity</label>
            <input
              type="number"
              name="capacity"
              value={formData.capacity}
              onChange={handleChange}
              className="w-full p-2 border border-gray-300 rounded bg-white text-black focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Invite Code</label>
            <input
              type="text"
              name="inviteCode"
              value={formData.inviteCode}
              onChange={handleChange}
              className="w-full p-2 border border-gray-300 rounded bg-white text-black focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Is Active</label>
            <input
              type="checkbox"
              name="isActive"
              checked={formData.isActive}
              onChange={handleChange}
              className="w-4 h-4 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <h3 className="text-sm font-medium mb-2">Special Offers</h3>
            {formData.specialOffers.map((offer, index) => (
              <div key={index} className="border rounded-lg p-4 mb-4">
                <div className="flex justify-between items-center mb-2">
                  <h4 className="text-sm font-medium">Offer {index + 1}</h4>
                  <Button
                    variant="destructive"
                    onClick={(e) => {
                      e.stopPropagation();
                      removeSpecialOffer(index);
                    }}
                  >
                    Remove
                  </Button>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Title</label>
                    <input
                      type="text"
                      value={offer.title}
                      onChange={(e) => handleSpecialOffersChange(index, 'title', e.target.value)}
                      className="w-full p-2 border border-gray-300 rounded bg-white text-black focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Description</label>
                    <textarea
                      value={offer.description}
                      onChange={(e) => handleSpecialOffersChange(index, 'description', e.target.value)}
                      className="w-full p-2 border border-gray-300 rounded bg-white text-black focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Discount Amount</label>
                    <input
                      type="number"
                      value={offer.discountAmount}
                      onChange={(e) => handleSpecialOffersChange(index, 'discountAmount', Number(e.target.value))}
                      className="w-full p-2 border border-gray-300 rounded bg-white text-black focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Discount Type</label>
                    <select
                      value={offer.discountType}
                      onChange={(e) => handleSpecialOffersChange(index, 'discountType', e.target.value as 'percentage' | 'fixed' | 'tokenBased')}
                      className="w-full p-2 border border-gray-300 rounded bg-white text-black focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="percentage">Percentage</option>
                      <option value="fixed">Fixed Amount</option>
                      <option value="tokenBased">Token Based</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Token Cost</label>
                    <input
                      type="number"
                      value={offer.tokenCost}
                      onChange={(e) => handleSpecialOffersChange(index, 'tokenCost', Number(e.target.value))}
                      className="w-full p-2 border border-gray-300 rounded bg-white text-black focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Redemption Code</label>
                    <input
                      type="text"
                      value={offer.redemptionCode}
                      onChange={(e) => handleSpecialOffersChange(index, 'redemptionCode', e.target.value)}
                      className="w-full p-2 border border-gray-300 rounded bg-white text-black focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>
              </div>
            ))}
            <Button
              variant="outline"
              onClick={(e) => {
                e.preventDefault();
                addSpecialOffer();
              }}
            >
              Add Special Offer
            </Button>
          </div>
          <div className="flex justify-end">
            <Button type="submit" disabled={isSaving}>
              {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save Event
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};

export default EventForm;
