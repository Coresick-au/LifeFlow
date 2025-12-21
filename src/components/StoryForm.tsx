import React, { useState, useEffect, useRef } from 'react';
import { useTimelineStore } from '../store/timelineStore';
import { Story } from '../types';
import { format, addDays, addWeeks, addMonths, addYears } from 'date-fns';
import { X, Calendar, MapPin, Users, Tag, Heart, Star, Lock, Clock, FileText, Hash, ChevronDown, Check, Save } from 'lucide-react';

const moodOptions = [
  { value: 'happy', label: '😊 Happy', color: 'bg-yellow-500/20 text-yellow-400' },
  { value: 'sad', label: '😢 Sad', color: 'bg-blue-500/20 text-blue-400' },
  { value: 'neutral', label: '😐 Neutral', color: 'bg-theme-tertiary text-theme-primary' },
  { value: 'excited', label: '🎉 Excited', color: 'bg-pink-100 text-pink-800' },
  { value: 'proud', label: '🏆 Proud', color: 'bg-purple-500/20 text-purple-400' },
  { value: 'grateful', label: '🙏 Grateful', color: 'bg-green-500/20 text-green-400' },
];

const importanceOptions = [
  { value: 'low', label: 'Low', icon: Star, className: 'text-gray-400' },
  { value: 'medium', label: 'Medium', icon: Star, className: 'text-yellow-500' },
  { value: 'high', label: 'High', icon: Star, className: 'text-red-500' },
];

