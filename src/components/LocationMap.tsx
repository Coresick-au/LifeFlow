import React, { useMemo, useState } from 'react';
import { format, differenceInDays } from 'date-fns';
import { useTimelineStore } from '../store/timelineStore';
import { Story } from '../types';
import { MapPin, Calendar, Users, TrendingUp, Globe, Heart, Search, X, Tag } from 'lucide-react';

interface LocationData {
  name: string;
  stories: Story[];
  firstVisit: Date;
  lastVisit: Date;
  totalDays: number;
  uniquePeople: string[];
}

interface LocationStats {
  totalLocations: number;
  countries: number;
  cities: number;
  mostVisited: { location: string; count: number };
  longestStay: { location: string; days: number };
}

export const LocationMap: React.FC = () => {
  const { stories } = useTimelineStore();
  const [selectedLocation, setSelectedLocation] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'tag' | 'person'>('all');
  const [filterValue, setFilterValue] = useState('');
  const [viewMode, setViewMode] = useState<'list' | 'statistics'>('list');
  const [showTravelPath, setShowTravelPath] = useState(false);

  // Group stories by location
  const locations = useMemo(() => {
    const locationMap: Record<string, LocationData> = {};
    
    stories.forEach(story => {
      if (!story.location) return;
      
      const locationKey = story.location;
      
      if (!locationMap[locationKey]) {
        locationMap[locationKey] = {
          name: story.location,
          stories: [],
          firstVisit: new Date(story.date),
          lastVisit: new Date(story.date),
          totalDays: 0,
          uniquePeople: [],
        };
      }
      
      locationMap[locationKey].stories.push(story);
      
      // Update visit dates
      const storyDate = new Date(story.date);
      if (storyDate < locationMap[locationKey].firstVisit) {
        locationMap[locationKey].firstVisit = storyDate;
      }
      if (storyDate > locationMap[locationKey].lastVisit) {
        locationMap[locationKey].lastVisit = storyDate;
      }
      
      // Add people to unique list
      story.people.forEach(person => {
        if (!locationMap[locationKey].uniquePeople.includes(person)) {
          locationMap[locationKey].uniquePeople.push(person);
        }
      });
    });
    
    // Calculate total days for each location
    Object.values(locationMap).forEach(location => {
      if (location.stories.length > 1) {
        const sortedDates = location.stories
          .map(s => new Date(s.date))
          .sort((a, b) => a.getTime() - b.getTime());
        
        let totalDays = 0;
        for (let i = 0; i < sortedDates.length - 1; i++) {
          totalDays += differenceInDays(sortedDates[i + 1], sortedDates[i]) || 1;
        }
        location.totalDays = totalDays;
      } else {
        location.totalDays = 1;
      }
    });
    
    return Object.values(locationMap).sort((a, b) => 
      b.lastVisit.getTime() - a.lastVisit.getTime()
    );
  }, [stories]);

  // Filter locations based on search and filters
  const filteredLocations = useMemo(() => {
    let filtered = locations;
    
    // Search by location name
    if (searchQuery) {
      filtered = filtered.filter(location => 
        location.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    
    // Filter by tag
    if (filterType === 'tag' && filterValue) {
      filtered = filtered.filter(location => 
        location.stories.some(story => story.tags.includes(filterValue))
      );
    }
    
    // Filter by person
    if (filterType === 'person' && filterValue) {
      filtered = filtered.filter(location => 
        location.uniquePeople.includes(filterValue)
      );
    }
    
    return filtered;
  }, [locations, searchQuery, filterType, filterValue]);
  
  // Get all unique tags and people for filters
  const allTags = useMemo(() => {
    const tagSet = new Set<string>();
    stories.forEach(story => {
      story.tags.forEach(tag => tagSet.add(tag));
    });
    return Array.from(tagSet).sort();
  }, [stories]);
  
  const allPeople = useMemo(() => {
    const personSet = new Set<string>();
    stories.forEach(story => {
      story.people.forEach(person => personSet.add(person));
    });
    return Array.from(personSet).sort();
  }, [stories]);

  // Calculate statistics
  const stats = useMemo((): LocationStats => {
    const uniqueCountries = new Set<string>();
    const uniqueCities = new Set<string>();
    
    locations.forEach(location => {
      const parts = location.name.split(',').map((p: string) => p.trim());
      if (parts.length >= 2) {
        uniqueCities.add(parts[0] || '');
        uniqueCountries.add(parts[parts.length - 1] || '');
      } else {
        uniqueCities.add(parts[0] || '');
      }
    });
    
    const mostVisited = locations.reduce((most, location) => {
      if (location.stories.length > most.count) {
        return { location: location.name, count: location.stories.length };
      }
      return most;
    }, { location: '', count: 0 });
    
    const longestStay = locations.reduce((longest, location) => {
      if (location.totalDays > longest.days) {
        return { location: location.name, days: location.totalDays };
      }
      return longest;
    }, { location: '', days: 0 });
    
    return {
      totalLocations: locations.length,
      countries: uniqueCountries.size,
      cities: uniqueCities.size,
      mostVisited,
      longestStay,
    };
  }, [locations]);

  const selectedLocationData = selectedLocation 
    ? locations.find(l => l.name === selectedLocation)
    : null;

  return (
    <div className="bg-theme-primary rounded-lg shadow-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-theme-primary">Location Map</h2>
        
        <div className="flex items-center gap-2">
          <button
            onClick={() => setViewMode('list')}
            className={`px-4 py-2 rounded-md transition-colors ${
              viewMode === 'list' 
                ? 'bg-primary-600 text-white' 
                : 'bg-theme-tertiary text-theme-secondary hover:opacity-80'
            }`}
          >
            List View
          </button>
          <button
            onClick={() => setViewMode('statistics')}
            className={`px-4 py-2 rounded-md transition-colors ${
              viewMode === 'statistics' 
                ? 'bg-primary-600 text-white' 
                : 'bg-theme-tertiary text-theme-secondary hover:opacity-80'
            }`}
          >
            Statistics
          </button>
          <button
            onClick={() => setShowTravelPath(!showTravelPath)}
            className={`px-4 py-2 rounded-md transition-colors ${
              showTravelPath 
                ? 'bg-green-600 text-white' 
                : 'bg-theme-tertiary text-theme-secondary hover:opacity-80'
            }`}
          >
            {showTravelPath ? 'Hide Path' : 'Show Path'}
          </button>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="mb-6 space-y-4">
        {/* Search Bar */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search locations..."
            className="w-full pl-10 pr-4 py-2 border border-theme rounded-lg bg-theme-primary text-theme-primary focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-theme-tertiary"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>
        
        {/* Filter Options */}
        <div className="flex gap-4">
          <select
            value={filterType}
            onChange={(e) => {
              setFilterType(e.target.value as 'all' | 'tag' | 'person');
              setFilterValue('');
            }}
            className="px-3 py-2 border border-theme rounded-lg bg-theme-primary text-theme-primary focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            <option value="all">All Locations</option>
            <option value="tag">Filter by Tag</option>
            <option value="person">Filter by Person</option>
          </select>
          
          {filterType === 'tag' && (
            <select
              value={filterValue}
              onChange={(e) => setFilterValue(e.target.value)}
              className="px-3 py-2 border border-theme rounded-lg bg-theme-primary text-theme-primary focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="">Select a tag...</option>
              {allTags.map(tag => (
                <option key={tag} value={tag}>#{tag}</option>
              ))}
            </select>
          )}
          
          {filterType === 'person' && (
            <select
              value={filterValue}
              onChange={(e) => setFilterValue(e.target.value)}
              className="px-3 py-2 border border-theme rounded-lg bg-theme-primary text-theme-primary focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="">Select a person...</option>
              {allPeople.map(person => (
                <option key={person} value={person}>{person}</option>
              ))}
            </select>
          )}
        </div>
        
        {(searchQuery || filterValue) && (
          <div className="text-sm text-theme-tertiary">
            Showing {filteredLocations.length} of {locations.length} locations
          </div>
        )}
      </div>

      {viewMode === 'statistics' ? (
        <div className="space-y-6">
          {/* Statistics Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-theme-tertiary rounded-lg">
              <Globe className="w-8 h-8 text-primary-600 mx-auto mb-2" />
              <div className="text-2xl font-bold text-theme-primary">{stats.totalLocations}</div>
              <div className="text-sm text-theme-tertiary">Total Locations</div>
            </div>
            <div className="text-center p-4 bg-theme-tertiary rounded-lg">
              <div className="text-2xl font-bold text-theme-primary">{stats.countries}</div>
              <div className="text-sm text-theme-tertiary">Countries</div>
            </div>
            <div className="text-center p-4 bg-theme-tertiary rounded-lg">
              <div className="text-2xl font-bold text-theme-primary">{stats.cities}</div>
              <div className="text-sm text-theme-tertiary">Cities</div>
            </div>
            <div className="text-center p-4 bg-theme-tertiary rounded-lg">
              <TrendingUp className="w-8 h-8 text-primary-600 mx-auto mb-2" />
              <div className="text-2xl font-bold text-theme-primary">
                {Math.round(locations.reduce((sum, l) => sum + l.totalDays, 0) / 365)}
              </div>
              <div className="text-sm text-theme-tertiary">Years Tracked</div>
            </div>
          </div>

          {/* Top Locations */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-theme-tertiary rounded-lg p-4">
              <h3 className="font-semibold text-theme-primary mb-3">Most Visited</h3>
              <div className="space-y-2">
                {locations
                  .sort((a, b) => b.stories.length - a.stories.length)
                  .slice(0, 5)
                  .map((location, index) => (
                    <div key={location.name} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-slate-500 dark:text-slate-400">#{index + 1}</span>
                        <span className="text-sm font-medium">{location.name}</span>
                      </div>
                      <span className="text-sm text-theme-tertiary">{location.stories.length} stories</span>
                    </div>
                  ))}
              </div>
            </div>

            <div className="bg-theme-tertiary rounded-lg p-4">
              <h3 className="font-semibold text-theme-primary mb-3">Longest Stays</h3>
              <div className="space-y-2">
                {locations
                  .sort((a, b) => b.totalDays - a.totalDays)
                  .slice(0, 5)
                  .map((location, index) => (
                    <div key={location.name} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-slate-500 dark:text-slate-400">#{index + 1}</span>
                        <span className="text-sm font-medium">{location.name}</span>
                      </div>
                      <span className="text-sm text-theme-tertiary">{location.totalDays} days</span>
                    </div>
                  ))}
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Locations List */}
          <div>
            <h3 className="text-lg font-semibold text-theme-primary mb-4">All Locations</h3>
            <div className="space-y-2">
              {locations.map(location => (
                <div
                  key={location.name}
                  onClick={() => setSelectedLocation(location.name)}
                  className={`p-3 rounded-lg border cursor-pointer transition-all ${
                    selectedLocation === location.name
                      ? 'border-primary-500 bg-primary-500/20'
                      : 'border-theme hover:border-theme hover:bg-theme-tertiary'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-primary-500/30 rounded-full flex items-center justify-center">
                        <MapPin className="w-5 h-5 text-primary-600" />
                      </div>
                      <div>
                        <div className="font-medium text-theme-primary">{location.name}</div>
                        <div className="text-sm text-slate-500 dark:text-slate-400">
                          {location.stories.length} stories • {location.uniquePeople.length} people
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-xs text-slate-500 dark:text-slate-400">Last visited</div>
                      <div className="text-sm text-theme-secondary">
                        {format(location.lastVisit, 'MMM yyyy')}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Location Details */}
          <div>
            {selectedLocationData ? (
              <>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-theme-primary">
                    {selectedLocationData.name}
                  </h3>
                  <button
                    onClick={() => setSelectedLocation(null)}
                    className="text-gray-400 hover:text-theme-tertiary"
                  >
                    ×
                  </button>
                </div>

                <div className="space-y-4">
                  {/* Location Summary */}
                  <div className="p-4 bg-theme-tertiary rounded-lg">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-slate-500 dark:text-slate-400">First visit:</span>
                        <div className="font-medium">
                          {format(selectedLocationData.firstVisit, 'MMM d, yyyy')}
                        </div>
                      </div>
                      <div>
                        <span className="text-slate-500 dark:text-slate-400">Last visit:</span>
                        <div className="font-medium">
                          {format(selectedLocationData.lastVisit, 'MMM d, yyyy')}
                        </div>
                      </div>
                      <div>
                        <span className="text-slate-500 dark:text-slate-400">Duration:</span>
                        <div className="font-medium">
                          {selectedLocationData.totalDays} days
                        </div>
                      </div>
                      <div>
                        <span className="text-slate-500 dark:text-slate-400">Stories:</span>
                        <div className="font-medium">
                          {selectedLocationData.stories.length}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* People at this location */}
                  {selectedLocationData.uniquePeople.length > 0 && (
                    <div>
                      <h4 className="font-medium text-theme-primary mb-2">People</h4>
                      <div className="flex flex-wrap gap-2">
                        {selectedLocationData.uniquePeople.map(person => (
                          <span
                            key={person}
                            className="flex items-center gap-1 px-3 py-1 bg-theme-tertiary text-theme-secondary rounded-full text-sm"
                          >
                            <Users className="w-3 h-3" />
                            {person}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Recent Stories */}
                  <div>
                    <h4 className="font-medium text-theme-primary mb-2">Recent Stories</h4>
                    <div className="space-y-2">
                      {selectedLocationData.stories.slice(0, 5).map(story => (
                        <div key={story.id} className="p-3 border border-theme rounded-lg">
                          <div className="font-medium text-theme-primary">{story.title}</div>
                          <div className="flex items-center gap-3 mt-1 text-xs text-slate-500 dark:text-slate-400">
                            <span className="flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              {format(new Date(story.date), 'MMM d, yyyy')}
                            </span>
                            {story.mood && (
                              <span className="flex items-center gap-1">
                                <Heart className="w-3 h-3" />
                                {story.mood}
                              </span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <div className="text-center py-12 text-slate-500 dark:text-slate-400">
                <MapPin className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                <p>Select a location to view details</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Empty State */}
      {locations.length === 0 && (
        <div className="text-center py-12">
          <MapPin className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-theme-primary mb-2">
            No locations yet
          </h3>
          <p className="text-slate-500 dark:text-slate-400">
            Add locations to your stories to see them here
          </p>
        </div>
      )}

      {/* Travel Path Visualization */}
      {showTravelPath && locations.length > 0 && (
        <div className="mt-6 p-6 bg-gradient-to-r from-blue-900/20 to-green-900/20 rounded-lg border border-blue-800/30">
          <h3 className="text-lg font-semibold text-theme-primary mb-4">Travel Path</h3>
          <div className="relative">
            <div className="flex items-center overflow-x-auto pb-4">
              {/* Draw path lines */}
              <svg className="absolute top-8 left-0 right-0 h-1 pointer-events-none">
                {locations.slice(0, -1).map((_, index) => (
                  <line
                    key={index}
                    x1={`${(index / (locations.length - 1)) * 100}%`}
                    y1="50%"
                    x2={`${((index + 1) / (locations.length - 1)) * 100}%`}
                    y2="50%"
                    stroke="#10b981"
                    strokeWidth="2"
                    strokeDasharray="5,5"
                  />
                ))}
              </svg>
              
              {/* Location nodes */}
              <div className="flex relative z-10">
                {locations.map((location, index) => (
                  <div key={location.name} className="flex flex-col items-center min-w-[100px]">
                    <div className="w-16 h-16 bg-theme-primary rounded-full shadow-md flex items-center justify-center border-4 border-green-500">
                      <MapPin className="w-6 h-6 text-green-600" />
                    </div>
                    <div className="mt-2 text-center">
                      <div className="text-sm font-medium text-theme-primary">{location.name}</div>
                      <div className="text-xs text-slate-500 dark:text-slate-400">
                        {format(location.firstVisit, 'MMM yyyy')}
                      </div>
                      <div className="text-xs text-gray-400">
                        {location.stories.length} stories
                      </div>
                    </div>
                    {index < locations.length - 1 && (
                      <div className="hidden sm:block absolute top-8 left-20 text-xs text-slate-500 dark:text-slate-400 whitespace-nowrap">
                        → {Math.round(differenceInDays(
                          locations[index + 1].firstVisit,
                          location.firstVisit
                        ) / 30)} months
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
            
            <div className="mt-6 pt-4 border-t border-theme">
              <div className="flex items-center justify-between text-sm">
                <div className="text-theme-tertiary">
                  Journey spans <span className="font-medium">
                    {Math.round(differenceInDays(
                      locations[locations.length - 1]?.firstVisit || new Date(),
                      locations[0]?.firstVisit || new Date()
                    ) / 30)} months
                  </span> across <span className="font-medium">{locations.length}</span> locations
                </div>
                <div className="text-theme-tertiary">
                  Total stories: <span className="font-medium">
                    {locations.reduce((sum, loc) => sum + loc.stories.length, 0)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
