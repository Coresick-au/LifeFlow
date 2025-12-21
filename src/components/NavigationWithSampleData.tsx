import React from 'react';
import { LucideIcon, Database } from 'lucide-react';
import { UserProfile } from '../types';

interface NavigationItem {
  type: string;
  icon: LucideIcon;
  label: string;
}

interface NavigationWithSampleDataProps {
  items: NavigationItem[];
  activeView: string;
  onViewChange: (type: string) => void;
  userProfile: UserProfile | null;
  onSampleData?: () => void;
}

export const NavigationWithSampleData: React.FC<NavigationWithSampleDataProps> = ({
  items,
  activeView,
  onViewChange,
  userProfile,
  onSampleData,
}) => {
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
            
            <div className="hidden md:flex space-x-1">
              {items.map((item) => {
                const Icon = item.icon;
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
              
              {/* Sample Data Button - positioned after Profile */}
              {activeView === 'profile' && onSampleData && (
                <button
                  onClick={onSampleData}
                  className="flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium text-green-600 hover:text-green-700 hover:bg-green-50 transition-colors duration-200"
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
              <span className="text-sm text-theme-tertiary">Welcome, {userProfile.name}</span>
              <div className="w-10 h-10 rounded-full bg-primary-500 flex items-center justify-center text-white font-semibold">
                {userProfile.name.charAt(0).toUpperCase()}
              </div>
            </div>
          )}
        </div>
        
        {/* Mobile navigation */}
        <div className="md:hidden flex overflow-x-auto space-x-1 pb-2 -mx-4 px-4">
          {items.map((item) => {
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
      </div>
    </nav>
  );
};
