import React, { useState, useMemo, useRef } from 'react';
import imageCompression from 'browser-image-compression';
import { useTimelineStore } from '../store/timelineStore';
import { uploadMedia, deleteMedia } from '../services/supabaseService';
import { format, isValid } from 'date-fns';
import { Home, Calendar, DollarSign, MapPin, Bed, Bath, Square, Camera, X, Save, ChevronDown, Building2, PiggyBank, Palmtree, Users, Trash2, Upload, Link, Loader2 } from 'lucide-react';
import { ThemedDatePicker } from './ThemedDatePicker';

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
    propertyType?: 'residence' | 'investment' | 'holiday';
    people?: string[];
  };
}

export const HouseTrackerForm: React.FC<HouseTrackerFormProps> = ({ onClose, editData }) => {
  const { addStory, updateStory, stories, relationships } = useTimelineStore();
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
    type: editData?.type || 'purchase' as 'purchase' | 'sale' | 'renovation' | 'memory',
    propertyType: editData?.propertyType || 'residence' as 'residence' | 'investment' | 'holiday',
    people: editData?.people || []
  });
  const [newPerson, setNewPerson] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const [showExistingDropdown, setShowExistingDropdown] = useState(false);
  const [showPeopleDropdown, setShowPeopleDropdown] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Extract unique people from relationships and all story.people
  const existingPeople = useMemo(() => {
    const peopleSet = new Set<string>();

    // Add all relationship names
    relationships.forEach(rel => {
      if (rel.fullName) peopleSet.add(rel.fullName);
      if (rel.firstName && rel.lastName) {
        peopleSet.add(`${rel.firstName} ${rel.lastName}`.trim());
      }
    });

    // Add people from all stories
    stories.forEach(story => {
      story.people?.forEach(person => {
        if (person && person.trim()) {
          peopleSet.add(person.trim());
        }
      });
    });

    return Array.from(peopleSet).sort();
  }, [relationships, stories]);

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
        tags: ['home', 'house', formData.type, formData.propertyType],
        people: formData.people,
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
          propertyType: formData.propertyType,
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

  // Handle file upload with compression
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const userId = stories[0]?.id ? stories[0].id.split('-')[0] : 'anonymous';
    setIsUploadingPhoto(true);

    try {
      const compressionOptions = {
        maxSizeMB: 0.2,
        maxWidthOrHeight: 1920,
        useWebWorker: true,
        fileType: 'image/jpeg' as const,
      };

      for (const file of Array.from(files)) {
        console.log(`[Image] Compressing ${file.name}...`);
        const compressedFile = await imageCompression(file, compressionOptions);
        console.log(`[Image] Compressed to ${(compressedFile.size / 1024).toFixed(1)}KB`);

        const publicUrl = await uploadMedia(userId, compressedFile);
        if (publicUrl) {
          setFormData(prev => ({
            ...prev,
            photos: [...prev.photos, publicUrl]
          }));
        }
      }
    } catch (error) {
      console.error('[Image] Upload failed:', error);
      alert('Failed to upload photo. Please try again.');
    } finally {
      setIsUploadingPhoto(false);
      e.target.value = '';
    }
  };

  // Add photo via URL
  const addPhotoUrl = () => {
    const url = prompt('Enter photo URL:');
    if (url && url.trim()) {
      setFormData(prev => ({ ...prev, photos: [...prev.photos, url.trim()] }));
    }
  };

  const removePhoto = async (index: number) => {
    const photoUrl = formData.photos[index];

    // Remove from state immediately
    setFormData(prev => ({
      ...prev,
      photos: prev.photos.filter((_, i) => i !== index)
    }));

    // Delete from Supabase if it's a Supabase URL
    if (photoUrl && photoUrl.includes('supabase')) {
      await deleteMedia(photoUrl);
    }
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

          {/* Property Type Selector (only show for purchase/sale) */}
          {(formData.type === 'purchase' || formData.type === 'sale') && (
            <div>
              <label className="block text-sm font-medium text-theme-secondary mb-2">
                Property Type
              </label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, propertyType: 'residence' })}
                  className={`px-3 py-3 rounded-lg transition-all flex flex-col items-center gap-1 ${formData.propertyType === 'residence'
                    ? 'bg-green-600 text-white ring-2 ring-green-400'
                    : 'bg-theme-tertiary text-theme-secondary hover:bg-theme-secondary/50'
                    }`}
                >
                  <Home className="w-5 h-5" />
                  <span className="text-xs font-medium">Residence</span>
                </button>
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, propertyType: 'investment' })}
                  className={`px-3 py-3 rounded-lg transition-all flex flex-col items-center gap-1 ${formData.propertyType === 'investment'
                    ? 'bg-blue-600 text-white ring-2 ring-blue-400'
                    : 'bg-theme-tertiary text-theme-secondary hover:bg-theme-secondary/50'
                    }`}
                >
                  <PiggyBank className="w-5 h-5" />
                  <span className="text-xs font-medium">Investment</span>
                </button>
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, propertyType: 'holiday' })}
                  className={`px-3 py-3 rounded-lg transition-all flex flex-col items-center gap-1 ${formData.propertyType === 'holiday'
                    ? 'bg-purple-600 text-white ring-2 ring-purple-400'
                    : 'bg-theme-tertiary text-theme-secondary hover:bg-theme-secondary/50'
                    }`}
                >
                  <Palmtree className="w-5 h-5" />
                  <span className="text-xs font-medium">Holiday</span>
                </button>
              </div>
              <p className="text-xs text-theme-tertiary mt-2">
                {formData.propertyType === 'residence' && '🏠 This will update your current location and living timeline.'}
                {formData.propertyType === 'investment' && '💰 Investment properties are tracked for wealth only, not living history.'}
                {formData.propertyType === 'holiday' && '🌴 Holiday homes are tracked separately from your primary residence.'}
              </p>
            </div>
          )}

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
            <ThemedDatePicker
              selected={formData.date instanceof Date && !isNaN(formData.date.getTime()) ? formData.date : null}
              onChange={(date) => setFormData({ ...formData, date: date || new Date() })}
              placeholder="Select date"
            />
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
                    value={formData.type === 'sale' ? (formData.salePrice || '') : (formData.purchasePrice || '')}
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

          {/* People/Connections */}
          <div>
            <label className="block text-sm font-medium text-theme-secondary mb-2">
              Linked People (for connections)
            </label>
            <div className="space-y-2">
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Users className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    value={newPerson}
                    onChange={(e) => {
                      setNewPerson(e.target.value);
                      setShowPeopleDropdown(e.target.value.length > 0);
                    }}
                    onFocus={() => setShowPeopleDropdown(true)}
                    onBlur={() => setTimeout(() => setShowPeopleDropdown(false), 200)}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        if (newPerson.trim() && !formData.people.includes(newPerson.trim())) {
                          setFormData({ ...formData, people: [...formData.people, newPerson.trim()] });
                          setNewPerson('');
                          setShowPeopleDropdown(false);
                        }
                      }
                    }}
                    className="w-full pl-10 pr-3 py-2 border border-theme rounded-lg bg-theme-primary text-theme-primary focus:outline-none focus:ring-2 focus:ring-primary-500"
                    placeholder="Search or add a person..."
                  />

                  {/* Autocomplete Dropdown */}
                  {showPeopleDropdown && (
                    <div className="absolute z-10 mt-1 w-full bg-theme-primary border border-theme rounded-lg shadow-lg max-h-48 overflow-y-auto">
                      {existingPeople
                        .filter(person =>
                          person.toLowerCase().includes(newPerson.toLowerCase()) &&
                          !formData.people.includes(person)
                        )
                        .slice(0, 8)
                        .map((person) => (
                          <button
                            key={person}
                            type="button"
                            onClick={() => {
                              setFormData({ ...formData, people: [...formData.people, person] });
                              setNewPerson('');
                              setShowPeopleDropdown(false);
                            }}
                            className="w-full px-4 py-2 text-left text-sm text-theme-primary hover:bg-theme-tertiary transition-colors flex items-center gap-2"
                          >
                            <Users className="w-4 h-4 text-primary-500" />
                            {person}
                          </button>
                        ))
                      }
                      {newPerson.trim() && !existingPeople.includes(newPerson.trim()) && !formData.people.includes(newPerson.trim()) && (
                        <button
                          type="button"
                          onClick={() => {
                            setFormData({ ...formData, people: [...formData.people, newPerson.trim()] });
                            setNewPerson('');
                            setShowPeopleDropdown(false);
                          }}
                          className="w-full px-4 py-2 text-left text-sm text-primary-500 hover:bg-theme-tertiary transition-colors flex items-center gap-2 border-t border-theme"
                        >
                          <Users className="w-4 h-4" />
                          Create new: "{newPerson.trim()}"
                        </button>
                      )}
                      {existingPeople.filter(p => p.toLowerCase().includes(newPerson.toLowerCase()) && !formData.people.includes(p)).length === 0 &&
                        (!newPerson.trim() || formData.people.includes(newPerson.trim())) && (
                          <div className="px-4 py-2 text-sm text-theme-tertiary">
                            Type a name to search or create
                          </div>
                        )}
                    </div>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => {
                    if (newPerson.trim() && !formData.people.includes(newPerson.trim())) {
                      setFormData({ ...formData, people: [...formData.people, newPerson.trim()] });
                      setNewPerson('');
                    }
                  }}
                  className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
                >
                  Add
                </button>
              </div>
              {formData.people.map((person, index) => (
                <div key={index} className="flex items-center gap-2 p-2 bg-theme-tertiary rounded">
                  <Users className="w-4 h-4 text-primary-500" />
                  <span className="flex-1 text-sm text-theme-tertiary">{person}</span>
                  <button
                    type="button"
                    onClick={() => {
                      setFormData({ ...formData, people: formData.people.filter((_, i) => i !== index) });
                    }}
                    className="text-red-500 hover:text-red-700"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
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
              placeholder="Describe this home event..."
            />
          </div>

          {/* Photos */}
          <div>
            <label className="block text-sm font-medium text-theme-secondary mb-2">
              Photos
              {isUploadingPhoto && (
                <span className="ml-2 inline-flex items-center text-primary-500">
                  <Loader2 className="w-4 h-4 animate-spin mr-1" />
                  Uploading...
                </span>
              )}
            </label>
            <div className="space-y-2">
              {formData.photos.map((photo, index) => (
                <div key={index} className="flex items-start gap-3 p-3 bg-theme-tertiary rounded-lg border border-theme group hover:border-primary-500/50 transition-colors">
                  {/* Show thumbnail if it's an image URL */}
                  {(photo.match(/\.(jpg|jpeg|png|gif|webp)/i) || photo.includes('supabase')) ? (
                    <img
                      src={photo}
                      alt={`Photo ${index + 1}`}
                      className="w-12 h-12 object-cover rounded-lg flex-shrink-0"
                      onError={(e) => {
                        e.currentTarget.style.display = 'none';
                      }}
                    />
                  ) : (
                    <div className="mt-1">
                      <Camera className="w-4 h-4 text-gray-400" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-theme-tertiary break-all leading-relaxed line-clamp-2">
                      {photo}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => removePhoto(index)}
                    className="p-1 text-gray-400 hover:text-red-500 hover:bg-red-500/10 rounded transition-all"
                    title="Remove photo"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}

              {/* Upload buttons */}
              <div className="flex gap-2">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleFileUpload}
                  className="hidden"
                  disabled={isUploadingPhoto}
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploadingPhoto}
                  className="flex-1 py-2 border-2 border-dashed border-theme rounded-lg text-slate-500 dark:text-slate-400 hover:border-primary-500 hover:text-primary-500 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {isUploadingPhoto ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Upload className="w-4 h-4" />
                  )}
                  Upload Photo
                </button>
                <button
                  type="button"
                  onClick={addPhotoUrl}
                  disabled={isUploadingPhoto}
                  className="px-4 py-2 border-2 border-dashed border-theme rounded-lg text-slate-500 dark:text-slate-400 hover:border-primary-500 hover:text-primary-500 transition-colors flex items-center gap-2 disabled:opacity-50"
                >
                  <Link className="w-4 h-4" />
                  Add URL
                </button>
              </div>
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
