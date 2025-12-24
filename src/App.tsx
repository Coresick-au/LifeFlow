import React, { useState, useEffect } from 'react';
import { Toaster } from 'react-hot-toast';
import { ErrorBoundary } from './components/ErrorBoundary';
import { Navigation } from './components/Navigation';
import { Timeline } from './components/Timeline';
import { CalendarView } from './components/CalendarView';
import { EventHeatmap } from './components/EventHeatmap';
import { GanttTimeline } from './components/GanttTimeline';
import { OnThisDay } from './components/OnThisDay';
import { Relationships } from './components/Relationships';
import { LocationMap } from './components/LocationMap';
import { LikesDislikes } from './components/LikesDislikes';
import { UserProfile } from './components/UserProfile';
import { Settings } from './components/Settings';
import { LifeDashboard } from './components/LifeDashboard';
import { JobTracker } from './components/JobTracker';
import { ChildTracker } from './components/ChildTracker';
import { HomeTracker } from './components/HomeTracker';
import { RelationshipTracker } from './components/RelationshipTracker';
import { StoryForm } from './components/StoryForm';
import { Thoughts } from './components/Thoughts';
import { TodoList } from './components/TodoList';
import { BubbleTimeline } from './components/BubbleTimeline';
import { AIInsights } from './components/AIInsights';
import { WealthTracker } from './components/WealthTracker';
import { ExperimentalComparison } from './components/ExperimentalComparison';
import { AdvicePanel } from './components/Advice';
import { AuthPage } from './components/AuthPage';
import { useAuth } from './contexts/AuthContext';
import { useTimelineStore } from './store/timelineStore';
import { useThemeStore } from './store/themeStore';
import { Story } from './types';
import {
  Calendar as CalendarIcon,
  MapPin,
  Users,
  Heart,
  BarChart3,
  Brain,
  Settings as SettingsIcon,
  TrendingUp,
  Smile,
  Lightbulb,
  CheckSquare,
  PiggyBank,
  AlertTriangle,
  Home,
  BookOpen,
  Circle
} from 'lucide-react';
import type { TimelineView } from './types';

