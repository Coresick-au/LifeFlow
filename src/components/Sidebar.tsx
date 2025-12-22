import React from 'react';
import { useTimelineStore } from '../store/timelineStore';
import {
    Home,
    Clock,
    Calendar,
    Briefcase,
    Heart,
    MapPin,
    Users,
    Brain,
    PiggyBank,
    Settings,
    BarChart3,
    Baby,
    Building2,
    ThumbsUp,
    BookOpen,
    X
} from 'lucide-react';
import { Logo } from './Logo';
import { ThemeSwitcher } from './ThemeSwitcher';

interface SidebarProps {
    isOpen: boolean;
    onClose: () => void;
    onViewChange: (type: string) => void;
    activeView: string;
}

const menuItems = [
    { type: 'life-dashboard', icon: Home, label: 'Dashboard' },
    { type: 'timeline', icon: Clock, label: 'Timeline' },
    { type: 'calendar', icon: Calendar, label: 'Calendar' },
    { type: 'gantt-timeline', icon: BarChart3, label: 'Gantt View' },
    { type: 'bubble', icon: Brain, label: 'Bubble View' },
    { type: 'job-tracker', icon: Briefcase, label: 'Career' },
    { type: 'wealth-tracker', icon: PiggyBank, label: 'Wealth' },
    { type: 'home-tracker', icon: Building2, label: 'Home' },
    { type: 'child-tracker', icon: Baby, label: 'Children' },
    { type: 'relationships', icon: Users, label: 'People' },
    { type: 'relationship-tracker', icon: Heart, label: 'Relationships' },
    { type: 'location-map', icon: MapPin, label: 'Locations' },
    { type: 'likes-dislikes', icon: ThumbsUp, label: 'Likes/Dislikes' },
    { type: 'thoughts', icon: Brain, label: 'Thoughts' },
    { type: 'advice', icon: BookOpen, label: 'Advice' },
    { type: 'settings', icon: Settings, label: 'Settings' },
];

export const Sidebar: React.FC<SidebarProps> = ({
    isOpen,
    onClose,
    onViewChange,
    activeView,
}) => {
    const { userProfile, setCurrentView } = useTimelineStore();

    const handleItemClick = (type: string) => {
        onViewChange(type);
        // On mobile, close the sidebar after selection
        if (window.innerWidth < 768) {
            onClose();
        }
    };

    return (
        <>
            {/* Overlay for mobile */}
            {isOpen && (
                <div
                    className="fixed inset-0 bg-black/50 z-40 md:hidden"
                    onClick={onClose}
                />
            )}

            {/* Sidebar */}
            <aside
                className={`
          fixed top-0 left-0 h-full z-50
          w-64 bg-theme-primary border-r border-theme
          transform transition-transform duration-300 ease-in-out
          ${isOpen ? 'translate-x-0' : '-translate-x-full'}
          md:translate-x-0 md:static md:z-auto
        `}
            >
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-theme">
                    <div className="flex items-center space-x-3">
                        <Logo className="w-8 h-8" />
                        <h1 className="text-xl font-bold" style={{ color: 'var(--theme-accent)' }}>
                            LifeFlow
                        </h1>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-theme-tertiary rounded-md md:hidden"
                    >
                        <X className="w-5 h-5 text-theme-secondary" />
                    </button>
                </div>

                {/* User Profile */}
                {userProfile && (
                    <button
                        onClick={() => handleItemClick('profile')}
                        className="w-full p-4 border-b border-theme hover:bg-theme-tertiary transition-colors text-left"
                    >
                        <div className="flex items-center space-x-3">
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
                            <div>
                                <p className="font-medium text-theme-primary">{userProfile.name}</p>
                                <p className="text-xs text-theme-tertiary">
                                    {new Date().getFullYear() - new Date(userProfile.birthDate).getFullYear()} years old
                                </p>
                            </div>
                        </div>
                    </button>
                )}

                {/* Navigation Items */}
                <nav className="flex-1 overflow-y-auto p-2">
                    <ul className="space-y-1">
                        {menuItems.map((item) => {
                            const Icon = item.icon;
                            const isActive = activeView === item.type;

                            return (
                                <li key={item.type}>
                                    <button
                                        onClick={() => handleItemClick(item.type)}
                                        className={`
                      w-full flex items-center space-x-3 px-3 py-2.5 rounded-lg
                      transition-colors duration-200
                      ${isActive
                                                ? 'bg-theme-accent text-white'
                                                : 'text-theme-secondary hover:text-theme-primary hover:bg-theme-tertiary'
                                            }
                    `}
                                    >
                                        <Icon className="w-5 h-5" />
                                        <span className="font-medium">{item.label}</span>
                                    </button>
                                </li>
                            );
                        })}
                    </ul>
                </nav>

                {/* Footer */}
                <div className="p-4 border-t border-theme">
                    <div className="flex items-center justify-between">
                        <span className="text-xs text-theme-tertiary">Theme</span>
                        <ThemeSwitcher />
                    </div>
                </div>
            </aside>
        </>
    );
};
