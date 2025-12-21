import React, { useState, useMemo, useEffect } from 'react';
import { useTimelineStore } from '../store/timelineStore';
import { UserProfile as UserProfileType, Story } from '../types';
import { Save, Calendar, MapPin, User as UserIcon, Database, Download, TrendingUp, Heart, BookOpen, Users, Target, Award, Clock, X, Upload, AlertTriangle, Camera } from 'lucide-react';
import { PDFExport } from './PDFExport';
import { format, differenceInYears, differenceInDays, differenceInMonths } from 'date-fns';

export const UserProfile: React.FC = () => {
  const { userProfile, setUserProfile, seedData, stories, relationships, setCurrentView, isLoading, exportData, importData } = useTimelineStore();
  const [formData, setFormData] = useState<Partial<UserProfileType>>({
    name: userProfile?.name || '',
    birthDate: userProfile?.birthDate ? new Date(userProfile.birthDate) : new Date(),
    location: userProfile?.location || '',
    bio: userProfile?.bio || '',
    avatar: userProfile?.avatar || '',
  });
  const [isSaving, setIsSaving] = useState(false);
  const [isSeeding, setIsSeeding] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [showExport, setShowExport] = useState(false);
  const [showDashboard, setShowDashboard] = useState(false);
  const [showSeedConfirm, setShowSeedConfirm] = useState(false);
  const [birthDateError, setBirthDateError] = useState('');

  // Update formData when userProfile changes
  useEffect(() => {
    if (userProfile) {
      setFormData({
        name: userProfile.name || '',
        birthDate: new Date(userProfile.birthDate),
        location: userProfile.location || '',
        bio: userProfile.bio || '',
        avatar: userProfile.avatar || '',
      });
    }
  }, [userProfile]);

  // Calculate dashboard statistics
  const dashboardStats = useMemo(() => {
    if (!userProfile) {
      return null;
    }
    
    if (!stories || stories.length === 0) {
      return null;
    }

    const birthDate = new Date(userProfile.birthDate);
    const today = new Date();
    const age = differenceInYears(today, birthDate);
    const ageInDays = differenceInDays(today, birthDate);
    const ageInMonths = differenceInMonths(today, birthDate);

    // Story statistics
    const totalStories = stories.length;
    const storiesByType = stories.reduce((acc, story) => {
      acc[story.type] = (acc[story.type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const storiesByMood = stories.reduce((acc, story) => {
      const mood = story.mood || 'neutral';
      acc[mood] = (acc[mood] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const importantStories = stories.filter(s => s.importance === 'high').length;
    const fuzzyDateStories = stories.filter(s => s.fuzzyDate).length;

    // Timeline statistics
    const sortedStories = [...stories].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    const firstStory = sortedStories[0];
    const lastStory = sortedStories[sortedStories.length - 1];
    const timelineSpan = firstStory && lastStory ? differenceInDays(new Date(lastStory.date), new Date(firstStory.date)) : 0;

    // Location statistics
    const uniqueLocations = new Set(stories.filter(s => s.location).map(s => s.location)).size;

    // People statistics
    const uniquePeople = new Set(stories.flatMap(s => s.people)).size;
    const mostMentionedPerson = stories.reduce((acc, story) => {
      story.people.forEach(person => {
        acc[person] = (acc[person] || 0) + 1;
      });
      return acc;
    }, {} as Record<string, number>);

    const topPerson = Object.entries(mostMentionedPerson)
      .sort(([, a], [, b]) => b - a)[0];

    // Activity patterns
    const storiesByYear = stories.reduce((acc, story) => {
      const year = new Date(story.date).getFullYear();
      acc[year] = (acc[year] || 0) + 1;
      return acc;
    }, {} as Record<number, number>);

    const mostActiveYear = Object.entries(storiesByYear)
      .sort(([, a], [, b]) => b - a)[0];

    // Life metrics
    const storiesPerYear = age > 0 ? Math.round(totalStories / age * 10) / 10 : 0;
    const storiesPerMonth = age > 0 ? Math.round(totalStories / (age * 12) * 10) / 10 : 0;
    const dayCoverage = timelineSpan > 0 ? Math.round((totalStories / timelineSpan) * 100) : 0;

    return {
      age,
      ageInDays,
      ageInMonths,
      totalStories,
      storiesByType,
      storiesByMood,
      importantStories,
      fuzzyDateStories,
      timelineSpan,
      uniqueLocations,
      uniquePeople,
      topPerson,
      mostActiveYear,
      storiesPerYear,
      storiesPerMonth,
      dayCoverage,
      firstStoryDate: firstStory ? format(new Date(firstStory.date), 'MMM d, yyyy') : null,
      lastStoryDate: lastStory ? format(new Date(lastStory.date), 'MMM d, yyyy') : null,
    };
  }, [userProfile, stories]);

  const handleSeedData = async () => {
    setIsSeeding(true);
    await seedData();
    setIsSeeding(false);
    setShowSeedConfirm(false);
  };

  const handleExport = async () => {
    setIsExporting(true);
    try {
      const jsonData = await exportData();
      const blob = new Blob([jsonData], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `lifeflow-backup-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Export failed:', error);
    }
    setIsExporting(false);
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    setIsImporting(true);
    try {
      const text = await file.text();
      await importData(text);
    } catch (error) {
      console.error('Import failed:', error);
      alert('Failed to import data. Please check the file format.');
    }
    setIsImporting(false);
    // Reset file input
    e.target.value = '';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.birthDate) return;

    setIsSaving(true);
    const profile: UserProfileType = {
      id: userProfile?.id || crypto.randomUUID(),
      name: formData.name,
      birthDate: formData.birthDate,
      location: formData.location,
      bio: formData.bio,
      avatar: formData.avatar,
    };

    await setUserProfile(profile);
    setIsSaving(false);
  };

  const calculateAge = () => {
    if (!formData.birthDate || isNaN(formData.birthDate.getTime())) return 0;
    const today = new Date();
    const birth = new Date(formData.birthDate);
    const age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      return age - 1;
    }
    return age;
  };

  const getGeneration = (birthYear: number) => {
    if (birthYear >= 1997 && birthYear <= 2012) return 'Gen Z';
    if (birthYear >= 1981 && birthYear <= 1996) return 'Millennial';
    if (birthYear >= 1965 && birthYear <= 1980) return 'Gen X';
    if (birthYear >= 1946 && birthYear <= 1964) return 'Baby Boomer';
    if (birthYear >= 1928 && birthYear <= 1945) return 'Silent Generation';
    if (birthYear <= 1927) return 'Greatest Generation';
    return 'Gen Alpha';
  };

  const validateBirthDate = (date: Date) => {
    const today = new Date();
    if (date > today) {
      setBirthDateError('Birth date cannot be in the future');
      return false;
    }
    const minDate = new Date();
    minDate.setFullYear(minDate.getFullYear() - 130);
    if (date < minDate) {
      setBirthDateError('Please enter a valid birth date');
      return false;
    }
    setBirthDateError('');
    return true;
  };

  const handleBirthDateChange = (value: string) => {
    const date = value ? new Date(value) : undefined;
    if (date) {
      validateBirthDate(date);
    }
    setFormData({ ...formData, birthDate: date });
  };

  const handleAvatarUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onloadend = () => {
      setFormData({ ...formData, avatar: reader.result as string });
    };
    reader.readAsDataURL(file);
  };

  const removeAvatar = () => {
    setFormData({ ...formData, avatar: '' });
  };

  const calculateCompleteness = () => {
    const fields = ['name', 'birthDate', 'location', 'bio', 'avatar'];
    const filledFields = fields.filter(field => {
      const value = formData[field as keyof typeof formData];
      return value !== undefined && value !== '' && value !== null;
    });
    return Math.round((filledFields.length / fields.length) * 100);
  };

  const renderDashboard = () => {
    if (!dashboardStats) return null;

    return (
      <div className="bg-gradient-to-br from-blue-900/20 to-indigo-900/20 rounded-lg p-6 space-y-6 border border-blue-800/30">
        <div className="flex items-center justify-between">
          <h3 className="text-xl font-bold text-theme-primary flex items-center gap-2">
            <TrendingUp className="w-6 h-6 text-blue-600" />
            Life Dashboard
          </h3>
          <button
            onClick={() => setShowDashboard(false)}
            className="text-gray-400 hover:text-theme-tertiary"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Age Overview */}
        <div className="bg-theme-primary rounded-lg p-4 shadow-sm">
          <h4 className="font-semibold text-theme-primary mb-3">Age Overview</h4>
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-blue-600">{dashboardStats.age}</div>
              <div className="text-sm text-theme-tertiary">Years</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-green-600">{dashboardStats.ageInMonths}</div>
              <div className="text-sm text-theme-tertiary">Months</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-purple-600">{dashboardStats.ageInDays.toLocaleString()}</div>
              <div className="text-sm text-theme-tertiary">Days</div>
            </div>
          </div>
        </div>

        {/* Story Statistics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-theme-primary rounded-lg p-4 shadow-sm text-center">
            <BookOpen className="w-8 h-8 text-blue-500 mx-auto mb-2" />
            <div className="text-2xl font-bold text-theme-primary">{dashboardStats.totalStories}</div>
            <div className="text-sm text-theme-tertiary">Total Stories</div>
          </div>
          <div className="bg-theme-primary rounded-lg p-4 shadow-sm text-center">
            <Target className="w-8 h-8 text-red-500 mx-auto mb-2" />
            <div className="text-2xl font-bold text-theme-primary">{dashboardStats.importantStories}</div>
            <div className="text-sm text-theme-tertiary">Important</div>
          </div>
          <div className="bg-theme-primary rounded-lg p-4 shadow-sm text-center">
            <Users className="w-8 h-8 text-green-500 mx-auto mb-2" />
            <div className="text-2xl font-bold text-theme-primary">{dashboardStats.uniquePeople}</div>
            <div className="text-sm text-theme-tertiary">People</div>
          </div>
          <div className="bg-theme-primary rounded-lg p-4 shadow-sm text-center">
            <MapPin className="w-8 h-8 text-purple-500 mx-auto mb-2" />
            <div className="text-2xl font-bold text-theme-primary">{dashboardStats.uniqueLocations}</div>
            <div className="text-sm text-theme-tertiary">Locations</div>
          </div>
        </div>

        {/* Activity Metrics */}
        <div className="bg-theme-primary rounded-lg p-4 shadow-sm">
          <h4 className="font-semibold text-theme-primary mb-3">Activity Metrics</h4>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <div>
              <div className="text-lg font-bold text-theme-primary">{dashboardStats.storiesPerYear}</div>
              <div className="text-sm text-theme-tertiary">Stories per year</div>
            </div>
            <div>
              <div className="text-lg font-bold text-theme-primary">{dashboardStats.storiesPerMonth}</div>
              <div className="text-sm text-theme-tertiary">Stories per month</div>
            </div>
            <div>
              <div className="text-lg font-bold text-theme-primary">{dashboardStats.dayCoverage}%</div>
              <div className="text-sm text-theme-tertiary">Day coverage</div>
            </div>
          </div>
        </div>

        {/* Timeline Span */}
        {dashboardStats.firstStoryDate && dashboardStats.lastStoryDate && (
          <div className="bg-theme-primary rounded-lg p-4 shadow-sm">
            <h4 className="font-semibold text-theme-primary mb-3">Timeline</h4>
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-theme-tertiary">First Story</div>
                <div className="font-medium">{dashboardStats.firstStoryDate}</div>
              </div>
              <Clock className="w-5 h-5 text-gray-400" />
              <div className="text-right">
                <div className="text-sm text-theme-tertiary">Last Story</div>
                <div className="font-medium">{dashboardStats.lastStoryDate}</div>
              </div>
            </div>
            <div className="mt-2 text-center">
              <span className="text-sm text-theme-tertiary">Span: </span>
              <span className="font-medium">{dashboardStats.timelineSpan} days</span>
            </div>
          </div>
        )}

        {/* Top Person */}
        {dashboardStats.topPerson && (
          <div className="bg-theme-primary rounded-lg p-4 shadow-sm">
            <h4 className="font-semibold text-theme-primary mb-3">Most Mentioned Person</h4>
            <div className="flex items-center justify-between">
              <span className="font-medium text-theme-primary">{dashboardStats.topPerson[0]}</span>
              <span className="bg-blue-500/200/20 text-blue-400 px-3 py-1 rounded-full text-sm">
                {dashboardStats.topPerson[1]} stories
              </span>
            </div>
          </div>
        )}

        {/* Story Types */}
        <div className="bg-theme-primary rounded-lg p-4 shadow-sm">
          <h4 className="font-semibold text-theme-primary mb-3">Story Types</h4>
          <div className="space-y-2">
            {Object.entries(dashboardStats.storiesByType).map(([type, count]) => (
              <div key={type} className="flex items-center justify-between">
                <span className="capitalize text-theme-secondary">{type}</span>
                <div className="flex items-center gap-2">
                  <div className="w-24 bg-theme-tertiary rounded-full h-2">
                    <div 
                      className="bg-blue-500/200 h-2 rounded-full"
                      style={{ width: `${(count / dashboardStats.totalStories) * 100}%` }}
                    />
                  </div>
                  <span className="text-sm text-theme-tertiary w-8 text-right">{count}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Mood Distribution */}
        <div className="bg-theme-primary rounded-lg p-4 shadow-sm">
          <h4 className="font-semibold text-theme-primary mb-3 flex items-center gap-2">
            <Heart className="w-5 h-5 text-red-500" />
            Mood Distribution
          </h4>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {Object.entries(dashboardStats.storiesByMood).map(([mood, count]) => (
              <div key={mood} className="text-center p-2 bg-theme-tertiary rounded">
                <div className="text-lg font-bold text-theme-primary">{count}</div>
                <div className="text-sm text-theme-tertiary capitalize">{mood}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Achievements */}
        <div className="bg-gradient-to-r from-amber-900/20 to-yellow-900/20 rounded-lg p-4 border border-amber-800/30">
          <h4 className="font-semibold text-theme-primary mb-3 flex items-center gap-2">
            <Award className="w-5 h-5 text-yellow-600" />
            Achievements
          </h4>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-sm">
            {dashboardStats.totalStories >= 10 && (
              <div className="flex items-center gap-2">
                <span className="text-lg">📝</span>
                <span>Storyteller</span>
              </div>
            )}
            {dashboardStats.timelineSpan >= 365 && (
              <div className="flex items-center gap-2">
                <span className="text-lg">📅</span>
                <span>Time Traveler</span>
              </div>
            )}
            {dashboardStats.uniquePeople >= 10 && (
              <div className="flex items-center gap-2">
                <span className="text-lg">👥</span>
                <span>Connector</span>
              </div>
            )}
            {dashboardStats.uniqueLocations >= 5 && (
              <div className="flex items-center gap-2">
                <span className="text-lg">🌍</span>
                <span>Explorer</span>
              </div>
            )}
            {dashboardStats.importantStories >= 5 && (
              <div className="flex items-center gap-2">
                <span className="text-lg">⭐</span>
                <span>Highlight Reel</span>
              </div>
            )}
            {dashboardStats.dayCoverage >= 50 && (
              <div className="flex items-center gap-2">
                <span className="text-lg">📈</span>
                <span>Consistent</span>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="bg-theme-primary rounded-lg shadow-lg p-6 animate-slide-up">
          <div className="flex items-center justify-center py-12">
            <div className="text-slate-500 dark:text-slate-400">Loading profile...</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-theme-primary rounded-lg shadow-lg p-6 animate-slide-up">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            {formData.avatar ? (
              <img
                src={formData.avatar}
                alt="Profile"
                className="w-16 h-16 rounded-full object-cover"
              />
            ) : (
              <UserIcon className="w-16 h-16 text-primary-500" />
            )}
            <div>
              <h2 className="text-2xl font-bold text-theme-primary">Your Profile</h2>
              {userProfile ? (
                <div className="flex items-center gap-2">
                  <p className="text-sm text-green-600">Profile saved</p>
                  <span className="text-sm text-slate-500 dark:text-slate-400">•</span>
                  <p className="text-sm text-theme-tertiary">{calculateCompleteness()}% complete</p>
                </div>
              ) : (
                <p className="text-sm text-orange-600">Please save your profile to enable dashboard</p>
              )}
            </div>
          </div>
          {userProfile && (
            <button
              onClick={() => setShowDashboard(!showDashboard)}
              className="flex items-center gap-2 px-4 py-2 bg-theme-accent text-white rounded-md hover:bg-theme-accent-hover transition-colors"
            >
              <TrendingUp className="w-4 h-4" />
              {showDashboard ? 'Hide Dashboard' : 'Show Dashboard'}
            </button>
          )}
        </div>

        {/* Profile Completeness Bar */}
        <div className="mb-6">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium text-theme-secondary">Profile Completeness</span>
            <span className="text-sm text-slate-500 dark:text-slate-400">{calculateCompleteness()}%</span>
          </div>
          <div className="w-full bg-theme-tertiary rounded-full h-2">
            <div
              className="bg-theme-accent h-2 rounded-full transition-all duration-300"
              style={{ width: `${calculateCompleteness()}%` }}
            />
          </div>
        </div>

        {showDashboard && (
          <div className="mb-6">
            {dashboardStats ? renderDashboard() : (
              <div className="bg-gradient-to-br from-blue-900/20 to-indigo-900/20 rounded-lg p-6 border border-blue-800/30">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xl font-bold text-theme-primary flex items-center gap-2">
                    <TrendingUp className="w-6 h-6 text-blue-600" />
                    Life Dashboard
                  </h3>
                  <button
                    onClick={() => setShowDashboard(false)}
                    className="text-gray-400 hover:text-theme-tertiary"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
                <div className="bg-theme-primary rounded-lg p-8 text-center">
                  <p className="text-theme-tertiary mb-4">No stories to display yet</p>
                  <button
                    onClick={() => setCurrentView({ type: 'add-story' })}
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                  >
                    Add Your First Story
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Avatar Upload */}
          <div>
            <label className="block text-sm font-medium text-theme-secondary mb-1">
              Profile Picture
            </label>
            <div className="flex items-center space-x-4">
              {formData.avatar ? (
                <div className="relative">
                  <img
                    src={formData.avatar}
                    alt="Profile"
                    className="w-20 h-20 rounded-full object-cover"
                  />
                  <button
                    type="button"
                    onClick={removeAvatar}
                    className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ) : (
                <div className="w-20 h-20 rounded-full bg-theme-tertiary flex items-center justify-center">
                  <Camera className="w-8 h-8 text-theme-tertiary" />
                </div>
              )}
              <div>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarUpload}
                  className="hidden"
                  id="avatar-upload"
                />
                <label
                  htmlFor="avatar-upload"
                  className="cursor-pointer inline-flex items-center px-3 py-2 border border-theme-border shadow-sm text-sm leading-4 font-medium rounded-md text-theme-secondary bg-theme-primary hover:bg-theme-tertiary focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                >
                  <Upload className="w-4 h-4 mr-2" />
                  {formData.avatar ? 'Change Photo' : 'Upload Photo'}
                </label>
              </div>
            </div>
          </div>
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-theme-secondary mb-1">
              Name
            </label>
            <input
              type="text"
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3 py-2 border border-theme-border bg-theme-primary text-theme-primary rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              placeholder="Enter your name"
              required
            />
          </div>

          <div>
            <label htmlFor="birthDate" className="block text-sm font-medium text-theme-secondary mb-1">
              <Calendar className="inline w-4 h-4 mr-1" />
              Birth Date
            </label>
            <input
              type="date"
              id="birthDate"
              value={formData.birthDate && !isNaN(formData.birthDate.getTime()) ? formData.birthDate.toISOString().split('T')[0] : ''}
              onChange={(e) => handleBirthDateChange(e.target.value)}
              className={`w-full px-3 py-2 border rounded-md bg-theme-primary text-theme-primary focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent ${
                birthDateError ? 'border-red-300' : 'border-theme-border'
              }`}
              required
            />
            {formData.birthDate && !isNaN(formData.birthDate.getTime()) && (
              <div className="mt-1 space-y-1">
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  You are {calculateAge()} years old
                </p>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  Generation: {getGeneration(formData.birthDate.getFullYear())}
                </p>
              </div>
            )}
            {birthDateError && (
              <p className="mt-1 text-sm text-red-600">{birthDateError}</p>
            )}
          </div>

          <div>
            <label htmlFor="location" className="block text-sm font-medium text-theme-secondary mb-1">
              <MapPin className="inline w-4 h-4 mr-1" />
              Location (optional)
            </label>
            <input
              type="text"
              id="location"
              value={formData.location}
              onChange={(e) => setFormData({ ...formData, location: e.target.value })}
              className="w-full px-3 py-2 border border-theme-border bg-theme-primary text-theme-primary rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              placeholder="City, Country"
            />
          </div>

          <div>
            <label htmlFor="bio" className="block text-sm font-medium text-theme-secondary mb-1">
              Bio (optional)
            </label>
            <textarea
              id="bio"
              value={formData.bio}
              onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
              rows={4}
              className="w-full px-3 py-2 border border-theme-border bg-theme-primary text-theme-primary rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              placeholder="Tell us about yourself..."
            />
          </div>

          <button
            type="submit"
            disabled={isSaving || !formData.name || !formData.birthDate || birthDateError !== ''}
            className="w-full flex items-center justify-center space-x-2 bg-primary-600 text-white py-2 px-4 rounded-md hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <Save className="w-4 h-4" />
            <span>{isSaving ? 'Saving...' : 'Save Profile'}</span>
          </button>
        </form>

        {/* Data Management Section */}
        <div className="mt-8 pt-8 border-t border-theme">
          <h3 className="text-lg font-semibold text-theme-primary mb-4 flex items-center gap-2">
            <Database className="w-5 h-5 text-theme-tertiary" />
            Data Management
          </h3>
          
          <div className="space-y-3">
            {/* Backup and Restore */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <button
                onClick={handleExport}
                disabled={isExporting}
                className="flex items-center justify-center space-x-2 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <Download className="w-4 h-4" />
                <span>{isExporting ? 'Exporting...' : 'Export JSON'}</span>
              </button>
              
              <div className="relative">
                <input
                  type="file"
                  accept=".json"
                  onChange={handleImport}
                  className="hidden"
                  id="import-json"
                  disabled={isImporting}
                />
                <label
                  htmlFor="import-json"
                  className={`flex items-center justify-center space-x-2 bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 cursor-pointer transition-colors ${
                    isImporting ? 'opacity-50 cursor-not-allowed' : ''
                  }`}
                >
                  <Upload className="w-4 h-4" />
                  <span>{isImporting ? 'Importing...' : 'Import JSON'}</span>
                </label>
              </div>
            </div>

            {/* PDF Export */}
            <button
              type="button"
              onClick={() => setShowExport(true)}
              className="w-full flex items-center justify-center space-x-2 bg-purple-600 text-white py-2 px-4 rounded-md hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 transition-colors"
            >
              <Download className="w-4 h-4" />
              <span>Export to PDF</span>
            </button>
          </div>
        </div>

        {/* Danger Zone */}
        <div className="mt-8 pt-8 border-t border-theme-border">
          <div className="bg-red-900/20 border border-red-800 rounded-lg p-4">
            <h3 className="text-lg font-semibold text-red-300 mb-2 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5" />
              Danger Zone
            </h3>
            <p className="text-sm text-red-400 mb-4">
              These actions cannot be undone. Please be careful.
            </p>
            
            <button
              type="button"
              onClick={() => setShowSeedConfirm(true)}
              disabled={isSeeding}
              className="w-full flex items-center justify-center space-x-2 bg-red-600 text-white py-2 px-4 rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <Database className="w-4 h-4" />
              <span>{isSeeding ? 'Loading...' : 'Load Sample Data'}</span>
            </button>
            
            <p className="text-xs text-red-400 mt-2">
              This will permanently delete all your stories and profile data.
            </p>
          </div>
        </div>

        {/* Confirmation Modal */}
        {showSeedConfirm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-theme-primary rounded-lg p-6 max-w-md mx-4">
              <h3 className="text-lg font-semibold text-theme-primary mb-4">Confirm Data Reset</h3>
              <p className="text-theme-tertiary mb-6">
                Are you sure you want to load sample data? This will <strong>permanently delete</strong> all your existing stories, profile, relationships, and tags. This action cannot be undone.
              </p>
              <div className="flex space-x-3">
                <button
                  onClick={() => setShowSeedConfirm(false)}
                  className="flex-1 px-4 py-2 border border-theme-border text-theme-secondary rounded-md hover:bg-theme-tertiary focus:outline-none focus:ring-2 focus:ring-theme-border"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSeedData}
                  disabled={isSeeding}
                  className="flex-1 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 disabled:opacity-50"
                >
                  {isSeeding ? 'Loading...' : 'Delete & Load Sample'}
                </button>
              </div>
            </div>
          </div>
        )}

        {showExport && (
          <div className="mt-6">
            <PDFExport onClose={() => setShowExport(false)} />
          </div>
        )}
      </div>
    </div>
  );
};