export const App: React.FC = () => {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const { stories, userProfile, currentView, setCurrentView, loadStories, loadThoughts, loadTodos, loadUserProfile, loadRelationships, loadPreferences, loadAdvice, loadManagedTags, loadWealthItems, loadWealthHistory } = useTimelineStore();
  const { theme } = useThemeStore();
  const [searchResults, setSearchResults] = useState<Story[] | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Initialize theme on mount
  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  useEffect(() => {
    const unsubscribe = useTimelineStore.persist.onFinishHydration(() => {
      console.log('Store hydrated');
      setIsLoading(false);
    });

    if (useTimelineStore.persist.hasHydrated()) {
      setIsLoading(false);
    }

    return unsubscribe;
  }, []);

  useEffect(() => {
    if (!isLoading) {
      loadStories();
      loadUserProfile();
      loadThoughts();
      loadTodos();
      loadRelationships();
      loadPreferences();
      loadAdvice();
      loadManagedTags();
      loadWealthItems();
      loadWealthHistory();
    }
  }, [loadStories, loadUserProfile, loadThoughts, loadTodos, loadRelationships, loadPreferences, loadAdvice, loadManagedTags, loadWealthItems, loadWealthHistory, isLoading]);

  // Show auth page if not authenticated
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 to-gray-800">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-400">Initializing...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <AuthPage />;
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-theme-secondary">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-theme-accent mx-auto"></div>
          <p className="mt-4 text-theme-secondary">Loading LifeFlow...</p>
        </div>
      </div>
    );
  }

  const handleSearch = (query: string) => {
    const filtered = stories.filter(story =>
      story.title.toLowerCase().includes(query.toLowerCase()) ||
      story.content.toLowerCase().includes(query.toLowerCase())
    );
    setSearchResults(filtered);
    setCurrentView({ type: 'timeline' });
  };

  const handleQuickAdd = () => {
    setCurrentView({ type: 'add-story' });
  };

  const handleAddStory = () => {
    setCurrentView({ type: 'add-story' });
  };

  const getBreadcrumbs = () => {
    const crumbs: { label: string; onClick?: () => void }[] = [];

    if (currentView.type !== 'timeline') {
      crumbs.push({ label: 'Timeline' });
    }

    switch (currentView.type) {
      case 'on-this-day':
        crumbs.push({ label: 'On This Day' });
        break;
      case 'relationships':
        crumbs.push({ label: 'Relationships' });
        break;
      case 'location-map':
        crumbs.push({ label: 'Location Map' });
        break;
      case 'event-heatmap':
        crumbs.push({ label: 'Event Heatmap' });
        break;
      case 'gantt-timeline':
        crumbs.push({ label: 'Gantt Timeline' });
        break;
      case 'likes-dislikes':
        crumbs.push({ label: 'Likes & Dislikes' });
        break;
      case 'add-story':
        crumbs.push({ label: 'Add Story' });
        break;
      case 'edit-story':
        crumbs.push({ label: 'Edit Story' });
        break;
      case 'profile':
        crumbs.push({ label: 'Profile' });
        break;
      case 'settings':
        crumbs.push({ label: 'Settings' });
        break;
    }

    return crumbs;
  };

  const renderView = () => {
    if (!userProfile && currentView.type !== 'profile') {
      return <UserProfile />;
    }

    switch (currentView.type) {
      case 'timeline':
        return <Timeline searchResults={searchResults} onAddStory={handleAddStory} />;
      case 'bubble':
        return <BubbleTimeline />;
      case 'calendar':
        return <CalendarView />;
      case 'profile':
        return <UserProfile />;
      case 'settings':
        return <Settings />;
      case 'event-heatmap':
        return <AIInsights />;
      case 'gantt-timeline':
        return <GanttTimeline />;
      case 'on-this-day':
        return <OnThisDay />;
      case 'relationships':
        return <Relationships />;
      case 'location-map':
        return <LocationMap />;
      case 'likes-dislikes':
        return <LikesDislikes />;
      case 'life-dashboard':
        return <LifeDashboard />;
      case 'job-tracker':
        return <JobTracker />;
      case 'child-tracker':
        return <ChildTracker />;
      case 'home-tracker':
        return <HomeTracker />;
      case 'relationship-tracker':
        return <RelationshipTracker />;
      case 'thoughts':
        return <Thoughts />;
      case 'todos':
        return <TodoList />;
      case 'wealth-tracker':
        return <WealthTracker />;
      case 'experimental':
        return <ExperimentalComparison />;
      case 'advice':
        return <AdvicePanel />;
      case 'add-story':
        return <StoryForm />;
      case 'edit-story':
        return <StoryForm storyId={currentView.storyId} />;
      default:
        return <Timeline />;
    }
  };

  // Pillar navigation configuration
  const PILLAR_MAP: Record<string, 'flow' | 'visualise' | 'me'> = {
    timeline: 'flow', calendar: 'flow', thoughts: 'flow', todos: 'flow', advice: 'flow',
    'add-story': 'flow', 'edit-story': 'flow', 'on-this-day': 'flow',
    'life-dashboard': 'visualise', bubble: 'visualise', 'event-heatmap': 'visualise',
    'gantt-timeline': 'visualise', 'location-map': 'visualise', 'wealth-tracker': 'visualise',
    'relationship-tracker': 'visualise', // MOVED: Heart is now under Visualise
    profile: 'me', settings: 'me', relationships: 'me', experimental: 'me',
    'job-tracker': 'me', 'child-tracker': 'me', 'home-tracker': 'me',
    'likes-dislikes': 'me',
  };

  const PILLAR_DEFAULTS: Record<string, string> = {
    flow: 'timeline',
    visualise: 'life-dashboard',
    me: 'profile',
  };

  const activePillar = PILLAR_MAP[currentView.type] || 'flow';

  const navigationItems = [
    // FLOW Pillar
    { type: 'timeline', pillar: 'flow', icon: CalendarIcon, label: 'Timeline' },
    { type: 'calendar', pillar: 'flow', icon: CalendarIcon, label: 'Calendar' },
    { type: 'thoughts', pillar: 'flow', icon: Lightbulb, label: 'Thoughts' },
    { type: 'advice', pillar: 'flow', icon: BookOpen, label: 'Advice' },
    { type: 'todos', pillar: 'flow', icon: CheckSquare, label: 'To-Do List' },
    { type: 'on-this-day', pillar: 'flow', icon: CalendarIcon, label: 'On This Day' },
    // VISUALISE Pillar
    { type: 'life-dashboard', pillar: 'visualise', icon: BarChart3, label: 'Dashboard' },
    { type: 'bubble', pillar: 'visualise', icon: Circle, label: 'Bubble' },
    { type: 'event-heatmap', pillar: 'visualise', icon: Brain, label: 'Heatmap' },
    { type: 'gantt-timeline', pillar: 'visualise', icon: BarChart3, label: 'Gantt' },
    { type: 'location-map', pillar: 'visualise', icon: MapPin, label: 'Map' },
    { type: 'wealth-tracker', pillar: 'visualise', icon: PiggyBank, label: 'Wealth' },
    { type: 'relationship-tracker', pillar: 'visualise', icon: Heart, label: 'Heart' }, // MOVED HERE
    // ME Pillar
    { type: 'job-tracker', pillar: 'me', icon: TrendingUp, label: 'Career' },
    { type: 'child-tracker', pillar: 'me', icon: Users, label: 'Children' },
    { type: 'home-tracker', pillar: 'me', icon: Home, label: 'Home' },
    { type: 'relationships', pillar: 'me', icon: Users, label: 'Connections' },
    { type: 'likes-dislikes', pillar: 'me', icon: Smile, label: 'Preferences' },
    { type: 'experimental', pillar: 'me', icon: AlertTriangle, label: 'Experimental' },
    { type: 'profile', pillar: 'me', icon: Smile, label: 'Profile' },
    { type: 'settings', pillar: 'me', icon: SettingsIcon, label: 'Settings' },
  ];

  const showBackButton = currentView.type === 'edit-story';

  const handleBackClick = () => {
    setCurrentView({ type: 'timeline' });
  };

  return (
    <div className="min-h-screen bg-theme-secondary">
      <Navigation
        items={navigationItems}
        activeView={currentView.type}
        activePillar={activePillar}
        pillarDefaults={PILLAR_DEFAULTS}
        onViewChange={(type) => setCurrentView({ type: type as any })}
        userProfile={userProfile}
        onQuickAdd={() => setCurrentView({ type: 'add-story' })}
        onSearch={handleSearch}
        breadcrumbs={getBreadcrumbs()}
        showBackButton={showBackButton}
        onBackClick={handleBackClick}
      />
      <main className="container mx-auto px-4 py-8">
        <div key={currentView.type} className="animate-fade-in">
          {renderView()}
        </div>
      </main>

      {/* Toast notifications */}
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: '#363636',
            color: '#fff',
          },
          success: {
            duration: 3000,
            iconTheme: {
              primary: '#4ade80',
              secondary: '#fff',
            },
          },
          error: {
            duration: 5000,
            iconTheme: {
              primary: '#ef4444',
              secondary: '#fff',
            },
          },
        }}
      />
    </div>
  );
}

// Wrap App with ErrorBoundary
const AppWithErrorBoundary: React.FC = () => (
  <ErrorBoundary>
    <App />
  </ErrorBoundary>
);

export default AppWithErrorBoundary;
