import React, { useState } from 'react';
import { useTimelineStore } from '../store/timelineStore';
import { format } from 'date-fns';
import { Briefcase, Calendar, MapPin, DollarSign, Building, X, Save, TrendingUp } from 'lucide-react';

interface JobTrackerFormProps {
  onClose: () => void;
  editData?: {
    id: string;
    company: string;
    position: string;
    location: string;
    startDate: Date;
    endDate?: Date;
    salary?: number;
    description: string;
    date: Date;
    type: 'started' | 'promotion' | 'ended' | 'achievement' | 'memory';
  };
}

export const JobTrackerForm: React.FC<JobTrackerFormProps> = ({ onClose, editData }) => {
  const { addStory, updateStory } = useTimelineStore();
  const [formData, setFormData] = useState({
    company: editData?.company || '',
    position: editData?.position || '',
    location: editData?.location || '',
    startDate: editData?.startDate || new Date(),
    endDate: editData?.endDate || undefined,
    salary: editData?.salary || undefined,
    description: editData?.description || '',
    date: editData?.date || new Date(),
    type: editData?.type || 'started' as 'started' | 'promotion' | 'ended' | 'achievement' | 'memory'
  });
  const [isSaving, setIsSaving] = useState(false);
  const [isCurrentJob, setIsCurrentJob] = useState(!editData?.endDate);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.company.trim() || !formData.position.trim()) return;

    setIsSaving(true);
    try {
      const storyData = {
        title: formData.type === 'started' 
          ? `Started ${formData.position} at ${formData.company}`
          : formData.type === 'promotion'
          ? `Promoted to ${formData.position} at ${formData.company}`
          : formData.type === 'ended'
          ? `Left ${formData.company}`
          : formData.type === 'achievement'
          ? `Achievement at ${formData.company}`
          : `Memory of ${formData.company}`,
        content: formData.description,
        type: 'long' as const,
        date: formData.date,
        endDate: formData.type === 'started' ? (isCurrentJob ? undefined : formData.endDate) : undefined,
        tags: ['job', 'career', formData.type, formData.company.toLowerCase()],
        people: [],
        importance: 'high' as const,
        location: formData.location,
        metadata: {
          company: formData.company,
          position: formData.position,
          location: formData.location,
          startDate: formData.startDate,
          endDate: isCurrentJob ? undefined : formData.endDate,
          salary: formData.salary,
          eventType: 'job'
        }
      };

      if (editData) {
        await updateStory(editData.id, storyData);
      } else {
        await addStory(storyData);
      }
      
      onClose();
    } catch (error) {
      console.error('Failed to save job event:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleIsCurrentJobChange = (checked: boolean) => {
    setIsCurrentJob(checked);
    if (checked) {
      setFormData({ ...formData, endDate: undefined });
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-theme-primary rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-theme-primary border-b border-theme px-6 py-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-theme-primary flex items-center gap-2">
            <Briefcase className="w-5 h-5" />
            {editData ? 'Edit Career Event' : 'Add Career Event'}
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
              {(['started', 'promotion', 'ended', 'achievement', 'memory'] as const).map((type) => (
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

          {/* Company and Position */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-theme-secondary mb-2">
                Company *
              </label>
              <div className="relative">
                <Building className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  value={formData.company}
                  onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                  className="w-full pl-10 pr-3 py-2 border border-theme rounded-lg bg-theme-primary text-theme-primary focus:outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder="Company name"
                  required
                />
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-theme-secondary mb-2">
                Position *
              </label>
              <div className="relative">
                <Briefcase className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  value={formData.position}
                  onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                  className="w-full pl-10 pr-3 py-2 border border-theme rounded-lg bg-theme-primary text-theme-primary focus:outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder="Job title"
                  required
                />
              </div>
            </div>
          </div>

          {/* Location */}
          <div>
            <label className="block text-sm font-medium text-theme-secondary mb-2">
              Location
            </label>
            <div className="relative">
              <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                className="w-full pl-10 pr-3 py-2 border border-theme rounded-lg bg-theme-primary text-theme-primary focus:outline-none focus:ring-2 focus:ring-primary-500"
                placeholder="City, State or Remote"
              />
            </div>
          </div>

          {/* Dates */}
          {formData.type === 'started' && (
            <>
              <div>
                <label className="block text-sm font-medium text-theme-secondary mb-2">
                  Start Date
                </label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="date"
                    value={format(formData.startDate, 'yyyy-MM-dd')}
                    onChange={(e) => setFormData({ ...formData, startDate: new Date(e.target.value) })}
                    className="w-full pl-10 pr-3 py-2 border border-theme rounded-lg bg-theme-primary text-theme-primary focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-medium text-theme-secondary">
                    End Date
                  </label>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={isCurrentJob}
                      onChange={(e) => handleIsCurrentJobChange(e.target.checked)}
                      className="mr-2"
                    />
                    <span className="text-sm text-theme-tertiary">I currently work here</span>
                  </label>
                </div>
                {!isCurrentJob && (
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="date"
                      value={formData.endDate ? format(formData.endDate, 'yyyy-MM-dd') : ''}
                      onChange={(e) => setFormData({ ...formData, endDate: e.target.value ? new Date(e.target.value) : undefined })}
                      className="w-full pl-10 pr-3 py-2 border border-theme rounded-lg bg-theme-primary text-theme-primary focus:outline-none focus:ring-2 focus:ring-primary-500"
                    />
                  </div>
                )}
              </div>
            </>
          )}

          {/* Event Date for other types */}
          {formData.type !== 'started' && (
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
          )}

          {/* Salary */}
          {(formData.type === 'started' || formData.type === 'promotion') && (
            <div>
              <label className="block text-sm font-medium text-theme-secondary mb-2">
                Salary (optional)
              </label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="number"
                  value={formData.salary || ''}
                  onChange={(e) => setFormData({ 
                    ...formData, 
                    salary: e.target.value ? Number(e.target.value) : undefined 
                  })}
                  className="w-full pl-10 pr-3 py-2 border border-theme rounded-lg bg-theme-primary text-theme-primary focus:outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder="Annual salary"
                />
              </div>
            </div>
          )}

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
              placeholder="Describe this career event..."
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
              disabled={isSaving || !formData.company.trim() || !formData.position.trim()}
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
