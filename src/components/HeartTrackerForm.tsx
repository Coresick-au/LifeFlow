import React, { useState } from 'react';
import { useTimelineStore } from '../store/timelineStore';
import { format, isValid } from 'date-fns';
import { Heart, Calendar, MapPin, User, X, Save, Sparkles, Trash2 } from 'lucide-react';

interface HeartTrackerFormProps {
    onClose: () => void;
    editData?: {
        id: string;
        partnerName: string;
        milestoneType: 'started-dating' | 'engaged' | 'married' | 'separated' | 'divorced' | 'anniversary' | 'other';
        title: string;
        description: string;
        startDate: Date;
        endDate?: Date;
        location?: string;
    };
}

const MILESTONE_TYPES = [
    { value: 'started-dating', label: 'Started Dating', emoji: '💕' },
    { value: 'engaged', label: 'Engaged', emoji: '💍' },
    { value: 'married', label: 'Married', emoji: '💒' },
    { value: 'anniversary', label: 'Anniversary', emoji: '🎉' },
    { value: 'separated', label: 'Separated', emoji: '💔' },
    { value: 'divorced', label: 'Divorced', emoji: '📝' },
    { value: 'other', label: 'Other', emoji: '❤️' },
] as const;

// Helper to safely format dates
const safeFormatDate = (date: Date | undefined): string => {
    if (!date || !isValid(date)) return '';
    return format(date, 'yyyy-MM-dd');
};

