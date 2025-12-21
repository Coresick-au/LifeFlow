import React, { useState, useMemo } from 'react';
import { useTimelineStore } from '../store/timelineStore';
import { ThumbsUp, ThumbsDown, Plus, X, Music, Globe, Palette, Utensils, Book, Film, Gamepad2, Heart } from 'lucide-react';

interface Preference {
  id: string;
  item: string;
  category: string;
  type: 'like' | 'dislike';
  dateAdded: Date;
}

interface Category {
  id: string;
  name: string;
  icon: React.ComponentType<any>;
  suggestions: string[];
}

const categories: Category[] = [
  {
    id: 'music',
    name: 'Music',
    icon: Music,
    suggestions: [
      'Rock', 'Pop', 'Jazz', 'Classical', 'Hip Hop', 'Electronic', 'Country', 'R&B', 
      'Indie', 'Metal', 'Folk', 'Reggae', 'Blues', 'Punk', 'Soul'
    ]
  },
  {
    id: 'countries',
    name: 'Countries',
    icon: Globe,
    suggestions: [
      'United States', 'United Kingdom', 'Japan', 'France', 'Italy', 'Spain', 'Germany',
      'Australia', 'Canada', 'Brazil', 'Mexico', 'India', 'Thailand', 'Greece', 'Netherlands'
    ]
  },
  {
    id: 'food',
    name: 'Food',
    icon: Utensils,
    suggestions: [
      'Pizza', 'Sushi', 'Pasta', 'Tacos', 'Burgers', 'Salad', 'Curry', 'Steak',
      'Seafood', 'Thai', 'Chinese', 'Indian', 'Mexican', 'Italian', 'French'
    ]
  },
  {
    id: 'art',
    name: 'Art',
    icon: Palette,
    suggestions: [
      'Modern Art', 'Classical', 'Abstract', 'Impressionism', 'Surrealism', 'Pop Art',
      'Digital Art', 'Photography', 'Sculpture', 'Street Art', 'Minimalism', 'Cubism'
    ]
  },
  {
    id: 'books',
    name: 'Books',
    icon: Book,
    suggestions: [
      'Fiction', 'Non-Fiction', 'Mystery', 'Romance', 'Sci-Fi', 'Fantasy', 'Biography',
      'History', 'Self-Help', 'Poetry', 'Drama', 'Thriller', 'Horror', 'Adventure'
    ]
  },
  {
    id: 'movies',
    name: 'Movies',
    icon: Film,
    suggestions: [
      'Action', 'Comedy', 'Drama', 'Horror', 'Sci-Fi', 'Romance', 'Thriller',
      'Documentary', 'Animation', 'Fantasy', 'Mystery', 'Crime', 'War', 'Musical'
    ]
  },
  {
    id: 'games',
    name: 'Games',
    icon: Gamepad2,
    suggestions: [
      'RPG', 'Strategy', 'Action', 'Adventure', 'Puzzle', 'Simulation', 'Sports',
      'Racing', 'FPS', 'MMO', 'Platformer', 'Survival', 'Horror', 'Indie'
    ]
  },
  {
    id: 'custom',
    name: 'Custom',
    icon: Heart,
    suggestions: []
  }
];

