import React, { useState } from 'react';
import { Search, Settings, Calendar, MapPin, Users, Heart, BarChart3, Brain, ChevronDown, ArrowLeft, Cloud, Clock, Plus, Wifi, WifiOff, Database } from 'lucide-react';
import { UserProfile } from '../types';
import { Logo } from './Logo';
import { ThemeSwitcher } from './ThemeSwitcher';

type LucideIcon = React.ComponentType<{ className?: string; style?: React.CSSProperties; }>;

interface NavigationItem {
  type: string;
  icon: LucideIcon;
  label: string;
}

interface NavigationProps {
  items: NavigationItem[];
  activeView: string;
  onViewChange: (type: string) => void;
  userProfile: UserProfile | null;
  onQuickAdd?: () => void;
  onSearch?: (query: string) => void;
  onSampleData?: () => void;
  breadcrumbs?: { label: string; onClick?: () => void }[];
  showBackButton?: boolean;
  onBackClick?: () => void;
}

export const Navigation: React.FC<NavigationProps> = ({
  items,
  activeView,
  onViewChange,
  userProfile,
  onQuickAdd,
  onSearch,
  onSampleData,
  breadcrumbs,
  showBackButton,
  onBackClick,
}) => {
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showMoreMenu, setShowMoreMenu] = useState(false);

  // Split navigation items into primary and secondary
  const primaryItems = items.slice(0, 4); // Show first 4 items
  const secondaryItems = items.slice(4); // Rest go in More menu

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

  const isDataLocal = true; // Since we're using IndexedDB
  const lastBackupDate = localStorage.getItem('lifeflow-last-backup');
  const needsBackup = !lastBackupDate || 
    (Date.now() - new Date(lastBackupDate).getTime()) > 7 * 24 * 60 * 60 * 1000; // 7 days
  return (
    <nav className="shadow-sm border-b sticky top-0 z-50 bg-theme-primary border-theme">
      <div className="container mx-auto px-4">
        {/* Breadcrumbs */}
        {breadcrumbs && breadcrumbs.length > 0 && (
          <div className="flex items-center space-x-2 py-2 border-b border-theme">
            {showBackButton && (
              <button
                onClick={onBackClick}
                className="p-1 hover:bg-theme-tertiary rounded-md transition-colors rounded-theme"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
            )}
            {breadcrumbs.map((crumb, index) => (
              <React.Fragment key={index}>
                {index > 0 && <span className="text-theme-tertiary">/</span>}
                <button
                  onClick={crumb.onClick || (() => onViewChange('timeline'))}
                  className="text-sm text-theme-secondary hover:text-theme-primary transition-colors"
                >
                  {crumb.label}
                </button>
              </React.Fragment>
            ))}
          </div>
        )}
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center space-x-8">
            <div className="flex items-center space-x-3">
              <Logo className="w-9 h-9" />
              <h1 className="text-2xl font-bold tracking-tight" style={{ color: 'var(--theme-accent)' }}>
                LifeFlow
              </h1>
            </div>
            
            {/* Navigation Items */}
            <div className="hidden md:flex space-x-1">
              {primaryItems.map((item) => {
                const Icon = item.icon;
                const isActive = activeView === item.type;
                
                return (
                  <button
                    key={item.type}
                    onClick={() => onViewChange(item.type)}
                    className={`
                      flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium
                      transition-colors duration-200 rounded-theme
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
              
              {/* More dropdown for secondary items */}
              {secondaryItems.length > 0 && (
                <div className="relative">
                  <button
                    onClick={() => setShowMoreMenu(!showMoreMenu)}
                    className="flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium text-theme-secondary hover:text-theme-primary hover:bg-theme-tertiary transition-colors rounded-theme"
                  >
                    <span>More</span>
                    <ChevronDown className="w-4 h-4" />
                  </button>
                  
                  {showMoreMenu && (
                    <div className="absolute top-full left-0 mt-1 border rounded-md shadow-lg py-1 z-50 bg-theme-primary border-theme shadow-theme">
                      {secondaryItems.map((item) => {
                        const Icon = item.icon;
                        const isActive = activeView === item.type;
                        
                        return (
                          <button
                            key={item.type}
                            onClick={() => {
                              onViewChange(item.type);
                              setShowMoreMenu(false);
                            }}
                            className={`
                              flex items-center space-x-2 px-4 py-2 text-sm font-medium w-full text-left
                              transition-colors duration-200
                              ${isActive
                                ? 'bg-theme-secondary'
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
                  )}
                </div>
              )}
            </div>
          </div>
          
          {/* Right Side Actions */}
          <div className="flex items-center space-x-3">
            {/* Theme Switcher */}
            <ThemeSwitcher />
            
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
            
            {/* Quick Add Button */}
            {onQuickAdd && (
              <button
                onClick={onQuickAdd}
                className="p-2 text-theme-secondary hover:text-theme-primary hover:bg-theme-tertiary rounded-md transition-colors rounded-theme"
                title="Add new story"
              >
                <Plus className="w-5 h-5" />
              </button>
            )}
            
            {/* Settings Button */}
            <button
              onClick={() => onViewChange('settings')}
              className={`p-2 rounded-md transition-colors rounded-theme ${
                activeView === 'settings'
                  ? 'text-theme-accent bg-theme-tertiary'
                  : 'text-theme-secondary hover:text-theme-primary hover:bg-theme-tertiary'
              }`}
              title="Settings"
            >
              <Settings className="w-5 h-5" />
            </button>
            
            {/* Sample Data Button - only show on profile view */}
            {activeView === 'profile' && onSampleData && (
              <button
                onClick={onSampleData}
                className="flex items-center space-x-2 px-3 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
                title="Load sample data"
              >
                <Database className="w-4 h-4" />
                <span className="hidden sm:inline">Sample Data</span>
              </button>
            )}
            
            {/* Data Sync Status */}
            <div className="flex items-center space-x-2">
              <div className="relative group">
                <button
                  className={`p-2 rounded-md transition-colors ${
                    needsBackup 
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
            </div>
            
            {/* User Profile */}
            {userProfile && (
              <div className="flex items-center space-x-3">
                <div className="text-right hidden sm:block">
                  <p className="text-sm font-medium text-theme-primary">{userProfile.name}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {new Date().getFullYear() - new Date(userProfile.birthDate).getFullYear()} years old
                  </p>
                </div>
                <div className="w-10 h-10 rounded-full bg-primary-500 flex items-center justify-center text-white font-semibold">
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
              </div>
            )}
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
