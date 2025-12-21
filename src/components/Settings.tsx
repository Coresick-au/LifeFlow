import React, { useState } from 'react';
import { useTimelineStore } from '../store/timelineStore';
import { Plus, X, Tag as TagIcon, Palette } from 'lucide-react';

export const Settings: React.FC = () => {
  const { managedTags, addManagedTag, updateManagedTag, deleteManagedTag, loadManagedTags } = useTimelineStore();
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
    <div className="max-w-4xl mx-auto">
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
                <div className="flex items-center space-x-2">
                  <input
                    type="color"
                    value={formData.color}
                    onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                    className="h-10 w-20 border border-theme rounded cursor-pointer"
                  />
                  <div className="flex space-x-1">
                    {predefinedColors.map(color => (
                      <button
                        key={color}
                        type="button"
                        onClick={() => setFormData({ ...formData, color })}
                        className="w-6 h-6 rounded border-2 border-theme"
                        style={{ backgroundColor: color }}
                      />
                    ))}
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
                  className="px-4 py-2 bg-gray-300 text-theme-secondary rounded-md hover:bg-gray-400 transition-colors"
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
              <h3 className="text-lg font-semibold text-gray-800 mb-3 capitalize">
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
      </div>
    </div>
  );
};