export const StoryForm: React.FC<{ storyId?: string }> = ({ storyId }) => {
  const { addStory, updateStory, setCurrentView, stories, relationships, managedTags, loadRelationships, loadManagedTags, userProfile } = useTimelineStore();
  const [tagInput, setTagInput] = useState('');
  const [personInput, setPersonInput] = useState('');
  const [showTagSuggestions, setShowTagSuggestions] = useState(false);
  const [showPersonSuggestions, setShowPersonSuggestions] = useState(false);
  const [isTimeCapsule, setIsTimeCapsule] = useState(false);
  const [selectedPeople, setSelectedPeople] = useState<string[]>([]);
  const [peopleSearchTerm, setPeopleSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(!!storyId);
  const [images, setImages] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const debounceTimer = useRef<NodeJS.Timeout>();

  const isEditing = !!storyId;
  const [formData, setFormData] = useState<Partial<Story>>({
    title: '',
    content: '',
    type: 'short',
    date: new Date(),
    endDate: undefined,
    fuzzyDate: false,
    tags: [],
    people: [],
    importance: 'medium',
    mood: undefined,
    location: '',
    images: [],
    lockedUntil: undefined,
  });

  useEffect(() => {
    loadRelationships();
    loadManagedTags();
  }, [loadRelationships, loadManagedTags]);

  useEffect(() => {
    if (!isEditing) {
      const savedDraft = localStorage.getItem('storyFormDraft');
      if (savedDraft) {
        try {
          const draft = JSON.parse(savedDraft);
          setFormData(prev => ({ ...prev, ...draft }));
        } catch (error) {
          console.error('Failed to load draft:', error);
        }
      }
    }
  }, [isEditing]);

  useEffect(() => {
    if (!isEditing) {
      clearTimeout(debounceTimer.current);
      debounceTimer.current = setTimeout(() => {
        localStorage.setItem('storyFormDraft', JSON.stringify(formData));
      }, 1000);
    }

    return () => {
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
      }
    };
  }, [formData, isEditing]);

  useEffect(() => {
    if (storyId) {
      const story = stories.find(s => s.id === storyId);
      if (story) {
        const storyData = {
          ...story,
          date: new Date(story.date),
          endDate: story.endDate ? new Date(story.endDate) : undefined,
          createdAt: new Date(story.createdAt),
          updatedAt: new Date(story.updatedAt),
        };
        setFormData(storyData);
        setIsTimeCapsule(!!story.lockedUntil);
      }
    }
  }, [storyId, stories]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title?.trim() || !formData.content?.trim()) {
      alert('Please fill in both title and content');
      return;
    }
    
    if (isTimeCapsule && !formData.lockedUntil) {
      alert('Please select a date for the time capsule');
      return;
    }
    
    setIsSubmitting(true);
    
    const existingStory = storyId ? stories.find(s => s.id === storyId) : null;
    
    const storyData: Story = {
      id: storyId || generateId(),
      title: formData.title,
      content: formData.content,
      type: formData.type as 'short' | 'long',
      date: formData.date!,
      endDate: formData.endDate,
      fuzzyDate: formData.fuzzyDate || false,
      tags: formData.tags || [],
      people: formData.people || [],
      importance: formData.importance as 'low' | 'medium' | 'high',
      mood: formData.mood,
      location: formData.location,
      images: formData.images || [],
      lockedUntil: isTimeCapsule ? formData.lockedUntil : undefined,
      createdAt: existingStory?.createdAt || new Date(),
      updatedAt: new Date(),
    };

    if (isEditing && storyId) {
      await updateStory(storyId, storyData);
    } else {
      await addStory(storyData);
      // Clear draft after successful submission
      localStorage.removeItem('storyFormDraft');
    }

    setIsSubmitting(false);
    setCurrentView({ type: 'timeline' });
  };

  const generateId = () => {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  };

  const handleTypeChange = (type: Story['type']) => {
    setFormData({ ...formData, type });
  };

  const toggleTag = (tagName: string) => {
    const currentTags = formData.tags || [];
    setFormData({
      ...formData,
      tags: currentTags.includes(tagName)
        ? currentTags.filter(t => t !== tagName)
        : [...currentTags, tagName]
    });
  };

  const togglePerson = (personName: string) => {
    const currentPeople = formData.people || [];
    const newPeople = currentPeople.includes(personName)
      ? currentPeople.filter(p => p !== personName)
      : [...currentPeople, personName];
    setFormData({ ...formData, people: newPeople });
  };

  const extractPeopleFromContent = () => {
    // Simple regex to find capitalized words that might be names
    const words = (formData.content || '').match(/\b[A-Z][a-z]+\b/g) || [];
    const potentialNames = Array.from(new Set(words));
    const currentPeople = formData.people || [];
    return potentialNames.filter(name => 
      !currentPeople.includes(name) && 
      relationships.some(r => r.fullName.includes(name))
    );
  };

  const calculateAge = (date: string) => {
    if (!userProfile?.birthDate) return null;
    const birthDate = new Date(userProfile.birthDate);
    const storyDate = new Date(date);
    const age = storyDate.getFullYear() - birthDate.getFullYear();
    const monthDiff = storyDate.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && storyDate.getDate() < birthDate.getDate())) {
      return age - 1;
    }
    return age;
  };

  const setQuickDate = (daysAgo: number) => {
    const date = new Date();
    date.setDate(date.getDate() - daysAgo);
    setFormData({ ...formData, date: date });
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      const newImages = Array.from(files).map(file => URL.createObjectURL(file));
      setImages(prev => [...prev, ...newImages]);
    }
  };

  const removeImage = (index: number) => {
    setImages(prev => {
      const newImages = [...prev];
      URL.revokeObjectURL(newImages[index]);
      newImages.splice(index, 1);
      return newImages;
    });
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="shadow-lg p-6" style={{ backgroundColor: 'var(--theme-bg-primary)' }}>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold" style={{ color: 'var(--theme-text-primary)' }}>
            {isEditing ? 'Edit Story' : 'Add New Story'}
          </h2>
          <button
            onClick={() => setCurrentView({ type: 'timeline' })}
            style={{ color: 'var(--theme-text-secondary)' }}
            className="hover:opacity-70 transition-opacity"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Story Type Selection */}
          <div className="flex space-x-4">
            <button
              type="button"
              onClick={() => handleTypeChange('short')}
              className={`flex-1 py-2 px-4 rounded-md font-medium transition-colors rounded-theme ${
                formData.type === 'short'
                  ? 'bg-theme-accent text-white'
                  : 'bg-theme-tertiary text-theme-secondary hover:text-theme-primary'
              }`}
            >
              Quick Note
            </button>
            <button
              type="button"
              onClick={() => handleTypeChange('long')}
              className={`flex-1 py-2 px-4 rounded-md font-medium transition-colors rounded-theme ${
                formData.type === 'long'
                  ? 'bg-theme-accent text-white'
                  : 'bg-theme-tertiary text-theme-secondary hover:text-theme-primary'
              }`}
            >
              Detailed Story
            </button>
          </div>

          {/* Title */}
          <div>
            <label htmlFor="title" className="block text-sm font-medium mb-1 text-theme-primary">
              Title
            </label>
            <input
              type="text"
              id="title"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 input-field rounded-theme"
              placeholder="Give your story a title..."
              required
            />
          </div>

          {/* Content */}
          <div>
            <label htmlFor="content" className="block text-sm font-medium mb-1 text-theme-primary">
              {formData.type === 'short' ? 'Quick Note' : 'Story'}
            </label>
            <textarea
              id="content"
              value={formData.content}
              onChange={(e) => setFormData({ ...formData, content: e.target.value })}
              rows={formData.type === 'short' ? 3 : 8}
              className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 input-field rounded-theme"
              placeholder={
                formData.type === 'short'
                  ? 'Share a quick memory or thought...'
                  : 'Tell your story in detail...'
              }
              required
            />
            <div className="mt-1 text-sm text-theme-tertiary">
              {formData.type === 'short' 
                ? `${(formData.content || '').length}/280 characters`
                : `${(formData.content || '').split(/\s+/).filter(word => word.length > 0).length} words`
              }
            </div>
          </div>

          {/* Date Fields */}
          <div className="space-y-4">
            {/* Fuzzy Date Toggle */}
            <div className="flex items-center space-x-3">
              <input
                type="checkbox"
                id="fuzzyDate"
                checked={formData.fuzzyDate}
                onChange={(e) => setFormData({ ...formData, fuzzyDate: e.target.checked })}
                className="w-4 h-4 border rounded focus:ring-2 border-theme"
                style={{ accentColor: 'var(--theme-accent)' }}
              />
              <label htmlFor="fuzzyDate" className="text-sm font-medium text-theme-primary">
                This is a fuzzy date (approximate time)
              </label>
            </div>

            {/* Date and End Date */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="date" className="block text-sm font-medium mb-1 text-theme-primary">
                  <Calendar className="inline w-4 h-4 mr-1" />
                  Start Date
                </label>
                <input
                  type="date"
                  id="date"
                  value={format(formData.date!, 'yyyy-MM-dd')}
                  onChange={(e) => setFormData({ ...formData, date: new Date(e.target.value) })}
                  className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 input-field rounded-theme"
                  required
                />
                {/* Quick date buttons */}
                <div className="flex gap-2 mt-2">
                  <button
                    type="button"
                    onClick={() => setQuickDate(0)}
                    className="text-xs px-2 py-1 rounded hover:bg-theme-tertiary text-theme-secondary"
                  >
                    Today
                  </button>
                  <button
                    type="button"
                    onClick={() => setQuickDate(1)}
                    className="text-xs px-2 py-1 rounded hover:bg-theme-tertiary text-theme-secondary"
                  >
                    Yesterday
                  </button>
                  <button
                    type="button"
                    onClick={() => setQuickDate(7)}
                    className="text-xs px-2 py-1 rounded hover:bg-theme-tertiary text-theme-secondary"
                  >
                    Last Week
                  </button>
                </div>
                {/* Age display */}
                {formData.date && calculateAge(format(formData.date, 'yyyy-MM-dd')) !== null && (
                  <p className="mt-1 text-xs text-theme-tertiary">
                    You were {calculateAge(format(formData.date, 'yyyy-MM-dd'))} years old
                  </p>
                )}
              </div>
              
              <div>
                <label htmlFor="endDate" className="block text-sm font-medium mb-1 text-theme-primary">
                  End Date (optional)
                </label>
                <input
                  type="date"
                  id="endDate"
                  value={formData.endDate ? format(formData.endDate, 'yyyy-MM-dd') : ''}
                  onChange={(e) => setFormData({ ...formData, endDate: e.target.value ? new Date(e.target.value) : undefined })}
                  min={format(formData.date!, 'yyyy-MM-dd')}
                  className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 input-field rounded-theme"
                />
              </div>
            </div>
          </div>

          {/* Location */}
          <div>
            <label htmlFor="location" className="block text-sm font-medium mb-1 text-theme-primary">
              <MapPin className="inline w-4 h-4 mr-1" />
              Location (optional)
            </label>
            <input
              type="text"
              id="location"
              value={formData.location}
              onChange={(e) => setFormData({ ...formData, location: e.target.value })}
              className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 input-field rounded-theme"
              placeholder="Where did this happen?"
            />
          </div>

          {/* Tags */}
          <div>
            <label className="block text-sm font-medium mb-1 text-theme-primary">
              <Tag className="inline w-4 h-4 mr-1" />
              Tags
            </label>
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowTagSuggestions(!showTagSuggestions)}
                className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 text-left flex items-center justify-between input-field rounded-theme"
              >
                <span className="text-theme-tertiary">
                  {(formData.tags || []).length > 0 ? (formData.tags || []).join(', ') : 'Select tags...'}
                </span>
                <ChevronDown className="w-4 h-4 text-theme-tertiary" />
              </button>
              
              {showTagSuggestions && (
                <div className="absolute z-10 w-full mt-1 border rounded-md shadow-lg max-h-48 overflow-y-auto bg-theme-primary border-theme shadow-theme">
                  {managedTags.length > 0 ? (
                    managedTags.map((tag) => (
                      <button
                        key={tag.id}
                        type="button"
                        onClick={() => toggleTag(tag.name)}
                        className="w-full px-3 py-2 text-left hover:bg-theme-tertiary flex items-center justify-between"
                      >
                        <span className="flex items-center">
                          <span
                            className="w-3 h-3 rounded-full mr-2"
                            style={{ backgroundColor: tag.color }}
                          />
                          {tag.name}
                        </span>
                        {formData.tags?.includes(tag.name) && (
                          <Check className="w-4 h-4" style={{ color: 'var(--theme-accent)' }} />
                        )}
                      </button>
                    ))
                  ) : (
                    <div className="px-3 py-2 text-theme-tertiary text-sm">
                      No tags available. Add some in the settings.
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* People */}
          <div>
            <label className="block text-sm font-medium text-theme-secondary mb-1">
              <Users className="inline w-4 h-4 mr-1" />
              People
            </label>
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowPersonSuggestions(!showPersonSuggestions)}
                className="w-full px-3 py-2 border border-theme rounded-md bg-theme-primary text-theme-primary focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent text-left flex items-center justify-between"
              >
                <span className="text-slate-500 dark:text-slate-400">
                  {(formData.people || []).length > 0 ? (formData.people || []).join(', ') : 'Select people...'}
                </span>
                <ChevronDown className="w-4 h-4 text-gray-400" />
              </button>
              
              {showPersonSuggestions && (
                <div className="absolute z-10 w-full mt-1 bg-theme-primary border border-theme rounded-md shadow-lg max-h-48 overflow-y-auto">
                  {/* Search input */}
                  <div className="p-2 border-b border-theme">
                    <input
                      type="text"
                      placeholder="Search people..."
                      value={peopleSearchTerm}
                      onChange={(e) => setPeopleSearchTerm(e.target.value)}
                      className="w-full px-2 py-1 text-sm border border-theme rounded bg-theme-primary text-theme-primary focus:outline-none focus:ring-1 focus:ring-primary-500"
                    />
                  </div>
                  
                  {/* Suggested people from content */}
                  {formData.content && extractPeopleFromContent().length > 0 && (
                    <div className="p-2 bg-theme-tertiary border-b border-theme">
                      <p className="text-xs font-medium text-theme-tertiary mb-1">Suggested from story:</p>
                      {extractPeopleFromContent().map((name) => (
                        <button
                          key={name}
                          type="button"
                          onClick={() => togglePerson(name)}
                          className="w-full px-2 py-1 text-left text-sm hover:bg-theme-tertiary flex items-center justify-between"
                        >
                          {name}
                          {(formData.people || []).includes(name) && (
                            <Check className="w-3 h-3 text-primary-600" />
                          )}
                        </button>
                      ))}
                    </div>
                  )}
                  
                  {/* All relationships */}
                  {relationships.length > 0 ? (
                    relationships
                      .filter(r => 
                        r.fullName.toLowerCase().includes(peopleSearchTerm.toLowerCase())
                      )
                      .map((person) => (
                        <button
                          key={person.id}
                          type="button"
                          onClick={() => togglePerson(person.fullName)}
                          className="w-full px-3 py-2 text-left hover:bg-theme-tertiary flex items-center justify-between"
                        >
                          <div>
                            <div className="font-medium">{person.fullName}</div>
                            <div className="text-xs text-slate-500 dark:text-slate-400">{person.relationshipType}</div>
                          </div>
                          {(formData.people || []).includes(person.fullName) && (
                            <Check className="w-4 h-4 text-primary-600" />
                          )}
                        </button>
                      ))
                  ) : (
                    <div className="px-3 py-2 text-slate-500 dark:text-slate-400 text-sm">
                      No people available. Add some in the relationships tab.
                    </div>
                  )}
                </div>
              )}
              
              {/* Selected people tags */}
              {(formData.people || []).length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {(formData.people || []).map((person) => (
                    <span
                      key={person}
                      className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-theme-tertiary text-theme-secondary"
                    >
                      {person}
                      <button
                        type="button"
                        onClick={() => togglePerson(person)}
                        className="ml-1 text-slate-500 dark:text-slate-400 hover:text-theme-secondary"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Mood */}
          <div>
            <label className="block text-sm font-medium text-theme-secondary mb-2">
              <Heart className="inline w-4 h-4 mr-1" />
              How did you feel?
            </label>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              {moodOptions.map((mood) => (
                <button
                  key={mood.value}
                  type="button"
                  onClick={() => setFormData({ ...formData, mood: mood.value as Story['mood'] })}
                  className={`py-2 px-3 rounded-md text-sm font-medium transition-colors ${
                    formData.mood === mood.value
                      ? mood.color
                      : 'bg-theme-tertiary text-theme-tertiary hover:opacity-80'
                  }`}
                >
                  {mood.label}
                </button>
              ))}
            </div>
          </div>

          {/* Importance */}
          <div>
            <label className="block text-sm font-medium text-theme-secondary mb-2">
              Importance
            </label>
            <div className="flex space-x-4">
              {importanceOptions.map((option) => {
                const Icon = option.icon;
                return (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setFormData({ ...formData, importance: option.value as Story['importance'] })}
                    className={`flex items-center space-x-2 py-2 px-4 rounded-md font-medium transition-colors ${
                      formData.importance === option.value
                        ? 'bg-primary-500/30 text-primary-700'
                        : 'bg-theme-tertiary text-theme-tertiary hover:opacity-80'
                    }`}
                  >
                    <Icon className={`w-4 h-4 ${option.className}`} />
                    <span>{option.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Media Upload */}
          <div>
            <label className="block text-sm font-medium text-theme-secondary mb-2">
              Media
            </label>
            <div className="border-2 border-dashed border-theme rounded-lg p-6 text-center">
              <input
                type="file"
                multiple
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
                id="media-upload"
              />
              <label
                htmlFor="media-upload"
                className="cursor-pointer"
              >
                <div className="text-gray-400">
                  <svg className="mx-auto h-12 w-12" stroke="currentColor" fill="none" viewBox="0 0 48 48">
                    <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
                <p className="mt-2 text-sm text-theme-tertiary">
                  Click to upload images
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  PNG, JPG, GIF up to 10MB each
                </p>
              </label>
            </div>
            {formData.images && formData.images.length > 0 && (
              <div className="mt-4 grid grid-cols-2 gap-4">
                {formData.images.map((image, index) => (
                  <div key={index} className="relative group">
                    <img
                      src={image}
                      alt={`Upload ${index + 1}`}
                      className="w-full h-32 object-cover rounded-lg"
                    />
                    <button
                      type="button"
                      onClick={() => removeImage(index)}
                      className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Time Capsule Feature */}
          <div className="border-t border-theme pt-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-medium text-theme-primary">Time Capsule</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  Lock this story until a future date
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setIsTimeCapsule(!isTimeCapsule);
                  if (!isTimeCapsule) {
                    // Default to 1 year from now
                    const futureDate = new Date();
                    futureDate.setFullYear(futureDate.getFullYear() + 1);
                    setFormData({ ...formData, lockedUntil: futureDate });
                  } else {
                    setFormData({ ...formData, lockedUntil: undefined });
                  }
                }}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  isTimeCapsule ? 'bg-primary-600' : 'bg-theme-tertiary'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-theme-primary transition-transform ${
                    isTimeCapsule ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
            
            {isTimeCapsule && (
              <div className="bg-amber-900/20 border border-amber-800/30 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <Lock className="w-5 h-5 text-amber-600 mt-0.5" />
                  <div className="flex-1">
                    <label className="block text-sm font-medium text-theme-secondary mb-2">
                      Do not open until
                    </label>
                    <input
                      type="date"
                      value={formData.lockedUntil ? format(formData.lockedUntil, 'yyyy-MM-dd') : ''}
                      onChange={(e) => {
                        const date = e.target.value ? new Date(e.target.value) : undefined;
                        setFormData({ ...formData, lockedUntil: date });
                      }}
                      min={format(new Date(), 'yyyy-MM-dd')}
                      className="w-full px-3 py-2 border border-theme rounded-md bg-theme-primary text-theme-primary focus:outline-none focus:ring-2 focus:ring-primary-500"
                    />
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">
                      This story will be blurred and locked until the selected date
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isSubmitting || !formData.title || !formData.content || !formData.date}
            className="w-full flex items-center justify-center space-x-2 text-white py-3 px-4 rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors btn-primary rounded-theme"
          >
            <Save className="w-4 h-4" />
            <span>{isSubmitting ? 'Saving...' : 'Save Story'}</span>
          </button>
        </form>
      </div>
    </div>
  );
};
