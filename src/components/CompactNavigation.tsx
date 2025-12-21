import React, { useState, useRef, useEffect } from 'react';
import { LucideIcon, Database, ChevronDown, X } from 'lucide-react';
import { UserProfile } from '../types';

interface NavigationItem {
  type: string;
  icon: LucideIcon;
  label: string;
}

interface CompactNavigationProps {
  items: NavigationItem[];
  activeView: string;
  onViewChange: (type: string) => void;
  userProfile: UserProfile | null;
  onSampleData?: () => void;
}

export const CompactNavigation: React.FC<CompactNavigationProps> = ({
  items,
  activeView,
  onViewChange,
  userProfile,
  onSampleData,
}) => {
  const [showMore, setShowMore] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Primary navigation items - always visible
  const primaryItems = [
    { type: 'timeline', icon: items.find(i => i.type === 'timeline')?.icon, label: 'Timeline' },
    { type: 'calendar', icon: items.find(i => i.type === 'calendar')?.icon, label: 'Calendar' },
    { type: 'add-story', icon: items.find(i => i.type === 'add-story')?.icon, label: 'Add Story' },
    { type: 'profile', icon: items.find(i => i.type === 'profile')?.icon, label: 'Profile' },
    { type: 'settings', icon: items.find(i => i.type === 'settings')?.icon, label: 'Settings' },
  ].filter(item => item.icon);

  // Secondary navigation items - in dropdown
  const secondaryItems = items.filter(item => 
    !primaryItems.some(primary => primary.type === item.type)
  );

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowMore(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <nav className="bg-theme-primary shadow-sm border-b border-theme sticky top-0 z-50">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center space-x-8">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-primary-600 rounded-full flex items-center justify-center">
                <span className="text-white font-bold text-sm">LF</span>
              </div>
              <h1 className="text-2xl font-bold text-primary-600">LifeFlow</h1>
            </div>
            
            <div className="hidden md:flex items-center space-x-1">
              {primaryItems.map((item) => {
                const Icon = item.icon!;
                const isActive = activeView === item.type;
                
                return (
                  <button
                    key={item.type}
                    onClick={() => onViewChange(item.type)}
                    className={`
                      flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium
                      transition-colors duration-200
                      ${isActive
                        ? 'bg-primary-100 text-primary-700'
                        : 'text-theme-tertiary hover:text-theme-primary hover:bg-theme-tertiary'
                      }
                    `}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{item.label}</span>
                  </button>
                );
              })}
              
              {/* More dropdown */}
              {secondaryItems.length > 0 && (
                <div className="relative" ref={dropdownRef}>
                  <button
                    onClick={() => setShowMore(!showMore)}
                    className={`
                      flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium
                      transition-colors duration-200
                      ${showMore
                        ? 'bg-theme-tertiary text-theme-primary'
                        : 'text-theme-tertiary hover:text-theme-primary hover:bg-theme-tertiary'
                      }
                    `}
                  >
                    <span>More</span>
                    <ChevronDown className={`w-4 h-4 transition-transform ${showMore ? 'rotate-180' : ''}`} />
                  </button>
                  
                  {showMore && (
                    <div className="absolute top-full left-0 mt-1 w-48 bg-theme-primary rounded-md shadow-lg border border-theme py-1">
                      {secondaryItems.map((item) => {
                        const Icon = item.icon;
                        const isActive = activeView === item.type;
                        
                        return (
                          <button
                            key={item.type}
                            onClick={() => {
                              onViewChange(item.type);
                              setShowMore(false);
                            }}
                            className={`
                              w-full flex items-center space-x-2 px-3 py-2 text-sm font-medium
                              transition-colors duration-200
                              ${isActive
                                ? 'bg-primary-100 text-primary-700'
                                : 'text-theme-tertiary hover:text-theme-primary hover:bg-theme-tertiary'
                              }
                            `}
                          >
                            <Icon className="w-4 h-4" />
                            <span>{item.label}</span>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
              
              {/* Sample Data Button - always visible when on profile */}
              {activeView === 'profile' && onSampleData && (
                <button
                  onClick={onSampleData}
                  className="flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium text-green-600 hover:text-green-700 hover:bg-green-50 transition-colors duration-200 ml-4"
                  title="Load sample data"
                >
                  <Database className="w-4 h-4" />
                  <span>Sample Data</span>
                </button>
              )}
            </div>
          </div>
          
          {/* User Menu */}
          {userProfile && (
            <div className="flex items-center space-x-4">
              <span className="text-sm text-theme-tertiary hidden md:block">Welcome, {userProfile.name}</span>
              <div className="w-10 h-10 rounded-full bg-primary-500 flex items-center justify-center text-white font-semibold">
                {userProfile.name.charAt(0).toUpperCase()}
              </div>
            </div>
          )}
        </div>
        
        {/* Mobile navigation */}
        <div className="md:hidden">
          <div className="flex overflow-x-auto space-x-1 pb-2 -mx-4 px-4">
            {primaryItems.map((item) => {
              const Icon = item.icon!;
              const isActive = activeView === item.type;
              
              return (
                <button
                  key={item.type}
                  onClick={() => onViewChange(item.type)}
                  className={`
                    flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium
                    whitespace-nowrap transition-colors duration-200
                    ${isActive
                      ? 'bg-primary-100 text-primary-700'
                      : 'text-theme-tertiary hover:text-theme-primary hover:bg-theme-tertiary'
                    }
                  `}
                >
                  <Icon className="w-4 h-4" />
                  <span>{item.label}</span>
                </button>
              );
            })}
            
            {/* Mobile Sample Data Button */}
            {activeView === 'profile' && onSampleData && (
              <button
                onClick={onSampleData}
                className="flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium text-green-600 hover:text-green-700 hover:bg-green-50 transition-colors duration-200 whitespace-nowrap"
              >
                <Database className="w-4 h-4" />
                <span>Sample Data</span>
              </button>
            )}
          </div>
          
          {/* Mobile More Options */}
          {secondaryItems.length > 0 && (
            <div className="mt-2 flex overflow-x-auto space-x-1 -mx-4 px-4">
              {secondaryItems.map((item) => {
                const Icon = item.icon;
                const isActive = activeView === item.type;
                
                return (
                  <button
                    key={item.type}
                    onClick={() => onViewChange(item.type)}
                    className={`
                      flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium
                      whitespace-nowrap transition-colors duration-200
                      ${isActive
                        ? 'bg-primary-100 text-primary-700'
                        : 'text-theme-tertiary hover:text-theme-primary hover:bg-theme-tertiary'
                      }
                    `}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </nav>
  );
};
