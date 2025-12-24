import React, { useState, useMemo, useEffect } from 'react';
import { useTimelineStore } from '../store/timelineStore';
import { UserProfile as UserProfileType, Story, FamilyMember } from '../types';
import { Save, Calendar, MapPin, User as UserIcon, Database, Download, TrendingUp, Heart, BookOpen, Users, Target, Award, Clock, X, Upload, AlertTriangle, Camera, Plus, Trash2, Home } from 'lucide-react';
import { PDFExport } from './PDFExport';
import { format, differenceInYears, differenceInDays, differenceInMonths } from 'date-fns';
import { AgeOverview, ActivityMetrics, Achievements, LifeCalendar, FamilyCircle } from './ProfileDashboard';
import { ThemedDatePicker } from './ThemedDatePicker';

export const UserProfile: React.FC = () => {
  const { userProfile, setUserProfile, stories, relationships, addRelationship, setCurrentView, isLoading, exportData, importData } = useTimelineStore();
  const [formData, setFormData] = useState<Partial<UserProfileType>>({
    name: userProfile?.name || '',
    birthDate: userProfile?.birthDate ? new Date(userProfile.birthDate) : new Date(),
    birthLocation: userProfile?.birthLocation || '',
    location: userProfile?.location || '',
    hometown: userProfile?.hometown || '',
    bio: userProfile?.bio || '',
    avatar: userProfile?.avatar || '',
    family: userProfile?.family || [],
    bloodType: userProfile?.bloodType || '',
  });
  const [isSaving, setIsSaving] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [showExport, setShowExport] = useState(false);
  const [showDashboard, setShowDashboard] = useState(false);
  const [birthDateError, setBirthDateError] = useState('');

  // Update formData when userProfile changes
  useEffect(() => {
    if (userProfile) {
      setFormData({
        name: userProfile.name || '',
        birthDate: new Date(userProfile.birthDate),
        birthLocation: userProfile.birthLocation || '',
        location: userProfile.location || '',
        hometown: userProfile.hometown || '',
        bio: userProfile.bio || '',
        avatar: userProfile.avatar || '',
        family: userProfile.family || [],
        bloodType: userProfile.bloodType || '',
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
      birthLocation: formData.birthLocation,
      location: formData.location,
      hometown: formData.hometown,
      bio: formData.bio,
      avatar: formData.avatar,
      family: formData.family,
      bloodType: formData.bloodType,
    };

    await setUserProfile(profile);

    // 2. Sync Family Members to Relationships
    if (formData.family) {
      for (const member of formData.family) {
        if (!member.name) continue;

        // Check if this person already exists in relationships
        const exists = relationships.some(r =>
          r.fullName.toLowerCase() === member.name.toLowerCase() ||
          `${r.firstName} ${r.lastName}`.toLowerCase().trim() === member.name.toLowerCase()
        );

        if (!exists) {
          const nameParts = member.name.trim().split(' ');
          const firstName = nameParts[0];
          const lastName = nameParts.length > 1 ? nameParts.slice(1).join(' ') : '';

          await addRelationship({
            firstName,
            lastName,
            fullName: member.name,
            relationshipType: member.role,
            startDate: member.birthDate ? new Date(member.birthDate) : new Date(),
            isCurrent: member.isLiving,
            notes: `Family member (${member.role}) added from profile`,
            trackNurturing: true
          });
        }
      }
    }

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
      <div className="bg-theme-primary rounded-lg shadow-lg overflow-hidden animate-slide-up">
        {/* Hero Profile Header */}
        <div className="relative bg-gradient-to-br from-slate-700 to-slate-900 px-6 py-10">
          <div className="flex flex-col items-center text-center">
            {/* Profile Photo with Edit Overlay */}
            <div className="relative group">
              {formData.avatar ? (
                <img
                  src={formData.avatar}
                  alt="Profile"
                  className="w-36 h-36 rounded-full object-cover border-4 border-white/20 shadow-lg"
                />
              ) : (
                <div className="w-36 h-36 rounded-full bg-white/20 flex items-center justify-center border-4 border-white/10">
                  {/* Letter Avatar */}
                  <span className="text-4xl font-bold text-white">
                    {formData.name ? formData.name.charAt(0).toUpperCase() : '?'}
                  </span>
                </div>
              )}
              {/* Edit overlay */}
              <label
                htmlFor="avatar-upload-hero"
                className="absolute inset-0 flex items-center justify-center bg-black/0 group-hover:bg-black/50 rounded-full cursor-pointer transition-colors"
              >
                <Camera className="w-6 h-6 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
              </label>
              <input
                type="file"
                accept="image/*"
                onChange={handleAvatarUpload}
                className="hidden"
                id="avatar-upload-hero"
              />
              {/* Remove button */}
              {formData.avatar && (
                <button
                  type="button"
                  onClick={removeAvatar}
                  className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full p-1.5 hover:bg-red-600 shadow-md opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>

            {/* Title and Status */}
            <h2 className="text-2xl font-bold text-white mt-4">
              {formData.name || 'Your Profile'}
            </h2>
            {userProfile ? (
              <div className="flex items-center gap-2 mt-1">
                <span className="text-sm text-white/80">Profile saved</span>
                <span className="text-white/50">•</span>
                <span className="text-sm text-white/60">{calculateCompleteness()}% complete</span>
              </div>
            ) : (
              <p className="text-sm text-orange-300 mt-1">Please save your profile to enable dashboard</p>
            )}
          </div>

          {/* Dashboard Toggle */}
          {userProfile && (
            <button
              onClick={() => setShowDashboard(!showDashboard)}
              className="absolute top-4 right-4 flex items-center gap-2 px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white text-sm rounded-full transition-colors"
            >
              <TrendingUp className="w-4 h-4" />
              {showDashboard ? 'Hide' : 'Dashboard'}
            </button>
          )}
        </div>

        <div className="p-6">
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
              <ThemedDatePicker
                id="birthDate"
                selected={formData.birthDate && !isNaN(formData.birthDate.getTime()) ? formData.birthDate : null}
                onChange={(date) => handleBirthDateChange(date ? format(date, 'yyyy-MM-dd') : '')}
                placeholder="Select birth date"
                maxDate={new Date()}
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
              <label htmlFor="birthLocation" className="block text-sm font-medium text-theme-secondary mb-1">
                <MapPin className="inline w-4 h-4 mr-1" />
                Birth Location (optional)
              </label>
              <input
                type="text"
                id="birthLocation"
                value={formData.birthLocation}
                onChange={(e) => setFormData({ ...formData, birthLocation: e.target.value })}
                className="w-full px-3 py-2 border border-theme-border bg-theme-primary text-theme-primary rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                placeholder="City, Country where you were born"
              />
              <p className="mt-1 text-xs text-theme-tertiary">This will appear on your birth event in the timeline</p>
            </div>

            <div>
              <label htmlFor="location" className="block text-sm font-medium text-theme-secondary mb-1">
                <MapPin className="inline w-4 h-4 mr-1" />
                Current Location (optional)
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
              <label htmlFor="hometown" className="block text-sm font-medium text-theme-secondary mb-1">
                <Home className="inline w-4 h-4 mr-1" />
                Hometown (optional)
              </label>
              <input
                type="text"
                id="hometown"
                value={formData.hometown}
                onChange={(e) => setFormData({ ...formData, hometown: e.target.value })}
                className="w-full px-3 py-2 border border-theme-border bg-theme-primary text-theme-primary rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                placeholder="Where you grew up"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="bloodType" className="block text-sm font-medium text-theme-secondary mb-1">
                  Blood Type (optional)
                </label>
                <select
                  id="bloodType"
                  value={formData.bloodType || ''}
                  onChange={(e) => setFormData({ ...formData, bloodType: e.target.value })}
                  className="w-full px-3 py-2 border border-theme-border bg-theme-primary text-theme-primary rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                >
                  <option value="">Select...</option>
                  <option value="A+">A+</option>
                  <option value="A-">A-</option>
                  <option value="B+">B+</option>
                  <option value="B-">B-</option>
                  <option value="AB+">AB+</option>
                  <option value="AB-">AB-</option>
                  <option value="O+">O+</option>
                  <option value="O-">O-</option>
                </select>
                <p className="mt-1 text-xs text-theme-tertiary">Useful for health/emergency context</p>
              </div>
            </div>

            {/* Family Members Section */}
            <div className="border-t border-theme pt-4">
              <div className="flex items-center justify-between mb-3">
                <label className="block text-sm font-medium text-theme-secondary">
                  <Users className="inline w-4 h-4 mr-1" />
                  Family Members
                </label>
                <button
                  type="button"
                  onClick={() => {
                    const newMember: FamilyMember = {
                      id: crypto.randomUUID(),
                      role: 'parent',
                      name: '',
                      isLiving: true,
                    };
                    setFormData({
                      ...formData,
                      family: [...(formData.family || []), newMember],
                    });
                  }}
                  className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700"
                >
                  <Plus className="w-4 h-4" />
                  Add Member
                </button>
              </div>

              {formData.family && formData.family.length > 0 ? (
                <div className="space-y-3">
                  {formData.family.map((member, index) => (
                    <div key={member.id} className="flex items-start gap-2 p-3 bg-theme-tertiary rounded-lg">
                      <div className="flex-1 grid grid-cols-2 gap-2">
                        <input
                          type="text"
                          placeholder="Name"
                          value={member.name}
                          onChange={(e) => {
                            const updated = [...(formData.family || [])];
                            updated[index] = { ...member, name: e.target.value };
                            setFormData({ ...formData, family: updated });
                          }}
                          className="px-2 py-1 text-sm border border-theme-border bg-theme-primary text-theme-primary rounded focus:outline-none focus:ring-1 focus:ring-primary-500"
                        />
                        <select
                          value={member.role}
                          onChange={(e) => {
                            const updated = [...(formData.family || [])];
                            updated[index] = { ...member, role: e.target.value as FamilyMember['role'] };
                            setFormData({ ...formData, family: updated });
                          }}
                          className="px-2 py-1 text-sm border border-theme-border bg-theme-primary text-theme-primary rounded focus:outline-none focus:ring-1 focus:ring-primary-500"
                        >
                          <option value="parent">Parent</option>
                          <option value="sibling">Sibling</option>
                          <option value="partner">Partner</option>
                          <option value="child">Child</option>
                        </select>
                        <input
                          type="date"
                          placeholder="Birth date"
                          value={member.birthDate ? new Date(member.birthDate).toISOString().split('T')[0] : ''}
                          onChange={(e) => {
                            const updated = [...(formData.family || [])];
                            updated[index] = { ...member, birthDate: e.target.value ? new Date(e.target.value) : undefined };
                            setFormData({ ...formData, family: updated });
                          }}
                          className="px-2 py-1 text-sm border border-theme-border bg-theme-primary text-theme-primary rounded focus:outline-none focus:ring-1 focus:ring-primary-500"
                        />
                        <label className="flex items-center gap-1 text-sm">
                          <input
                            type="checkbox"
                            checked={member.isLiving}
                            onChange={(e) => {
                              const updated = [...(formData.family || [])];
                              updated[index] = { ...member, isLiving: e.target.checked };
                              setFormData({ ...formData, family: updated });
                            }}
                            className="rounded"
                          />
                          Living
                        </label>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          const updated = (formData.family || []).filter((_, i) => i !== index);
                          setFormData({ ...formData, family: updated });
                        }}
                        className="p-1 text-red-500 hover:text-red-600"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-theme-tertiary">No family members added. Click "Add Member" to start.</p>
              )}
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
                    className={`flex items-center justify-center space-x-2 bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 cursor-pointer transition-colors ${isImporting ? 'opacity-50 cursor-not-allowed' : ''
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



          {showExport && (
            <div className="mt-6">
              <PDFExport onClose={() => setShowExport(false)} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
