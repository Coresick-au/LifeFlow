import React, { useState, useRef, useEffect } from 'react';
import { Search, Settings, ChevronDown, ArrowLeft, Plus, Wifi, WifiOff, Database } from 'lucide-react';
import { UserProfile } from '../types';
import { Logo } from './Logo';
import { ThemeSwitcher } from './ThemeSwitcher';
import { isOnline } from '../services/supabaseService';

type LucideIcon = React.ComponentType<{ className?: string; style?: React.CSSProperties; }>;

interface NavigationItem {
  type: string;
  pillar: string;
  icon: LucideIcon;
  label: string;
}

interface NavigationProps {
  items: NavigationItem[];
  activeView: string;
  activePillar: string;
  pillarDefaults: Record<string, string>;
  onViewChange: (type: string) => void;
  userProfile: UserProfile | null;
  onQuickAdd?: () => void;
  onSearch?: (query: string) => void;
  breadcrumbs?: { label: string; onClick?: () => void }[];
  showBackButton?: boolean;
  onBackClick?: () => void;
}

export const Navigation: React.FC<NavigationProps> = ({
  items,
  activeView,
  activePillar,
  pillarDefaults,
  onViewChange,
  userProfile,
  onQuickAdd,
  onSearch,
  breadcrumbs,
  showBackButton,
  onBackClick,
}) => {
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showMoreMenu, setShowMoreMenu] = useState(false);
  const [isDataSynced, setIsDataSynced] = useState(isOnline());
  const moreMenuRef = useRef<HTMLDivElement>(null);

  // Track online/offline status changes
  useEffect(() => {
    const updateOnlineStatus = () => {
      setIsDataSynced(isOnline());
    };

    window.addEventListener('online', updateOnlineStatus);
    window.addEventListener('offline', updateOnlineStatus);

    // Check periodically (every 5 seconds)
    const interval = setInterval(updateOnlineStatus, 5000);

    return () => {
      window.removeEventListener('online', updateOnlineStatus);
      window.removeEventListener('offline', updateOnlineStatus);
      clearInterval(interval);
    };
  }, []);

  // Close More menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (moreMenuRef.current && !moreMenuRef.current.contains(event.target as Node)) {
        setShowMoreMenu(false);
      }
    };

    if (showMoreMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showMoreMenu]);

  // Split navigation items into primary and secondary
  const primaryItems = items.slice(0, 4); // Show first 4 items
  const secondaryItems = items.slice(4); // Rest go in More menu

  // Icon color mapping for colorful icons
  const getIconColor = (type: string): string => {
    const colors: Record<string, string> = {
      // Flow pillar
      'timeline': 'text-blue-500',
      'calendar': 'text-indigo-500',
      'thoughts': 'text-yellow-500',
      'advice': 'text-amber-500',
      'todos': 'text-green-500',
      'on-this-day': 'text-purple-500',
      // Visualize pillar
      'life-dashboard': 'text-cyan-500',
      'bubble': 'text-teal-500',
      'event-heatmap': 'text-orange-500',
      'gantt-timeline': 'text-blue-600',
      'location-map': 'text-emerald-500',
      'wealth-tracker': 'text-green-600',
      // Me pillar
      'job-tracker': 'text-blue-500',
      'child-tracker': 'text-green-500',
      'home-tracker': 'text-amber-500',
      'relationship-tracker': 'text-pink-500',
      'relationships': 'text-violet-500',
      'likes-dislikes': 'text-rose-500',
      'experimental': 'text-red-500',
      'profile': 'text-sky-500',
      'settings': 'text-slate-500',
    };
    return colors[type] || 'text-theme-secondary';
  };

  // Background color mapping for active items (matching icon colors)
  const getActiveBgColor = (type: string): string => {
    const bgColors: Record<string, string> = {
      // Flow pillar
      'timeline': 'bg-blue-500',
      'calendar': 'bg-indigo-500',
      'thoughts': 'bg-yellow-500',
      'advice': 'bg-amber-500',
      'todos': 'bg-green-500',
      'on-this-day': 'bg-purple-500',
      // Visualize pillar
      'life-dashboard': 'bg-cyan-500',
      'bubble': 'bg-teal-500',
      'event-heatmap': 'bg-orange-500',
      'gantt-timeline': 'bg-blue-600',
      'location-map': 'bg-emerald-500',
      'wealth-tracker': 'bg-green-600',
      // Me pillar
      'job-tracker': 'bg-blue-500',
      'child-tracker': 'bg-green-500',
      'home-tracker': 'bg-amber-500',
      'relationship-tracker': 'bg-pink-500',
      'relationships': 'bg-violet-500',
      'likes-dislikes': 'bg-rose-500',
      'experimental': 'bg-red-500',
      'profile': 'bg-sky-500',
      'settings': 'bg-slate-500',
    };
    return bgColors[type] || 'bg-theme-accent';
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      // Trigger search with the query
      onViewChange('timeline'); // Navigate to timeline to show results
      // The actual search will be handled by App component
    }
    setShowSearch(false);
    setSearchQuery('');
  };

  const isDataLocal = !isDataSynced; // Local if NOT synced
  const lastBackupDate = localStorage.getItem('lifeflow-last-backup');
  const needsBackup = !lastBackupDate ||
    (Date.now() - new Date(lastBackupDate).getTime()) > 7 * 24 * 60 * 60 * 1000; // 7 days
  return (
    <nav className="shadow-sm border-b sticky top-0 z-50 bg-theme-primary border-theme">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-20">
          <div className="flex items-center space-x-8">
            <div className="flex items-center space-x-3">
              {/* Green + button for adding stories */}
              <button
                onClick={onQuickAdd}
                className="w-10 h-10 bg-green-500 hover:bg-green-600 text-white rounded-full shadow-md transition-all hover:scale-105 flex items-center justify-center"
                title="Add new story"
              >
                <Plus className="w-6 h-6" />
              </button>
              <button
                onClick={() => onViewChange('timeline')}
                className="text-2xl font-bold tracking-tight hover:opacity-80 transition-opacity cursor-pointer"
                style={{ color: 'var(--theme-accent)' }}
                title="Go to Timeline"
              >
                LifeFlow
              </button>
            </div>

            {/* Pillar Tabs */}
            <div className="hidden md:flex items-center border-l border-theme pl-4 ml-4">
              {(['flow', 'visualize', 'me'] as const).map((pillar) => (
                <button
                  key={pillar}
                  onClick={() => onViewChange(pillarDefaults[pillar])}
                  className={`px-4 py-1 text-sm font-bold capitalize transition-all border-b-2 ${activePillar === pillar
                    ? 'border-theme-accent text-theme-accent'
                    : 'border-transparent text-theme-secondary hover:text-theme-primary'
                    }`}
                >
                  {pillar}
                </button>
              ))}
            </div>

            {/* Sub-Navigation Pills (filtered by active pillar) - Two Row Layout */}
            <div className="hidden md:flex flex-col gap-1 ml-4">
              {(() => {
                const pillarItems = items.filter(item => item.pillar === activePillar);
                const topRowCount = Math.ceil(pillarItems.length / 2);
                const topRow = pillarItems.slice(0, topRowCount);
                const bottomRow = pillarItems.slice(topRowCount);

                return (
                  <>
                    <div className="flex items-center gap-1">
                      {topRow.map((item) => {
                        const Icon = item.icon;
                        const isActive = activeView === item.type;
                        const iconColor = getIconColor(item.type);
                        const activeBgColor = getActiveBgColor(item.type);

                        return (
                          <button
                            key={item.type}
                            onClick={() => onViewChange(item.type)}
                            className={`
                              flex items-center space-x-1.5 px-3 py-1.5 rounded-full text-sm font-medium
                              transition-colors duration-200 whitespace-nowrap
                              ${isActive
                                ? `${activeBgColor} text-black`
                                : 'text-theme-secondary hover:text-theme-primary hover:bg-theme-tertiary'
                              }
                            `}
                          >
                            <Icon className={`w-5 h-5 ${isActive ? 'text-black' : iconColor}`} />
                            <span>{item.label}</span>
                          </button>
                        );
                      })}
                    </div>
                    {bottomRow.length > 0 && (
                      <div className="flex items-center gap-1">
                        {bottomRow.map((item) => {
                          const Icon = item.icon;
                          const isActive = activeView === item.type;
                          const iconColor = getIconColor(item.type);
                          const activeBgColor = getActiveBgColor(item.type);

                          return (
                            <button
                              key={item.type}
                              onClick={() => onViewChange(item.type)}
                              className={`
                                flex items-center space-x-1.5 px-3 py-1.5 rounded-full text-sm font-medium
                                transition-colors duration-200 whitespace-nowrap
                                ${isActive
                                  ? `${activeBgColor} text-black`
                                  : 'text-theme-secondary hover:text-theme-primary hover:bg-theme-tertiary'
                                }
                              `}
                            >
                              <Icon className={`w-5 h-5 ${isActive ? 'text-black' : iconColor}`} />
                              <span>{item.label}</span>
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </>
                );
              })()}
            </div>
          </div>

          {/* Right Side Actions */}
          <div className="flex items-center space-x-3">
            {/* Search Bar */}
            {showSearch ? (
              <form onSubmit={handleSearch} className="flex items-center">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onBlur={() => setTimeout(() => setShowSearch(false), 200)}
                  placeholder="Search stories..."
                  className="px-3 py-1 border rounded-md text-sm focus:outline-none focus:ring-2 input-field rounded-theme"
                  autoFocus
                />
                <button
                  type="submit"
                  className="ml-2 px-3 py-1 text-white rounded-md text-sm btn-primary rounded-theme"
                >
                  Search
                </button>
              </form>
            ) : (
              <button
                onClick={() => setShowSearch(true)}
                className="p-2 text-theme-secondary hover:text-theme-primary hover:bg-theme-tertiary rounded-md transition-colors rounded-theme"
                title="Search stories"
              >
                <Search className="w-5 h-5" />
              </button>
            )}

            {/* Settings Button */}
            <button
              onClick={() => onViewChange('settings')}
              className={`p-2 rounded-md transition-colors rounded-theme ${activeView === 'settings'
                ? 'text-theme-accent bg-theme-tertiary'
                : 'text-theme-secondary hover:text-theme-primary hover:bg-theme-tertiary'
                }`}
              title="Settings"
            >
              <Settings className="w-5 h-5" />
            </button>

            {/* Data Sync Status */}
            <div className="relative group">
              <button
                className={`p-2 rounded-md transition-colors ${needsBackup
                  ? 'text-orange-600 hover:bg-orange-50'
                  : 'text-gray-400 hover:text-theme-tertiary hover:bg-theme-tertiary'
                  }`}
                title={isDataLocal ? 'Data saved locally' : 'Data synced'}
              >
                {isDataLocal ? <WifiOff className="w-5 h-5" /> : <Wifi className="w-5 h-5" />}
              </button>
              <div className="absolute right-0 top-full mt-2 w-48 p-2 bg-theme-primary border border-theme rounded-md shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                <p className="text-xs text-theme-tertiary">
                  {isDataLocal ? 'Data stored locally on this device' : 'Data synced to cloud'}
                </p>
                {needsBackup && (
                  <p className="text-xs text-orange-600 mt-1">
                    ⚠️ Backup recommended
                  </p>
                )}
                {lastBackupDate && (
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    Last backup: {new Date(lastBackupDate).toLocaleDateString()}
                  </p>
                )}
              </div>
            </div>

            {/* User Profile */}
            {userProfile && (
              <button
                onClick={() => onViewChange('profile')}
                className="flex items-center space-x-3 hover:bg-theme-tertiary rounded-lg px-2 py-1 transition-colors"
                title="View Profile"
              >
                <div className="text-right hidden sm:block">
                  <p className="text-sm font-medium text-theme-primary">{userProfile.name}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {new Date().getFullYear() - new Date(userProfile.birthDate).getFullYear()} years old
                  </p>
                </div>
                <div className="w-10 h-10 rounded-full bg-primary-500/200 flex items-center justify-center text-white font-semibold">
                  {userProfile.avatar ? (
                    <img
                      src={userProfile.avatar}
                      alt={userProfile.name}
                      className="w-full h-full rounded-full object-cover"
                    />
                  ) : (
                    userProfile.name.charAt(0).toUpperCase()
                  )}
                </div>
              </button>
            )}

            {/* Theme Switcher - moved to end */}
            <ThemeSwitcher />
          </div>
        </div>

        {/* Mobile navigation */}
        <div className="md:hidden flex items-center justify-between">
          <div className="flex overflow-x-auto space-x-1">
            {items.map((item) => {
              const Icon = item.icon;
              const isActive = activeView === item.type;

              return (
                <button
                  key={item.type}
                  onClick={() => onViewChange(item.type)}
                  className={`
                    flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium
                    whitespace-nowrap transition-colors duration-200 rounded-theme
                    ${isActive
                      ? 'bg-theme-accent text-white'
                      : 'text-theme-secondary hover:text-theme-primary hover:bg-theme-tertiary'
                    }
                  `}
                >
                  <Icon className="w-4 h-4" />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </div>

          {/* Mobile Quick Add */}
          {onQuickAdd && (
            <button
              onClick={onQuickAdd}
              className="ml-2 p-2 text-white rounded-md transition-colors btn-primary rounded-theme"
              title="Add new story"
            >
              <Plus className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </nav>
  );
};
