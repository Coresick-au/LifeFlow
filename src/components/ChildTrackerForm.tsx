import React, { useState } from 'react';
import { useTimelineStore } from '../store/timelineStore';
import { format } from 'date-fns';
import { Baby, Calendar, MapPin, Users, Camera, X, Save, Heart } from 'lucide-react';

interface ChildTrackerFormProps {
  onClose: () => void;
  editData?: {
    id: string;
    childName: string;
    birthDate: Date;
    birthLocation: string;
    babyPhoto?: string;
    parents: string[];
    description: string;
    date: Date;
    type: 'birth' | 'milestone' | 'memory' | 'achievement';
    milestoneType?: string;
  };
}

export const ChildTrackerForm: React.FC<ChildTrackerFormProps> = ({ onClose, editData }) => {
  const { addStory, updateStory } = useTimelineStore();
  const [formData, setFormData] = useState({
    childName: editData?.childName || '',
    birthDate: editData?.birthDate || new Date(),
    birthLocation: editData?.birthLocation || '',
    babyPhoto: editData?.babyPhoto || '',
    parents: editData?.parents || [],
    description: editData?.description || '',
    date: editData?.date || new Date(),
    type: editData?.type || 'milestone' as 'birth' | 'milestone' | 'memory' | 'achievement',
    milestoneType: editData?.milestoneType || ''
  });
  const [isSaving, setIsSaving] = useState(false);
  const [newParent, setNewParent] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.childName.trim()) return;

    setIsSaving(true);
    try {
      const storyData = {
        title: formData.type === 'birth' 
          ? `Birth of ${formData.childName}`
          : formData.type === 'milestone'
          ? `${formData.childName}'s ${formData.milestoneType || 'Milestone'}`
          : formData.type === 'achievement'
          ? `${formData.childName}'s Achievement`
          : `Memory of ${formData.childName}`,
        content: formData.description,
        type: 'long' as const,
        date: formData.date,
        tags: ['child', 'kid', formData.type, formData.childName.toLowerCase()],
        people: [formData.childName, ...formData.parents],
        importance: 'high' as const,
        location: formData.birthLocation,
        images: formData.babyPhoto ? [formData.babyPhoto] : [],
        metadata: {
          childName: formData.childName,
          birthDate: formData.birthDate,
          birthLocation: formData.birthLocation,
          babyPhoto: formData.babyPhoto,
          parents: formData.parents,
          eventType: 'child'
        }
      };

      if (editData) {
        await updateStory(editData.id, storyData);
      } else {
        await addStory(storyData);
      }
      
      onClose();
    } catch (error) {
      console.error('Failed to save child event:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const addParent = () => {
    if (newParent.trim() && !formData.parents.includes(newParent.trim())) {
      setFormData({ 
        ...formData, 
        parents: [...formData.parents, newParent.trim()] 
      });
      setNewParent('');
    }
  };

  const removeParent = (parent: string) => {
    setFormData({ 
      ...formData, 
      parents: formData.parents.filter(p => p !== parent) 
    });
  };

  const milestoneTypes = [
    'First Steps',
    'First Words',
    'First Day of School',
    'Lost First Tooth',
    'Learned to Ride Bike',
    'Graduation',
    'Birthday',
    'Other'
  ];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-theme-primary rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-theme-primary border-b border-theme px-6 py-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-theme-primary flex items-center gap-2">
            <Baby className="w-5 h-5" />
            {editData ? 'Edit Child Event' : 'Add Child Event'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-theme-tertiary"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Event Type */}
          <div>
            <label className="block text-sm font-medium text-theme-secondary mb-2">
              Event Type
            </label>
            <div className="grid grid-cols-2 gap-2">
              {(['birth', 'milestone', 'achievement', 'memory'] as const).map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => setFormData({ ...formData, type })}
                  className={`px-4 py-2 rounded-lg capitalize transition-colors ${
                    formData.type === type
                      ? 'bg-primary-600 text-white'
                      : 'bg-theme-tertiary text-theme-secondary hover:opacity-80'
                  }`}
                >
                  {type}
                </button>
              ))}
            </div>
          </div>

          {/* Child Name */}
          <div>
            <label className="block text-sm font-medium text-theme-secondary mb-2">
              Child's Name *
            </label>
            <div className="relative">
              <Baby className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                value={formData.childName}
                onChange={(e) => setFormData({ ...formData, childName: e.target.value })}
                className="w-full pl-10 pr-3 py-2 border border-theme rounded-lg bg-theme-primary text-theme-primary focus:outline-none focus:ring-2 focus:ring-primary-500"
                placeholder="Enter child's name"
                required
              />
            </div>
          </div>

          {/* Birth Details */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-theme-secondary mb-2">
                Birth Date
              </label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="date"
                  value={format(formData.birthDate, 'yyyy-MM-dd')}
                  onChange={(e) => setFormData({ ...formData, birthDate: new Date(e.target.value) })}
                  className="w-full pl-10 pr-3 py-2 border border-theme rounded-lg bg-theme-primary text-theme-primary focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-theme-secondary mb-2">
                Birth Location
              </label>
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  value={formData.birthLocation}
                  onChange={(e) => setFormData({ ...formData, birthLocation: e.target.value })}
                  className="w-full pl-10 pr-3 py-2 border border-theme rounded-lg bg-theme-primary text-theme-primary focus:outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder="Hospital, City, State"
                />
              </div>
            </div>
          </div>

          {/* Event Date */}
          <div>
            <label className="block text-sm font-medium text-theme-secondary mb-2">
              Event Date
            </label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="date"
                value={format(formData.date, 'yyyy-MM-dd')}
                onChange={(e) => setFormData({ ...formData, date: new Date(e.target.value) })}
                className="w-full pl-10 pr-3 py-2 border border-theme rounded-lg bg-theme-primary text-theme-primary focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
          </div>

          {/* Milestone Type */}
          {formData.type === 'milestone' && (
            <div>
              <label className="block text-sm font-medium text-theme-secondary mb-2">
                Milestone Type
              </label>
              <select
                value={formData.milestoneType}
                onChange={(e) => setFormData({ ...formData, milestoneType: e.target.value })}
                className="w-full px-3 py-2 border border-theme rounded-lg bg-theme-primary text-theme-primary focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="">Select milestone</option>
                {milestoneTypes.map((type) => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
            </div>
          )}

          {/* Parents */}
          <div>
            <label className="block text-sm font-medium text-theme-secondary mb-2">
              Parents/Guardians
            </label>
            <div className="space-y-2">
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Users className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    value={newParent}
                    onChange={(e) => setNewParent(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addParent())}
                    className="w-full pl-10 pr-3 py-2 border border-theme rounded-lg bg-theme-primary text-theme-primary focus:outline-none focus:ring-2 focus:ring-primary-500"
                    placeholder="Enter parent name"
                  />
                </div>
                <button
                  type="button"
                  onClick={addParent}
                  className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
                >
                  Add
                </button>
              </div>
              {formData.parents.map((parent) => (
                <div key={parent} className="flex items-center gap-2 p-2 bg-theme-tertiary rounded">
                  <Heart className="w-4 h-4 text-red-400" />
                  <span className="flex-1 text-sm text-theme-tertiary">{parent}</span>
                  <button
                    type="button"
                    onClick={() => removeParent(parent)}
                    className="text-red-500 hover:text-red-700"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Baby Photo */}
          <div>
            <label className="block text-sm font-medium text-theme-secondary mb-2">
              Baby Photo URL
            </label>
            <div className="relative">
              <Camera className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="url"
                value={formData.babyPhoto}
                onChange={(e) => setFormData({ ...formData, babyPhoto: e.target.value })}
                className="w-full pl-10 pr-3 py-2 border border-theme rounded-lg bg-theme-primary text-theme-primary focus:outline-none focus:ring-2 focus:ring-primary-500"
                placeholder="https://example.com/photo.jpg"
              />
            </div>
            {formData.babyPhoto && (
              <img 
                src={formData.babyPhoto} 
                alt="Baby" 
                className="mt-2 w-32 h-32 object-cover rounded-lg"
                onError={(e) => { e.currentTarget.src = ''; }}
              />
            )}
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-theme-secondary mb-2">
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={4}
              className="w-full px-3 py-2 border border-theme rounded-lg bg-theme-primary text-theme-primary focus:outline-none focus:ring-2 focus:ring-primary-500"
              placeholder="Describe this special moment..."
            />
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4 border-t border-theme">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-theme text-theme-secondary rounded-lg hover:bg-theme-tertiary transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaving || !formData.childName.trim()}
              className="flex-1 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
            >
              <Save className="w-4 h-4" />
              {isSaving ? 'Saving...' : 'Save'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