export const HeartTrackerForm: React.FC<HeartTrackerFormProps> = ({ onClose, editData }) => {
    const { addStory, updateStory, deleteStory, userProfile } = useTimelineStore();
    const [formData, setFormData] = useState({
        partnerName: editData?.partnerName || '',
        milestoneType: editData?.milestoneType || 'started-dating' as typeof MILESTONE_TYPES[number]['value'],
        title: editData?.title || '',
        description: editData?.description || '',
        startDate: editData?.startDate || new Date(),
        endDate: editData?.endDate || undefined as Date | undefined,
        location: editData?.location || '',
    });
    const [isSaving, setIsSaving] = useState(false);
    const [hasEndDate, setHasEndDate] = useState(!!editData?.endDate);
    const [inputMode, setInputMode] = useState<'date' | 'age'>('date');
    const [ageValue, setAgeValue] = useState('');
    const [endInputMode, setEndInputMode] = useState<'date' | 'age'>('date');
    const [endAgeValue, setEndAgeValue] = useState('');

    // Calculate age at a specific date
    const calculateAge = (date: Date): number | null => {
        if (!userProfile?.birthDate) return null;
        const birthDate = new Date(userProfile.birthDate);
        const storyDate = date;
        const diffMs = storyDate.getTime() - birthDate.getTime();
        const age = diffMs / (365.25 * 24 * 60 * 60 * 1000);
        return Math.max(0, Math.round(age * 10) / 10);
    };

    // Calculate date from age
    const calculateDateFromAge = (age: number): Date => {
        if (!userProfile?.birthDate) {
            // Fallback: use current year minus age
            const currentYear = new Date().getFullYear();
            const years = Math.floor(age);
            const months = Math.round((age - years) * 12);
            return new Date(currentYear - years, months, 1);
        }

        const birthDate = new Date(userProfile.birthDate);
        const msInYear = 365.25 * 24 * 60 * 60 * 1000;
        return new Date(birthDate.getTime() + age * msInYear);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.partnerName.trim()) return;

        setIsSaving(true);
        try {
            const milestoneInfo = MILESTONE_TYPES.find(m => m.value === formData.milestoneType);

            // Auto-generate title if empty
            const autoTitle = formData.title.trim() ||
                `${milestoneInfo?.label || 'Milestone'} with ${formData.partnerName}`;

            const storyData = {
                title: autoTitle,
                content: formData.description,
                type: 'long' as const,
                date: formData.startDate,
                endDate: hasEndDate ? formData.endDate : undefined,
                tags: ['relationship', 'partner', 'love', formData.milestoneType, formData.partnerName.toLowerCase()],
                people: [formData.partnerName],
                importance: 'high' as const,
                location: formData.location || undefined,
                mood: formData.milestoneType === 'separated' || formData.milestoneType === 'divorced'
                    ? 'sad' as const
                    : 'happy' as const,
                metadata: {
                    partnerName: formData.partnerName,
                    milestoneType: formData.milestoneType,
                    eventType: 'heart',
                    hasDateRange: hasEndDate,
                }
            };

            if (editData) {
                await updateStory(editData.id, storyData);
            } else {
                await addStory(storyData);
            }

            onClose();
        } catch (error) {
            console.error('Failed to save heart milestone:', error);
        } finally {
            setIsSaving(false);
        }
    };

    const handleDelete = async () => {
        if (!editData || !window.confirm('Are you sure you want to delete this memory? This action cannot be undone.')) {
            return;
        }

        setIsSaving(true);
        try {
            await deleteStory(editData.id);
            onClose();
        } catch (error) {
            console.error('Failed to delete story:', error);
            setIsSaving(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-theme-primary rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                <div className="sticky top-0 bg-theme-primary border-b border-theme px-6 py-4 flex items-center justify-between">
                    <h2 className="text-xl font-semibold text-theme-primary flex items-center gap-2">
                        <Heart className="w-5 h-5 text-pink-500" />
                        {editData ? 'Edit Heart Milestone' : 'Add Heart Milestone'}
                    </h2>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-theme-tertiary"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-6">
                    {/* Partner Name */}
                    <div>
                        <label className="block text-sm font-medium text-theme-secondary mb-2">
                            Partner's Name *
                        </label>
                        <div className="relative">
                            <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                            <input
                                type="text"
                                value={formData.partnerName}
                                onChange={(e) => setFormData({ ...formData, partnerName: e.target.value })}
                                className="w-full pl-10 pr-3 py-2 border border-theme rounded-lg bg-theme-primary text-theme-primary focus:outline-none focus:ring-2 focus:ring-pink-500"
                                placeholder="Their name"
                                required
                            />
                        </div>
                    </div>

                    {/* Milestone Type */}
                    <div>
                        <label className="block text-sm font-medium text-theme-secondary mb-2">
                            What happened?
                        </label>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                            {MILESTONE_TYPES.map((type) => (
                                <button
                                    key={type.value}
                                    type="button"
                                    onClick={() => setFormData({ ...formData, milestoneType: type.value })}
                                    className={`px-3 py-2 rounded-lg transition-colors flex items-center justify-center gap-1 text-sm ${formData.milestoneType === type.value
                                        ? 'bg-pink-600 text-white'
                                        : 'bg-theme-tertiary text-theme-secondary hover:opacity-80'
                                        }`}
                                >
                                    <span>{type.emoji}</span>
                                    <span>{type.label}</span>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Title (optional) */}
                    <div>
                        <label className="block text-sm font-medium text-theme-secondary mb-2">
                            Title (optional)
                        </label>
                        <input
                            type="text"
                            value={formData.title}
                            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                            className="w-full px-3 py-2 border border-theme rounded-lg bg-theme-primary text-theme-primary focus:outline-none focus:ring-2 focus:ring-pink-500"
                            placeholder="Leave blank to auto-generate"
                        />
                    </div>

                    {/* Start Date */}
                    <div>
                        <label className="block text-sm font-medium text-theme-secondary mb-2">
                            When did this happen?
                        </label>

                        {/* Date/Age Mode Toggle */}
                        <div className="flex gap-2 mb-2">
                            <button
                                type="button"
                                onClick={() => setInputMode('date')}
                                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${inputMode === 'date'
                                    ? 'bg-pink-600 text-white'
                                    : 'bg-theme-tertiary text-theme-secondary hover:text-theme-primary'
                                    }`}
                            >
                                Exact Date
                            </button>
                            <button
                                type="button"
                                onClick={() => setInputMode('age')}
                                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${inputMode === 'age'
                                    ? 'bg-pink-600 text-white'
                                    : 'bg-theme-tertiary text-theme-secondary hover:text-theme-primary'
                                    }`}
                            >
                                I Was Age...
                            </button>
                        </div>

                        {/* Conditional input based on mode */}
                        {inputMode === 'date' ? (
                            <div className="relative">
                                <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                                <input
                                    type="date"
                                    value={safeFormatDate(formData.startDate)}
                                    onChange={(e) => setFormData({ ...formData, startDate: new Date(e.target.value) })}
                                    className="w-full pl-10 pr-3 py-2 border border-theme rounded-lg bg-theme-primary text-theme-primary focus:outline-none focus:ring-2 focus:ring-pink-500"
                                />
                            </div>
                        ) : (
                            <div className="space-y-2">
                                <input
                                    type="number"
                                    min="0"
                                    max="150"
                                    step="0.1"
                                    placeholder="Enter your age (e.g., 25.5)"
                                    value={ageValue}
                                    onChange={(e) => {
                                        setAgeValue(e.target.value);
                                        if (e.target.value) {
                                            const calculatedDate = calculateDateFromAge(parseFloat(e.target.value));
                                            setFormData({ ...formData, startDate: calculatedDate });
                                        }
                                    }}
                                    className="w-full px-3 py-2 border border-theme rounded-lg bg-theme-primary text-theme-primary focus:outline-none focus:ring-2 focus:ring-pink-500"
                                />
                                {ageValue && formData.startDate && isValid(formData.startDate) && (
                                    <p className="text-xs text-theme-tertiary">
                                        📅 Approximate date: {format(formData.startDate, 'MMMM yyyy')}
                                    </p>
                                )}
                            </div>
                        )}

                        {/* Age display when in date mode */}
                        {inputMode === 'date' && formData.startDate && isValid(formData.startDate) && calculateAge(formData.startDate) !== null && (
                            <p className="mt-1 text-xs text-theme-tertiary">
                                You were {calculateAge(formData.startDate)} years old
                            </p>
                        )}
                    </div>

                    {/* End Date (for relationships that ended) */}
                    {(formData.milestoneType === 'started-dating' || formData.milestoneType === 'married') && (
                        <div>
                            <div className="flex items-center justify-between mb-2">
                                <label className="text-sm font-medium text-theme-secondary">
                                    End Date (if applicable)
                                </label>
                                <label className="flex items-center">
                                    <input
                                        type="checkbox"
                                        checked={!hasEndDate}
                                        onChange={(e) => setHasEndDate(!e.target.checked)}
                                        className="mr-2"
                                    />
                                    <span className="text-sm text-theme-tertiary">Still together</span>
                                </label>
                            </div>
                            {hasEndDate && (
                                <>
                                    {/* End Date/Age Mode Toggle */}
                                    <div className="flex gap-2 mb-2">
                                        <button
                                            type="button"
                                            onClick={() => setEndInputMode('date')}
                                            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${endInputMode === 'date'
                                                ? 'bg-pink-600 text-white'
                                                : 'bg-theme-tertiary text-theme-secondary hover:text-theme-primary'
                                                }`}
                                        >
                                            Exact Date
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setEndInputMode('age')}
                                            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${endInputMode === 'age'
                                                ? 'bg-pink-600 text-white'
                                                : 'bg-theme-tertiary text-theme-secondary hover:text-theme-primary'
                                                }`}
                                        >
                                            I Was Age...
                                        </button>
                                    </div>

                                    {/* Conditional end date input */}
                                    {endInputMode === 'date' ? (
                                        <div className="relative">
                                            <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                                            <input
                                                type="date"
                                                value={safeFormatDate(formData.endDate)}
                                                onChange={(e) => setFormData({ ...formData, endDate: e.target.value ? new Date(e.target.value) : undefined })}
                                                className="w-full pl-10 pr-3 py-2 border border-theme rounded-lg bg-theme-primary text-theme-primary focus:outline-none focus:ring-2 focus:ring-pink-500"
                                            />
                                        </div>
                                    ) : (
                                        <div className="space-y-2">
                                            <input
                                                type="number"
                                                min="0"
                                                max="150"
                                                step="0.1"
                                                placeholder="Enter your age (e.g., 30.5)"
                                                value={endAgeValue}
                                                onChange={(e) => {
                                                    setEndAgeValue(e.target.value);
                                                    if (e.target.value) {
                                                        const calculatedDate = calculateDateFromAge(parseFloat(e.target.value));
                                                        setFormData({ ...formData, endDate: calculatedDate });
                                                    }
                                                }}
                                                className="w-full px-3 py-2 border border-theme rounded-lg bg-theme-primary text-theme-primary focus:outline-none focus:ring-2 focus:ring-pink-500"
                                            />
                                            {endAgeValue && formData.endDate && isValid(formData.endDate) && (
                                                <p className="text-xs text-theme-tertiary">
                                                    📅 Approximate date: {format(formData.endDate, 'MMMM yyyy')}
                                                </p>
                                            )}
                                        </div>
                                    )}

                                    {/* Age display when in date mode */}
                                    {endInputMode === 'date' && formData.endDate && isValid(formData.endDate) && calculateAge(formData.endDate) !== null && (
                                        <p className="mt-1 text-xs text-theme-tertiary">
                                            You were {calculateAge(formData.endDate)} years old
                                        </p>
                                    )}
                                </>
                            )}
                        </div>
                    )}

                    {/* Location (optional) */}
                    <div>
                        <label className="block text-sm font-medium text-theme-secondary mb-2">
                            Where? (optional)
                        </label>
                        <div className="relative">
                            <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                            <input
                                type="text"
                                value={formData.location}
                                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                                className="w-full pl-10 pr-3 py-2 border border-theme rounded-lg bg-theme-primary text-theme-primary focus:outline-none focus:ring-2 focus:ring-pink-500"
                                placeholder="e.g., Paris, The coffee shop"
                            />
                        </div>
                    </div>

                    {/* Description */}
                    <div>
                        <label className="block text-sm font-medium text-theme-secondary mb-2">
                            Tell the story
                        </label>
                        <textarea
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            rows={4}
                            className="w-full px-3 py-2 border border-theme rounded-lg bg-theme-primary text-theme-primary focus:outline-none focus:ring-2 focus:ring-pink-500"
                            placeholder="How did you meet? What made this moment special?"
                        />
                    </div>

                    {/* Actions */}
                    <div className="flex gap-3 pt-4 border-t border-theme justify-between">
                        {editData && (
                            <button
                                type="button"
                                onClick={handleDelete}
                                className="px-4 py-2 border border-red-200 text-red-600 dark:border-red-900 dark:text-red-400 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors flex items-center gap-2"
                            >
                                <Trash2 className="w-4 h-4" />
                                <span className="hidden sm:inline">Delete</span>
                            </button>
                        )}
                        <div className="flex gap-3 flex-1 justify-end">
                            <button
                                type="button"
                                onClick={onClose}
                                className="px-4 py-2 border border-theme text-theme-secondary rounded-lg hover:bg-theme-tertiary transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={isSaving || !formData.partnerName.trim()}
                                className="px-4 py-2 bg-pink-600 text-white rounded-lg hover:bg-pink-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
                            >
                                <Save className="w-4 h-4" />
                                {isSaving ? 'Saving...' : 'Save'}
                            </button>
                        </div>
                    </div>
                </form>
            </div>
        </div>
    );
};
