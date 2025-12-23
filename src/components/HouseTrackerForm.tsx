import React, { useState, useMemo } from 'react';
import { useTimelineStore } from '../store/timelineStore';
import { format } from 'date-fns';
import { Home, Calendar, DollarSign, MapPin, Bed, Bath, Square, Camera, X, Save, ChevronDown } from 'lucide-react';

interface HouseTrackerFormProps {
  onClose: () => void;
  editData?: {
    id: string;
    address: string;
    purchasePrice?: number;
    salePrice?: number;
    bedrooms?: number;
    bathrooms?: number;
    squareFootage?: number;
    photos?: string[];
    description: string;
    date: Date;
    type: 'purchase' | 'sale' | 'renovation' | 'memory';
  };
}

export const HouseTrackerForm: React.FC<HouseTrackerFormProps> = ({ onClose, editData }) => {
  const { addStory, updateStory, stories } = useTimelineStore();
  const [formData, setFormData] = useState({
    address: editData?.address || '',
    purchasePrice: editData?.purchasePrice || undefined,
    salePrice: editData?.salePrice || undefined,
    bedrooms: editData?.bedrooms || undefined,
    bathrooms: editData?.bathrooms || undefined,
    squareFootage: editData?.squareFootage || undefined,
    photos: editData?.photos || [],
    description: editData?.description || '',
    date: editData?.date || new Date(),
    type: editData?.type || 'purchase' as 'purchase' | 'sale' | 'renovation' | 'memory'
  });
  const [isSaving, setIsSaving] = useState(false);
  const [showExistingDropdown, setShowExistingDropdown] = useState(false);

  // Extract unique addresses from existing home stories
  const existingHouses = useMemo(() => {
    const homeStories = stories.filter(story =>
      story.tags.some(tag => ['home', 'house'].includes(tag.toLowerCase()))
    );

    // Get unique addresses from metadata.address or location
    const addresses = new Set<string>();
    homeStories.forEach(story => {
      const address = (story.metadata?.address as string) || story.location;
      if (address && address.trim()) {
        addresses.add(address.trim());
      }
    });

    return Array.from(addresses).sort();
  }, [stories]);

  // Check if we should show the existing houses dropdown (for sale/renovation/memory events)
  const shouldShowExistingHouses = formData.type !== 'purchase' && existingHouses.length > 0;

  const handleSelectExistingHouse = (address: string) => {
    setFormData({ ...formData, address });
    setShowExistingDropdown(false);

    // Optionally pre-fill other details from the original purchase
    const originalPurchase = stories.find(story =>
      story.tags.includes('purchase') &&
      ((story.metadata?.address as string) === address || story.location === address)
    );

    if (originalPurchase?.metadata) {
      setFormData(prev => ({
        ...prev,
        address,
        bedrooms: (originalPurchase.metadata?.bedrooms as number) || prev.bedrooms,
        bathrooms: (originalPurchase.metadata?.bathrooms as number) || prev.bathrooms,
        squareFootage: (originalPurchase.metadata?.squareFootage as number) || prev.squareFootage,
        purchasePrice: (originalPurchase.metadata?.purchasePrice as number) || prev.purchasePrice,
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.address.trim()) return;

    setIsSaving(true);
    try {
      const storyData = {
        title: `${formData.type === 'purchase' ? 'Purchased' : formData.type === 'sale' ? 'Sold' : formData.type === 'renovation' ? 'Renovated' : 'Memory of'} ${formData.address}`,
        content: formData.description,
        type: 'long' as const,
        date: formData.date,
        tags: ['home', 'house', formData.type],
        people: [],
        importance: 'medium' as const,
        location: formData.address,
        images: formData.photos,
        metadata: {
          address: formData.address,
          purchasePrice: formData.purchasePrice,
          salePrice: formData.salePrice,
          bedrooms: formData.bedrooms,
          bathrooms: formData.bathrooms,
          squareFootage: formData.squareFootage,
          eventType: 'home'
        }
      };

      if (editData) {
        await updateStory(editData.id, storyData);
      } else {
        await addStory(storyData);
      }

      onClose();
    } catch (error) {
      console.error('Failed to save house event:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const addPhoto = () => {
    // In a real app, this would open a file picker or camera
    const url = prompt('Enter photo URL:');
    if (url) {
      setFormData({ ...formData, photos: [...formData.photos, url] });
    }
  };

  const removePhoto = (index: number) => {
    setFormData({
      ...formData,
      photos: formData.photos.filter((_, i) => i !== index)
    });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-theme-primary rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-theme-primary border-b border-theme px-6 py-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-theme-primary flex items-center gap-2">
            <Home className="w-5 h-5" />
            {editData ? 'Edit Home Event' : 'Add Home Event'}
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
              {(['purchase', 'sale', 'renovation', 'memory'] as const).map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => setFormData({ ...formData, type, address: type === 'purchase' ? '' : formData.address })}
                  className={`px-4 py-2 rounded-lg capitalize transition-colors ${formData.type === type
                    ? 'bg-primary-600 text-white'
                    : 'bg-theme-tertiary text-theme-secondary hover:opacity-80'
                    }`}
                >
                  {type}
                </button>
              ))}
            </div>
          </div>

          {/* Address */}
          <div>
            <label className="block text-sm font-medium text-theme-secondary mb-2">
              Address *
            </label>

            {/* Show dropdown for existing houses if not a purchase */}
            {shouldShowExistingHouses && (
              <div className="mb-2">
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setShowExistingDropdown(!showExistingDropdown)}
                    className="w-full px-3 py-2 border border-theme rounded-lg bg-theme-tertiary text-theme-primary text-left flex items-center justify-between hover:bg-theme-secondary/50 transition-colors"
                  >
                    <span className="text-sm">Select from your properties...</span>
                    <ChevronDown className={`w-4 h-4 transition-transform ${showExistingDropdown ? 'rotate-180' : ''}`} />
                  </button>

                  {showExistingDropdown && (
                    <div className="absolute z-10 mt-1 w-full bg-theme-primary border border-theme rounded-lg shadow-lg max-h-48 overflow-y-auto">
                      {existingHouses.map((address) => (
                        <button
                          key={address}
                          type="button"
                          onClick={() => handleSelectExistingHouse(address)}
                          className="w-full px-4 py-2 text-left text-sm text-theme-primary hover:bg-theme-tertiary transition-colors flex items-center gap-2"
                        >
                          <Home className="w-4 h-4 text-gray-400" />
                          {address}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                <div className="text-xs text-theme-secondary mt-1">Or enter a new address below</div>
              </div>
            )}

            <div className="relative">
              <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                className="w-full pl-10 pr-3 py-2 border border-theme rounded-lg bg-theme-primary text-theme-primary focus:outline-none focus:ring-2 focus:ring-primary-500"
                placeholder="123 Main St, City, State"
                required
              />
            </div>
          </div>

          {/* Date */}
          <div>
            <label className="block text-sm font-medium text-theme-secondary mb-2">
              Date
            </label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="date"
                value={formData.date instanceof Date && !isNaN(formData.date.getTime()) ? format(formData.date, 'yyyy-MM-dd') : ''}
                onChange={(e) => {
                  const dateValue = e.target.value ? new Date(e.target.value) : new Date();
                  setFormData({ ...formData, date: dateValue });
                }}
                className="w-full pl-10 pr-3 py-2 border border-theme rounded-lg bg-theme-primary text-theme-primary focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
          </div>

          {/* Financial Details */}
          {(formData.type === 'purchase' || formData.type === 'sale') && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-theme-secondary mb-2">
                  {formData.type === 'purchase' ? 'Purchase Price' : 'Sale Price'}
                </label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="number"
                    value={formData.purchasePrice || formData.salePrice || ''}
                    onChange={(e) => {
                      const value = e.target.value ? Number(e.target.value) : undefined;
                      if (formData.type === 'purchase') {
                        setFormData({ ...formData, purchasePrice: value });
                      } else {
                        setFormData({ ...formData, salePrice: value });
                      }
                    }}
                    className="w-full pl-10 pr-3 py-2 border border-theme rounded-lg bg-theme-primary text-theme-primary focus:outline-none focus:ring-2 focus:ring-primary-500"
                    placeholder="0.00"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Property Details */}
          {(formData.type === 'purchase' || formData.type === 'renovation') && (
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-theme-secondary mb-2">
                  Bedrooms
                </label>
                <div className="relative">
                  <Bed className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="number"
                    min="0"
                    value={formData.bedrooms || ''}
                    onChange={(e) => setFormData({
                      ...formData,
                      bedrooms: e.target.value ? Number(e.target.value) : undefined
                    })}
                    className="w-full pl-10 pr-3 py-2 border border-theme rounded-lg bg-theme-primary text-theme-primary focus:outline-none focus:ring-2 focus:ring-primary-500"
                    placeholder="0"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-theme-secondary mb-2">
                  Bathrooms
                </label>
                <div className="relative">
                  <Bath className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="number"
                    min="0"
                    step="0.5"
                    value={formData.bathrooms || ''}
                    onChange={(e) => setFormData({
                      ...formData,
                      bathrooms: e.target.value ? Number(e.target.value) : undefined
                    })}
                    className="w-full pl-10 pr-3 py-2 border border-theme rounded-lg bg-theme-primary text-theme-primary focus:outline-none focus:ring-2 focus:ring-primary-500"
                    placeholder="0"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-theme-secondary mb-2">
                  Square Metres
                </label>
                <div className="relative">
                  <Square className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="number"
                    min="0"
                    value={formData.squareFootage || ''}
                    onChange={(e) => setFormData({
                      ...formData,
                      squareFootage: e.target.value ? Number(e.target.value) : undefined
                    })}
                    className="w-full pl-10 pr-3 py-2 border border-theme rounded-lg bg-theme-primary text-theme-primary focus:outline-none focus:ring-2 focus:ring-primary-500"
                    placeholder="0"
                  />
                </div>
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
              placeholder="Describe this home event..."
            />
          </div>

          {/* Photos */}
          <div>
            <label className="block text-sm font-medium text-theme-secondary mb-2">
              Photos
            </label>
            <div className="space-y-2">
              {formData.photos.map((photo, index) => (
                <div key={index} className="flex items-center gap-2 p-2 bg-theme-tertiary rounded">
                  <Camera className="w-4 h-4 text-gray-400" />
                  <span className="flex-1 text-sm text-theme-tertiary">{photo}</span>
                  <button
                    type="button"
                    onClick={() => removePhoto(index)}
                    className="text-red-500 hover:text-red-700"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}
              <button
                type="button"
                onClick={addPhoto}
                className="w-full py-2 border-2 border-dashed border-theme rounded-lg text-slate-500 dark:text-slate-400 hover:border-gray-400 hover:text-theme-tertiary transition-colors"
              >
                Add Photo
              </button>
            </div>
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
              disabled={isSaving || !formData.address.trim()}
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
