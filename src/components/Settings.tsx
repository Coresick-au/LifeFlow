import React, { useState } from 'react';
import { useTimelineStore } from '../store/timelineStore';
import { useAuth } from '../contexts/AuthContext';
import { Plus, X, Tag as TagIcon, Palette, AlertTriangle, Trash2, LogOut, Cloud, CloudOff, User, RefreshCw, Check } from 'lucide-react';
import * as supabaseService from '../services/supabaseService';

export const Settings: React.FC = () => {
  const { managedTags, addManagedTag, updateManagedTag, deleteManagedTag, loadManagedTags } = useTimelineStore();
  const { user, isOfflineMode, signOut } = useAuth();
  const [isAddingTag, setIsAddingTag] = useState(false);
  const [editingTag, setEditingTag] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    category: 'general',
    color: '#3B82F6',
  });

  const predefinedCategories = [
    'general',
    'emotion',
    'activity',
    'people',
    'place',
    'event',
    'milestone',
    'health',
    'work',
    'personal',
  ];

  const predefinedColors = [
    '#3B82F6', // blue
    '#10B981', // green
    '#F59E0B', // yellow
    '#EF4444', // red
    '#8B5CF6', // purple
    '#EC4899', // pink
    '#6B7280', // gray
    '#14B8A6', // teal
  ];

  React.useEffect(() => {
    loadManagedTags();
  }, [loadManagedTags]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name) return;

    if (editingTag) {
      await updateManagedTag(editingTag, formData);
      setEditingTag(null);
    } else {
      await addManagedTag(formData);
    }

    setFormData({ name: '', category: 'general', color: '#3B82F6' });
    setIsAddingTag(false);
  };

  const handleEdit = (tag: any) => {
    setFormData({
      name: tag.name,
      category: tag.category,
      color: tag.color,
    });
    setEditingTag(tag.id);
    setIsAddingTag(true);
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this tag?')) {
      await deleteManagedTag(id);
    }
  };

  const groupedTags = managedTags.reduce((acc, tag) => {
    if (!acc[tag.category]) {
      acc[tag.category] = [];
    }
    acc[tag.category].push(tag);
    return acc;
  }, {} as Record<string, typeof managedTags>);

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Account Section */}
      <div className="bg-theme-primary rounded-lg shadow-lg p-6">
        <div className="flex items-center space-x-3 mb-6">
          <User className="w-8 h-8 text-primary-500" />
          <h2 className="text-2xl font-bold text-theme-primary">Account</h2>
        </div>

        <div className="space-y-4">
          {/* Sync Status */}
          <div className="flex items-center justify-between p-4 bg-theme-tertiary rounded-lg">
            <div className="flex items-center gap-3">
              {isOfflineMode ? (
                <CloudOff className="w-5 h-5 text-gray-400" />
              ) : (
                <Cloud className="w-5 h-5 text-green-500" />
              )}
              <div>
                <p className="font-medium text-theme-primary">
                  {isOfflineMode ? 'Offline Mode' : 'Cloud Sync Active'}
                </p>
                <div className="flex gap-2 text-sm text-theme-secondary">
                  <span>{isOfflineMode ? 'Data stored locally on this device only' : user?.email || 'Syncing with Supabase'}</span>
                </div>
              </div>
            </div>

            <div className="flex gap-2">
              {!isOfflineMode && (
                <button
                  onClick={async () => {
                    if (window.confirm('This will push all your local data to the cloud. existing cloud data may be duplicated if not empty. Continue?')) {
                      const { syncLocalToCloud } = useTimelineStore.getState();
                      const result = await syncLocalToCloud();
                      alert(result.message);
                      if (result.success) {
                        window.location.reload();
                      }
                    }
                  }}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <Cloud className="w-4 h-4" />
                  Force Sync to Cloud
                </button>
              )}

              {!isOfflineMode && user && (
                <button
                  onClick={async () => {
                    if (window.confirm('This will scan for and remove duplicate stories from the cloud. Continue?')) {
                      const result = await supabaseService.deduplicateStories(user.id);
                      alert(`Cleaned up ${result.removed} duplicate stories. ${result.kept} unique stories remain.`);
                      if (result.removed > 0) {
                        window.location.reload();
                      }
                    }
                  }}
                  className="flex items-center gap-2 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors"
                >
                  <RefreshCw className="w-4 h-4" />
                  Clean Duplicates
                </button>
              )}

              {!isOfflineMode && (
                <button
                  onClick={signOut}
                  className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                  Sign Out
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Tag Settings */}
      <div className="bg-theme-primary rounded-lg shadow-lg p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <TagIcon className="w-8 h-8 text-primary-500" />
            <h2 className="text-2xl font-bold text-theme-primary">Tag Settings</h2>
          </div>
          <button
            onClick={() => {
              setIsAddingTag(!isAddingTag);
              setEditingTag(null);
              setFormData({ name: '', category: 'general', color: '#3B82F6' });
            }}
            className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Add Tag
          </button>
        </div>

        {isAddingTag && (
          <form onSubmit={handleSubmit} className="mb-6 p-4 bg-theme-tertiary rounded-lg">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-theme-secondary mb-1">
                  Tag Name
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 border border-theme rounded-md bg-theme-primary text-theme-primary focus:outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder="Enter tag name"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-theme-secondary mb-1">
                  Category
                </label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="w-full px-3 py-2 border border-theme rounded-md bg-theme-primary text-theme-primary focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  {predefinedCategories.map(cat => (
                    <option key={cat} value={cat}>
                      {cat.charAt(0).toUpperCase() + cat.slice(1)}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-theme-secondary mb-1">
                  Color
                </label>
                <div className="flex flex-wrap items-center gap-3">
                  {/* Predefined Colors */}
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {predefinedColors.map(color => (
                      <button
                        key={color}
                        type="button"
                        onClick={() => setFormData({ ...formData, color })}
                        className={`w-8 h-8 rounded-full border-2 flex items-center justify-center transition-all ${formData.color === color
                          ? 'border-slate-500 dark:border-slate-300 scale-110'
                          : 'border-transparent hover:scale-105'
                          }`}
                        style={{ backgroundColor: color }}
                        title={color}
                      >
                        {formData.color === color && <Check className="w-4 h-4 text-white drop-shadow-md" />}
                      </button>
                    ))}
                  </div>

                  <div className="w-px h-8 bg-theme-border mx-1"></div>

                  {/* Custom Color Picker */}
                  <div className="flex items-center gap-2">
                    <div className="relative group" title="Pick Custom Color">
                      <div className="w-10 h-10 rounded-lg overflow-hidden border border-theme cursor-pointer relative flex items-center justify-center shadow-sm hover:ring-2 hover:ring-primary-500 transition-all">
                        <div
                          className="absolute inset-0"
                          style={{ backgroundColor: formData.color }}
                        ></div>
                        <Palette className="w-5 h-5 text-white drop-shadow-md relative z-10 opacity-90" />
                        <input
                          type="color"
                          value={formData.color}
                          onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                          className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                        />
                      </div>
                    </div>
                    <div className="relative">
                      <span className="absolute left-2 top-1/2 -translate-y-1/2 text-xs text-theme-tertiary">#</span>
                      <input
                        type="text"
                        value={formData.color.replace('#', '')}
                        onChange={(e) => {
                          const val = e.target.value;
                          if (/^[0-9A-Fa-f]{0,6}$/.test(val)) {
                            setFormData({ ...formData, color: '#' + val });
                          }
                        }}
                        className="w-20 pl-4 pr-2 py-1.5 text-sm border border-theme rounded-md bg-theme-primary text-theme-primary focus:ring-2 focus:ring-primary-500 font-mono uppercase"
                        placeholder="HEX"
                        maxLength={6}
                      />
                    </div>
                  </div>
                </div>
              </div>
              <div className="flex items-end space-x-2">
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 transition-colors"
                >
                  {editingTag ? 'Update' : 'Add'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsAddingTag(false);
                    setEditingTag(null);
                    setFormData({ name: '', category: 'general', color: '#3B82F6' });
                  }}
                  className="px-4 py-2 bg-slate-200 dark:bg-slate-700 text-theme-primary rounded-md hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          </form>
        )}

        <div className="space-y-6">
          {Object.entries(groupedTags).map(([category, tags]) => (
            <div key={category}>
              <h3 className="text-lg font-semibold text-theme-primary mb-3 capitalize">
                {category}
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {tags.map(tag => (
                  <div
                    key={tag.id}
                    className="flex items-center justify-between p-3 border border-theme rounded-lg hover:bg-theme-tertiary"
                  >
                    <div className="flex items-center space-x-3">
                      <div
                        className="w-4 h-4 rounded-full"
                        style={{ backgroundColor: tag.color }}
                      />
                      <span className="font-medium text-theme-primary">#{tag.name}</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <button
                        onClick={() => handleEdit(tag)}
                        className="p-1 text-gray-400 hover:text-theme-tertiary"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </button>
                      <button
                        onClick={() => handleDelete(tag.id)}
                        className="p-1 text-gray-400 hover:text-red-600"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {managedTags.length === 0 && (
          <div className="text-center py-12">
            <TagIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-slate-500 dark:text-slate-400">No tags created yet</p>
            <p className="text-sm text-gray-400 mt-2">
              Click "Add Tag" to create your first managed tag
            </p>
          </div>
        )}

        {/* Benchmark Data Section */}
        <div className="mt-12 pt-8 border-t border-theme">
          <div className="flex items-center space-x-3 mb-4">
            <svg className="w-6 h-6 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            <h3 className="text-lg font-bold text-theme-primary">Benchmark Data</h3>
          </div>

          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-6 mb-4">
            <p className="text-sm text-blue-800 dark:text-blue-300 mb-4">
              Import custom benchmark data from the Australian Bureau of Statistics (ABS) to keep your comparisons up-to-date.
            </p>

            <details className="mb-4">
              <summary className="text-sm font-medium text-blue-600 dark:text-blue-400 cursor-pointer hover:underline">
                📥 How to get ABS benchmark data
              </summary>
              <div className="mt-3 p-4 bg-blue-100 dark:bg-blue-900/40 rounded-lg text-xs text-blue-800 dark:text-blue-300 space-y-2">
                <p><strong>1. Visit ABS:</strong> <a href="https://www.abs.gov.au/statistics/economy/finance/household-income-and-wealth-australia" target="_blank" rel="noopener noreferrer" className="underline hover:text-blue-500">Household Income and Wealth, Australia</a></p>
                <p><strong>2. Download:</strong> Look for "Data downloads" and get the CSV or Excel file</p>
                <p><strong>3. Format:</strong> Your CSV should have columns: <code className="bg-blue-200 dark:bg-blue-800 px-1 rounded">ageGroup,medianNetWorth,medianIncome,medianSuperannuation</code></p>
                <p><strong>Example row:</strong> <code className="bg-blue-200 dark:bg-blue-800 px-1 rounded">35-44,425000,95000,125000</code></p>
              </div>
            </details>

            {/* Check for custom data */}
            {localStorage.getItem('lifeflow-custom-benchmarks') && (
              <div className="mb-4 p-3 bg-green-100 dark:bg-green-900/30 border border-green-300 dark:border-green-700 rounded-lg flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <svg className="w-5 h-5 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-sm font-medium text-green-700 dark:text-green-300">
                    Custom benchmark data is active
                  </span>
                </div>
                <button
                  onClick={() => {
                    if (window.confirm('Remove custom benchmark data and use defaults?')) {
                      localStorage.removeItem('lifeflow-custom-benchmarks');
                      window.location.reload();
                    }
                  }}
                  className="text-xs text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 underline"
                >
                  Reset to defaults
                </button>
              </div>
            )}

            <div className="flex items-center gap-3">
              <label className="flex-1">
                <input
                  type="file"
                  accept=".csv"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;

                    const reader = new FileReader();
                    reader.onload = (event) => {
                      try {
                        const csv = event.target?.result as string;
                        const lines = csv.trim().split('\n');
                        const headers = lines[0].split(',').map(h => h.trim().toLowerCase());

                        const benchmarks = lines.slice(1).map(line => {
                          const values = line.split(',');
                          const obj: Record<string, any> = {};
                          headers.forEach((h, i) => {
                            obj[h] = h.includes('age') ? values[i]?.trim() : parseFloat(values[i]) || 0;
                          });
                          return obj;
                        }).filter(b => b.agegroup || b.age_group);

                        if (benchmarks.length > 0) {
                          localStorage.setItem('lifeflow-custom-benchmarks', JSON.stringify(benchmarks));
                          alert(`Imported ${benchmarks.length} benchmark records. Page will reload.`);
                          window.location.reload();
                        } else {
                          alert('No valid benchmark data found in CSV. Check the format.');
                        }
                      } catch (err) {
                        alert('Error parsing CSV. Please check the file format.');
                        console.error(err);
                      }
                    };
                    reader.readAsText(file);
                    e.target.value = '';
                  }}
                  className="hidden"
                  id="benchmark-csv-upload"
                />
                <span className="flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md cursor-pointer transition-colors text-sm font-medium">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                  </svg>
                  Upload CSV
                </span>
              </label>
            </div>
          </div>
        </div>

        {/* Danger Zone */}
        <div className="mt-12 pt-8 border-t-2 border-red-500/20">
          <div className="flex items-center space-x-3 mb-4">
            <AlertTriangle className="w-6 h-6 text-red-500" />
            <h3 className="text-lg font-bold text-red-500">Danger Zone</h3>
          </div>
          <div className="bg-red-500/5 border border-red-500/20 rounded-lg p-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h4 className="font-semibold text-theme-primary">Reset All Data</h4>
                <p className="text-sm text-theme-secondary mt-1">
                  This will permanently delete all your stories, relationships, wealth items, and profile data from this device.
                  <span className="font-bold text-red-500 ml-1">This action cannot be undone.</span>
                </p>
              </div>
              <button
                onClick={async () => {
                  if (window.confirm('CRITICAL WARNING: This will permanently delete ALL your data. Are you absolutely sure?')) {
                    const confirmText = 'RESET';
                    const userInput = window.prompt(`Please type "${confirmText}" to confirm deletion:`);
                    if (userInput === confirmText) {
                      const { clearAllData } = useTimelineStore.getState();
                      await clearAllData();
                      alert('All data has been cleared.');
                    }
                  }
                }}
                className="flex items-center justify-center gap-2 px-6 py-3 bg-red-600 hover:bg-red-700 text-white font-bold rounded-md transition-colors"
              >
                <Trash2 className="w-5 h-5" />
                Reset Everything
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