export const LikesDislikes: React.FC = () => {
  const { preferences, addPreference, removePreference, loadPreferences } = useTimelineStore();
  const [selectedCategory, setSelectedCategory] = useState<string>('music');
  const [showAddForm, setShowAddForm] = useState(false);
  const [newItem, setNewItem] = useState('');
  const [newType, setNewType] = useState<'like' | 'dislike'>('like');
  const [customCategory, setCustomCategory] = useState('');

  // Load preferences on mount
  React.useEffect(() => {
    loadPreferences();
  }, [loadPreferences]);

  const currentCategory = categories.find(c => c.id === selectedCategory) || categories[0];

  // Filter preferences by category
  const filteredPreferences = useMemo(() => {
    return preferences.filter(p => p.category === selectedCategory);
  }, [preferences, selectedCategory]);

  // Get suggestions (exclude already added items)
  const availableSuggestions = useMemo(() => {
    const addedItems = new Set(filteredPreferences.map(p => p.item.toLowerCase()));
    return currentCategory.suggestions.filter(s => !addedItems.has(s.toLowerCase()));
  }, [filteredPreferences, currentCategory]);

  const handleAddPreference = (item: string, type: 'like' | 'dislike') => {
    addPreference({
      item,
      category: selectedCategory,
      type
    });
  };

  const handleRemovePreference = (id: string) => {
    removePreference(id);
  };

  const handleAddCustom = () => {
    if (!newItem.trim()) return;
    
    if (selectedCategory === 'custom' && customCategory.trim()) {
      // Add to custom category with custom subcategory
      addPreference({
        item: `${customCategory}: ${newItem}`,
        category: 'custom',
        type: newType
      });
      setCustomCategory('');
    } else {
      addPreference({
        item: newItem,
        category: selectedCategory,
        type: newType
      });
    }
    
    setNewItem('');
    setShowAddForm(false);
  };

  const stats = useMemo(() => {
    const likes = preferences.filter(p => p.type === 'like').length;
    const dislikes = preferences.filter(p => p.type === 'dislike').length;
    const categories = new Set(preferences.map(p => p.category)).size;
    
    return { likes, dislikes, categories };
  }, [preferences]);

  const Icon = currentCategory.icon;

  return (
    <div className="bg-theme-primary rounded-lg shadow-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-theme-primary">Likes & Dislikes</h2>
        
        <div className="flex gap-3">
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">{stats.likes}</div>
            <div className="text-xs text-slate-500 dark:text-slate-400">Likes</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-red-600">{stats.dislikes}</div>
            <div className="text-xs text-slate-500 dark:text-slate-400">Dislikes</div>
          </div>
        </div>
      </div>

      {/* Category Tabs */}
      <div className="flex flex-wrap gap-2 mb-6">
        {categories.map(category => {
          const CatIcon = category.icon;
          const count = preferences.filter(p => p.category === category.id).length;
          
          return (
            <button
              key={category.id}
              onClick={() => setSelectedCategory(category.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-md transition-colors ${
                selectedCategory === category.id
                  ? 'bg-primary-600 text-white'
                  : 'bg-theme-tertiary text-theme-secondary hover:opacity-80'
              }`}
            >
              <CatIcon className="w-4 h-4" />
              <span>{category.name}</span>
              {count > 0 && (
                <span className="bg-theme-primary bg-opacity-20 px-2 py-0.5 rounded-full text-xs">
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Likes */}
        <div>
          <div className="flex items-center gap-2 mb-4">
            <ThumbsUp className="w-5 h-5 text-green-600" />
            <h3 className="text-lg font-semibold text-theme-primary">Likes</h3>
          </div>
          
          <div className="space-y-2 mb-4">
            {filteredPreferences
              .filter(p => p.type === 'like')
              .map(preference => (
                <div
                  key={preference.id}
                  className="flex items-center justify-between p-3 bg-green-50 rounded-lg group"
                >
                  <span className="text-theme-primary">{preference.item}</span>
                  <button
                    onClick={() => handleRemovePreference(preference.id)}
                    className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-600 transition-all"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}
          </div>

          {/* Suggestions for likes */}
          {availableSuggestions.length > 0 && (
            <div>
              <p className="text-sm text-theme-tertiary mb-2">Suggestions:</p>
              <div className="flex flex-wrap gap-2">
                {availableSuggestions.slice(0, 5).map(suggestion => (
                  <button
                    key={suggestion}
                    onClick={() => handleAddPreference(suggestion, 'like')}
                    className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm hover:bg-green-200 transition-colors"
                  >
                    + {suggestion}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Dislikes */}
        <div>
          <div className="flex items-center gap-2 mb-4">
            <ThumbsDown className="w-5 h-5 text-red-600" />
            <h3 className="text-lg font-semibold text-theme-primary">Dislikes</h3>
          </div>
          
          <div className="space-y-2 mb-4">
            {filteredPreferences
              .filter(p => p.type === 'dislike')
              .map(preference => (
                <div
                  key={preference.id}
                  className="flex items-center justify-between p-3 bg-red-50 rounded-lg group"
                >
                  <span className="text-theme-primary">{preference.item}</span>
                  <button
                    onClick={() => handleRemovePreference(preference.id)}
                    className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-600 transition-all"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}
          </div>

          {/* Suggestions for dislikes */}
          {availableSuggestions.length > 0 && (
            <div>
              <p className="text-sm text-theme-tertiary mb-2">Suggestions:</p>
              <div className="flex flex-wrap gap-2">
                {availableSuggestions.slice(0, 5).map(suggestion => (
                  <button
                    key={suggestion}
                    onClick={() => handleAddPreference(suggestion, 'dislike')}
                    className="px-3 py-1 bg-red-100 text-red-700 rounded-full text-sm hover:bg-red-200 transition-colors"
                  >
                    + {suggestion}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Add Custom Item */}
      <div className="mt-6 pt-6 border-t border-theme">
        <button
          onClick={() => setShowAddForm(true)}
          className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Add Custom Item
        </button>
      </div>

      {/* Add Form Modal */}
      {showAddForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-theme-primary rounded-lg p-6 w-96">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Icon className="w-5 h-5" />
              Add to {currentCategory.name}
            </h3>

            {selectedCategory === 'custom' && (
              <div className="mb-4">
                <label className="block text-sm font-medium text-theme-secondary mb-1">
                  Category (e.g., Sports, Hobbies)
                </label>
                <input
                  type="text"
                  value={customCategory}
                  onChange={(e) => setCustomCategory(e.target.value)}
                  placeholder="Enter category"
                  className="w-full px-3 py-2 border border-theme rounded-md bg-theme-primary text-theme-primary focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
            )}

            <div className="mb-4">
              <label className="block text-sm font-medium text-theme-secondary mb-1">
                Item Name
              </label>
              <input
                type="text"
                value={newItem}
                onChange={(e) => setNewItem(e.target.value)}
                placeholder={selectedCategory === 'custom' ? 'Enter item' : 'Type or select from suggestions'}
                className="w-full px-3 py-2 border border-theme rounded-md bg-theme-primary text-theme-primary focus:outline-none focus:ring-2 focus:ring-primary-500"
                autoFocus
              />
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-theme-secondary mb-1">
                Type
              </label>
              <div className="flex gap-4">
                <label className="flex items-center">
                  <input
                    type="radio"
                    value="like"
                    checked={newType === 'like'}
                    onChange={(e) => setNewType(e.target.value as 'like' | 'dislike')}
                    className="mr-2"
                  />
                  <span className="flex items-center gap-1">
                    <ThumbsUp className="w-4 h-4 text-green-600" />
                    Like
                  </span>
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    value="dislike"
                    checked={newType === 'dislike'}
                    onChange={(e) => setNewType(e.target.value as 'like' | 'dislike')}
                    className="mr-2"
                  />
                  <span className="flex items-center gap-1">
                    <ThumbsDown className="w-4 h-4 text-red-600" />
                    Dislike
                  </span>
                </label>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={handleAddCustom}
                disabled={!newItem.trim()}
                className="flex-1 px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Add
              </button>
              <button
                onClick={() => {
                  setShowAddForm(false);
                  setNewItem('');
                  setCustomCategory('');
                }}
                className="flex-1 px-4 py-2 bg-theme-tertiary text-theme-primary rounded-md hover:bg-gray-300"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
