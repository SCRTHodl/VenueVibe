import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/card';
import { Button } from '../ui/button';
import { Loader2 } from 'lucide-react';
import EventForm from './Events/EventForm';
import EventList from './Events/EventList';
import EventNFTs from './EventNFTs';
import EventStats from './Events/EventStats';
import { SpecialEvent } from '../../../src/types';

const SpecialEventsManager: React.FC = () => {
  const [events, setEvents] = useState<SpecialEvent[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<SpecialEvent | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadEvents();
  }, []);

  const loadEvents = async () => {
    try {
      setIsLoading(true);
      // Load events from your data source
      // This is a placeholder - replace with your actual data loading logic
      const events = await fetchEvents();
      setEvents(events);
    } catch (error) {
      console.error('Error loading events:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchEvents = async (): Promise<SpecialEvent[]> => {
    // Replace with your actual data fetching logic
    return [
      {
        id: '1',
        name: 'Sample Event',
        description: 'This is a sample event',
        location: 'Online',
        startDate: new Date().toISOString(),
        endDate: new Date(Date.now() + 3600000).toISOString(),
        imageUrl: 'https://placeholder.com/event-image.png',
        venueId: '1',
        venueName: 'Sample Venue',
        capacity: 100,
        inviteCode: 'EVENT123',
        specialOffers: [],
        theme: undefined,
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedBy: 'admin',
      },
    ];
  };

  const handleEventSave = async (event: SpecialEvent) => {
    try {
      setIsSaving(true);
      // Save event to your data source
      // This is a placeholder - replace with your actual save logic
      await saveEvent(event);
      
      // Update local state
      if (event.id) {
        setEvents(prev => 
          prev.map(e => e.id === event.id ? event : e)
        );
      } else {
        const newEvent = { ...event, id: Date.now().toString() };
        setEvents(prev => [...prev, newEvent]);
        setSelectedEvent(newEvent);
      }
    } catch (error) {
      console.error('Error saving event:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const saveEvent = async (event: SpecialEvent) => {
    // Replace with your actual save logic
    console.log('Saving event:', event);
  };

  const handleEventDelete = async (eventId: string) => {
    try {
      // Delete event from your data source
      // This is a placeholder - replace with your actual delete logic
      await deleteEvent(eventId);
      
      // Update local state
      setEvents(prev => prev.filter(e => e.id !== eventId));
      if (selectedEvent?.id === eventId) {
        setSelectedEvent(null);
      }
    } catch (error) {
      console.error('Error deleting event:', error);
    }
  };

  const deleteEvent = async (eventId: string) => {
    // Replace with your actual delete logic
    console.log('Deleting event:', eventId);
  };

  const handleEventSelect = (event: SpecialEvent) => {
    setSelectedEvent(event);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-4">
        <Loader2 className="animate-spin h-6 w-6" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-semibold">Special Events Manager</h2>
        <Button
          onClick={() => setSelectedEvent(null)}
          disabled={isSaving || isLoading}
        >
          {isSaving ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Creating...
            </>
          ) : (
            'Create New Event'
          )}
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <EventList
            events={events}
            onSelect={handleEventSelect}
            onDelete={handleEventDelete}
            selectedEventId={selectedEvent?.id}
          />
        </div>
        <div className="lg:col-span-1">
          {selectedEvent ? (
            <>
              <EventForm
                event={selectedEvent}
                onSave={handleEventSave}
                isSaving={isSaving}
              />
              <EventNFTs event={selectedEvent} />
              <EventStats event={selectedEvent} />
            </>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle>Select an Event</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-500">
                  Select an event from the list to view its details and manage NFTs.
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default SpecialEventsManager;
