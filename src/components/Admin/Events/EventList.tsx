import React from 'react';
import { Card, CardContent, CardHeader } from '../../ui/card';
import { Button } from '../../ui/button';
import { SpecialEvent } from '../../../types';

interface EventListProps {
  events: SpecialEvent[];
  onSelect: (event: SpecialEvent) => void;
  onDelete: (eventId: string) => void;
  selectedEventId?: string;
}

const EventList: React.FC<EventListProps> = ({ events, onSelect, onDelete, selectedEventId }) => {
  return (
    <Card>
      <CardHeader>
        <h3 className="text-lg font-semibold">Events</h3>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {events.map((event) => (
            <Card
              key={event.id}
              className={`p-4 cursor-pointer ${
                selectedEventId === event.id ? 'bg-blue-500/10' : ''
              }`}
              onClick={() => onSelect(event)}
            >
              <div className="flex justify-between items-start">
                <div>
                  <h4 className="font-medium">{event.name}</h4>
                  <p className="text-gray-500">{event.description}</p>
                  <div className="flex justify-between text-sm">
                    <span>Location: {event.location}</span>
                    <span>Start: {new Date(event.startDate).toLocaleString()}</span>
                    <span>End: {new Date(event.endDate).toLocaleString()}</span>
                  </div>
                </div>
                <div className="flex gap-2 mt-4">
                  <Button
                    variant="ghost"
                    onClick={(e) => {
                      e.stopPropagation();
                      onDelete(event.id);
                    }}
                  >
                    Delete
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default EventList;
