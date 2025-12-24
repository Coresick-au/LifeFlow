import React, { useMemo, useState } from 'react';
import { format, differenceInYears, differenceInDays } from 'date-fns';
import { useTimelineStore } from '../store/timelineStore';
import { Story } from '../types';
import { Home, Wrench, Calendar, DollarSign, MapPin, Plus, Edit2, PiggyBank, Palmtree } from 'lucide-react';
import { HouseTrackerForm } from './HouseTrackerForm';

interface HomeEvent {
  id: string;
  title: string;
  date: Date;
  type: 'purchase' | 'renovation' | 'maintenance' | 'improvement' | 'memory' | 'sale';
  cost?: number;
  description: string;
  location: string;
  address?: string;
  purchasePrice?: number;
  salePrice?: number;
  bedrooms?: number;
  bathrooms?: number;
  squareFootage?: number;
  images?: string[];
  propertyType?: 'residence' | 'investment' | 'holiday';
}

interface HomeStats {
  totalYears: number;
  totalEvents: number;
  renovationCount: number;
  maintenanceCount: number;
  estimatedValue?: number;
}

export const HomeTracker: React.FC = () => {
  const { stories, setCurrentView } = useTimelineStore();
  const [selectedHome, setSelectedHome] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingEvent, setEditingEvent] = useState<HomeEvent | null>(null);

  // Handle edit click
  const handleEdit = (event: HomeEvent) => {
    setEditingEvent(event);
    setShowForm(true);
  };

  // Handle form close
  const handleFormClose = () => {
    setShowForm(false);
    setEditingEvent(null);
  };

  // Filter home-related stories
  const homeStories = useMemo(() => {
    return stories.filter(story =>
      story.tags.some(tag =>
        ['home', 'house', 'renovation', 'maintenance', 'property'].includes(tag.toLowerCase())
      ) || story.location?.toLowerCase().includes('home')
    );
  }, [stories]);

  // Extract unique homes
  const homes = useMemo(() => {
    const homesSet = new Set<string>();
    homeStories.forEach(story => {
      if (story.location && !story.location.toLowerCase().includes('home')) {
        homesSet.add(story.location);
      } else {
        homesSet.add('My Home');
      }
    });
    return Array.from(homesSet);
  }, [homeStories]);

  // Process home events
  const homeEvents = useMemo(() => {
    const events: HomeEvent[] = [];

    homeStories.forEach(story => {
      // Determine event type
      let type: HomeEvent['type'] = 'memory';

      if (story.tags.some(t => ['purchase', 'bought'].includes(t.toLowerCase()))) {
        type = 'purchase';
      } else if (story.tags.some(t => ['sale', 'sold'].includes(t.toLowerCase()))) {
        type = 'sale';
      } else if (story.tags.some(t => ['renovation', 'remodel'].includes(t.toLowerCase()))) {
        type = 'renovation';
      } else if (story.tags.some(t => ['maintenance', 'repair'].includes(t.toLowerCase()))) {
        type = 'maintenance';
      } else if (story.tags.some(t => ['improvement', 'upgrade'].includes(t.toLowerCase()))) {
        type = 'improvement';
      }

      // Determine property type from metadata or tags
      let propertyType: HomeEvent['propertyType'] = story.metadata?.propertyType as HomeEvent['propertyType'];
      if (!propertyType) {
        if (story.tags.some(t => t.toLowerCase() === 'investment')) {
          propertyType = 'investment';
        } else if (story.tags.some(t => t.toLowerCase() === 'holiday')) {
          propertyType = 'holiday';
        } else {
          propertyType = 'residence'; // Default to residence for legacy data
        }
      }

      // Extract cost from content or metadata
      const costMatch = story.content.match(/\$(\d+(?:,\d{3})*(?:\.\d{2})?)/);
      const cost = costMatch ? parseFloat(costMatch[1].replace(/,/g, '')) : story.metadata?.cost;

      // Extract home details from metadata
      const address = story.metadata?.address;
      const purchasePrice = story.metadata?.purchasePrice;
      const salePrice = story.metadata?.salePrice;
      const bedrooms = story.metadata?.bedrooms;
      const bathrooms = story.metadata?.bathrooms;
      const squareFootage = story.metadata?.squareFootage;

      events.push({
        id: story.id,
        title: story.title,
        date: new Date(story.date),
        type,
        cost,
        description: story.content,
        location: story.location || 'My Home',
        address,
        purchasePrice,
        salePrice,
        bedrooms,
        bathrooms,
        squareFootage,
        images: story.images,
        propertyType,
      });
    });

    return events.sort((a, b) => b.date.getTime() - a.date.getTime());
  }, [homeStories]);

  // Calculate home stats
  const homeStats = useMemo((): HomeStats => {
    if (homeEvents.length === 0) {
      return {
        totalYears: 0,
        totalEvents: 0,
        renovationCount: 0,
        maintenanceCount: 0,
      };
    }

    // Find the earliest event (likely purchase)
    const earliestEvent = homeEvents[homeEvents.length - 1];
    const totalYears = differenceInYears(new Date(), earliestEvent.date);

    const renovationCount = homeEvents.filter(e => e.type === 'renovation').length;
    const maintenanceCount = homeEvents.filter(e => e.type === 'maintenance').length;

    // Estimate value based on improvements
    const totalImprovements = homeEvents
      .filter(e => e.cost && (e.type === 'renovation' || e.type === 'improvement'))
      .reduce((sum, e) => sum + (e.cost || 0), 0);

    return {
      totalYears,
      totalEvents: homeEvents.length,
      renovationCount,
      maintenanceCount,
      estimatedValue: totalImprovements > 0 ? totalImprovements : undefined,
    };
  }, [homeEvents]);

  // Filter events by selected home
  const filteredEvents = useMemo(() => {
    if (!selectedHome) return homeEvents;
    return homeEvents.filter(event => event.location === selectedHome);
  }, [homeEvents, selectedHome]);

  // Group events by year
  const eventsByYear = useMemo(() => {
    const grouped: Record<number, HomeEvent[]> = {};

    filteredEvents.forEach(event => {
      const year = event.date.getFullYear();
      if (!grouped[year]) grouped[year] = [];
      grouped[year].push(event);
    });

    return Object.entries(grouped)
      .map(([year, events]) => ({ year: parseInt(year), events }))
      .sort((a, b) => b.year - a.year);
  }, [filteredEvents]);

  // Get event icon
  const getEventIcon = (type: HomeEvent['type'], propertyType?: HomeEvent['propertyType']) => {
    if (propertyType === 'investment') {
      return <PiggyBank className="w-4 h-4 text-blue-500" />;
    }
    if (propertyType === 'holiday') {
      return <Palmtree className="w-4 h-4 text-purple-500" />;
    }
    switch (type) {
      case 'purchase': return <Home className="w-4 h-4 text-green-600" />;
      case 'sale': return <DollarSign className="w-4 h-4 text-red-500" />;
      case 'renovation': return <Wrench className="w-4 h-4 text-blue-600" />;
      case 'maintenance': return <Wrench className="w-4 h-4 text-orange-600" />;
      case 'improvement': return <Plus className="w-4 h-4 text-purple-600" />;
      default: return <Home className="w-4 h-4 text-theme-tertiary" />;
    }
  };

  // Split events by property type
  const residenceEvents = useMemo(() => {
    return filteredEvents.filter(e => e.propertyType === 'residence' || !e.propertyType);
  }, [filteredEvents]);

  const investmentEvents = useMemo(() => {
    return filteredEvents.filter(e => e.propertyType === 'investment');
  }, [filteredEvents]);

  const holidayEvents = useMemo(() => {
    return filteredEvents.filter(e => e.propertyType === 'holiday');
  }, [filteredEvents]);

  // Get event type label
  const getEventTypeLabel = (type: HomeEvent['type']) => {
    switch (type) {
      case 'purchase': return 'Purchase';
      case 'renovation': return 'Renovation';
      case 'maintenance': return 'Maintenance';
      case 'improvement': return 'Improvement';
      default: return 'Memory';
    }
  };

  if (homeStories.length === 0) {
    return (
      <div className="bg-theme-primary rounded-lg shadow-lg p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <Home className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-theme-primary mb-2">No home events yet</h3>
            <p className="text-slate-500 dark:text-slate-400 mb-4">Add stories with #home or #house tags to track your home journey</p>
            <button
              onClick={() => setShowForm(true)}
              className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 transition-colors"
            >
              Add Home Event
            </button>
          </div>
        </div>

        {/* House Tracker Form - must be inside this return for empty state */}
        {showForm && (
          <HouseTrackerForm
            onClose={handleFormClose}
          />
        )}
      </div>
    );
  }

  return (
    <div className="bg-theme-primary rounded-lg shadow-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-theme-primary">House Tracker</h2>
        <button
          onClick={() => setShowForm(true)}
          className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 transition-colors"
        >
          Add Home Event
        </button>
      </div>

      {/* Home Selector */}
      {homes.length > 1 && (
        <div className="mb-6">
          <label className="block text-sm font-medium text-theme-secondary mb-2">Select Property:</label>
          <select
            value={selectedHome || homes[0]}
            onChange={(e) => setSelectedHome(e.target.value)}
            className="w-full px-3 py-2 border border-theme rounded-md bg-theme-primary text-theme-primary focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            {homes.map(home => (
              <option key={home} value={home}>{home}</option>
            ))}
          </select>
        </div>
      )}

      {/* Home Details Card */}
      {filteredEvents.length > 0 && filteredEvents[0].address && (
        <div className="mb-8 bg-gradient-to-r from-green-900/20 to-blue-900/20 rounded-lg p-6 border border-green-800/30">
          <h3 className="text-lg font-semibold text-theme-primary mb-4">Property Details</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-slate-500 dark:text-slate-400" />
                  <span className="text-sm font-medium text-theme-secondary">Address:</span>
                  <span className="text-sm text-theme-primary">{filteredEvents[0].address}</span>
                </div>
                {filteredEvents[0].purchasePrice && (
                  <div className="flex items-center gap-2">
                    <DollarSign className="w-4 h-4 text-slate-500 dark:text-slate-400" />
                    <span className="text-sm font-medium text-theme-secondary">Purchase Price:</span>
                    <span className="text-sm text-theme-primary">${filteredEvents[0].purchasePrice.toLocaleString()}</span>
                  </div>
                )}
                {filteredEvents[0].salePrice && (
                  <div className="flex items-center gap-2">
                    <DollarSign className="w-4 h-4 text-slate-500 dark:text-slate-400" />
                    <span className="text-sm font-medium text-theme-secondary">Sale Price:</span>
                    <span className="text-sm text-theme-primary">${filteredEvents[0].salePrice.toLocaleString()}</span>
                  </div>
                )}
              </div>
            </div>
            <div>
              <div className="space-y-2">
                {filteredEvents[0].bedrooms && (
                  <div className="flex items-center gap-2">
                    <Home className="w-4 h-4 text-slate-500 dark:text-slate-400" />
                    <span className="text-sm font-medium text-theme-secondary">Bedrooms:</span>
                    <span className="text-sm text-theme-primary">{filteredEvents[0].bedrooms}</span>
                  </div>
                )}
                {filteredEvents[0].bathrooms && (
                  <div className="flex items-center gap-2">
                    <Home className="w-4 h-4 text-slate-500 dark:text-slate-400" />
                    <span className="text-sm font-medium text-theme-secondary">Bathrooms:</span>
                    <span className="text-sm text-theme-primary">{filteredEvents[0].bathrooms}</span>
                  </div>
                )}
                {filteredEvents[0].squareFootage && (
                  <div className="flex items-center gap-2">
                    <Home className="w-4 h-4 text-slate-500 dark:text-slate-400" />
                    <span className="text-sm font-medium text-theme-secondary">Square Footage:</span>
                    <span className="text-sm text-theme-primary">{filteredEvents[0].squareFootage.toLocaleString()} sq ft</span>
                  </div>
                )}
              </div>
            </div>
          </div>
          {/* Home Photos */}
          {filteredEvents[0].images && filteredEvents[0].images.length > 0 && (
            <div className="mt-4">
              <h4 className="text-sm font-medium text-theme-secondary mb-2">Photos</h4>
              <div className="flex gap-2">
                {filteredEvents[0].images.slice(0, 3).map((image, index) => (
                  <img
                    key={index}
                    src={image}
                    alt={`Home photo ${index + 1}`}
                    className="w-24 h-24 object-cover rounded-lg"
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Home Stats Overview */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div className="text-center p-4 bg-theme-tertiary rounded-lg">
          <div className="text-2xl font-bold text-theme-primary">{homeStats.totalYears}</div>
          <div className="text-sm text-theme-tertiary">Years in Home</div>
        </div>
        <div className="text-center p-4 bg-theme-tertiary rounded-lg">
          <div className="text-2xl font-bold text-theme-primary">{homeStats.totalEvents}</div>
          <div className="text-sm text-theme-tertiary">Total Events</div>
        </div>
        <div className="text-center p-4 bg-theme-tertiary rounded-lg">
          <div className="text-2xl font-bold text-theme-primary">{homeStats.renovationCount}</div>
          <div className="text-sm text-theme-tertiary">Renovations</div>
        </div>
        <div className="text-center p-4 bg-theme-tertiary rounded-lg">
          <div className="text-2xl font-bold text-theme-primary">{homeStats.maintenanceCount}</div>
          <div className="text-sm text-theme-tertiary">Maintenance</div>
        </div>
      </div>

      {/* Recent Events */}
      <div>
        <h3 className="text-lg font-semibold text-theme-primary mb-4">Home History</h3>

        <div className="space-y-6">
          {eventsByYear.map(({ year, events }) => (
            <div key={year} className="border-l-2 border-theme pl-6 relative">
              <div className="absolute -left-2 top-0 w-4 h-4 bg-primary-600 rounded-full"></div>
              <h4 className="font-bold text-theme-primary mb-3">{year}</h4>

              <div className="space-y-4">
                {events.map(event => (
                  <div key={event.id} className="bg-theme-tertiary rounded-lg p-4 hover:shadow-md transition-shadow group">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        {getEventIcon(event.type)}
                        <h5 className="font-medium text-theme-primary">{event.title}</h5>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
                        <Calendar className="w-3 h-3" />
                        {format(event.date, 'MMM d')}
                        {event.cost && (
                          <span className="flex items-center gap-1">
                            <DollarSign className="w-3 h-3" />
                            {event.cost.toLocaleString()}
                          </span>
                        )}
                        <button
                          onClick={() => handleEdit(event)}
                          className="p-1.5 hover:bg-theme-tertiary rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                          title="Edit"
                        >
                          <Edit2 className="w-4 h-4 text-theme-secondary" />
                        </button>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 text-sm text-theme-tertiary mb-2">
                      <span className="capitalize">{getEventTypeLabel(event.type)}</span>
                      {event.location !== 'My Home' && (
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3 h-3" />
                          {event.location}
                        </span>
                      )}
                      {event.address && (
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3 h-3" />
                          {event.address}
                        </span>
                      )}
                    </div>

                    <p className="text-theme-secondary text-sm mb-2">{event.description}</p>

                    {/* Home Details */}
                    {(event.bedrooms || event.bathrooms || event.squareFootage) && (
                      <div className="flex gap-4 text-xs text-slate-500 dark:text-slate-400 mt-2">
                        {event.bedrooms && <span>{event.bedrooms} bed</span>}
                        {event.bathrooms && <span>{event.bathrooms} bath</span>}
                        {event.squareFootage && <span>{event.squareFootage.toLocaleString()} sqft</span>}
                      </div>
                    )}

                    {/* Event Photos */}
                    {event.images && event.images.length > 0 && (
                      <div className="flex gap-1 mt-2">
                        {event.images.slice(0, 2).map((image, index) => (
                          <img
                            key={index}
                            src={image}
                            alt={`Event photo ${index + 1}`}
                            className="w-16 h-16 object-cover rounded"
                          />
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Add Home Event Button */}
      <div className="mt-6 flex justify-center">
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
        >
          <Plus className="w-5 h-5" />
          Add Home Event
        </button>
      </div>

      {/* House Tracker Form */}
      {showForm && (
        <HouseTrackerForm
          onClose={handleFormClose}
          editData={editingEvent ? {
            id: editingEvent.id,
            address: editingEvent.address || editingEvent.location,
            purchasePrice: editingEvent.purchasePrice,
            salePrice: editingEvent.salePrice,
            bedrooms: editingEvent.bedrooms,
            bathrooms: editingEvent.bathrooms,
            squareFootage: editingEvent.squareFootage,
            photos: editingEvent.images,
            description: editingEvent.description,
            date: editingEvent.date,
            type: editingEvent.type === 'purchase' ? 'purchase'
              : editingEvent.type === 'renovation' ? 'renovation'
                : editingEvent.type === 'maintenance' ? 'renovation'
                  : editingEvent.type === 'improvement' ? 'renovation'
                    : 'memory',
          } : undefined}
        />
      )}
    </div>
  );
};
