import React, { useState, useMemo } from 'react';
import { format, intervalToDuration } from 'date-fns';
import { Calendar, Clock, HeartCrack, Heart, X, Save, Share2, Sparkles, Trash2 } from 'lucide-react';
import { Relationship } from '../types';
import { useTimelineStore } from '../store/timelineStore';

// --- Integrated Milestone Constants ---
const MILESTONE_TYPES = [
    { value: 'started-dating', label: 'Started Dating', emoji: '💕' },
    { value: 'met', label: 'Met / Friends', emoji: '🤝' },
    { value: 'engaged', label: 'Engaged', emoji: '💍' },
    { value: 'married', label: 'Married', emoji: '💒' },
    { value: 'colleague', label: 'Work / Colleague', emoji: '💼' },
    { value: 'other', label: 'Other', emoji: '📍' },
] as const;

interface RelationshipFormData {
    firstName: string;
    lastName: string;
    relationshipType: string;
    notes: string;
    startDate: Date;
    endDate?: Date;
    isCurrent: boolean;
    metDateFuzzy: boolean;
}

interface RelationshipTrackerFormProps {
    onClose: () => void;
    onSubmit: (data: RelationshipFormData) => Promise<void>;
    initialData?: Relationship;
    isSubmitting?: boolean;
    onDelete?: () => Promise<void> | void;
}

export const RelationshipTrackerForm: React.FC<RelationshipTrackerFormProps> = ({
    onClose,
    onSubmit,
    initialData,
    isSubmitting = false,
    onDelete
}) => {
    // 1. Access store for Timeline generation
    const { userProfile, addStory } = useTimelineStore();

    const [formData, setFormData] = useState<RelationshipFormData>({
        firstName: initialData?.firstName || '',
        lastName: initialData?.lastName || '',
        relationshipType: initialData?.relationshipType || 'Friend',
        notes: initialData?.notes || '',
        startDate: initialData?.startDate ? new Date(initialData.startDate) : new Date(),
        endDate: initialData?.endDate ? new Date(initialData.endDate) : undefined,
        isCurrent: initialData?.isCurrent ?? true,
        metDateFuzzy: false,
    });

    // 2. New State: Timeline Synchronization
    // Default to true for new entries, false for edits (to avoid duplicating stories)
    const [addToTimeline, setAddToTimeline] = useState(!initialData);
    const [selectedMilestone, setSelectedMilestone] = useState<string>('started-dating');

    const [startDateMode, setStartDateMode] = useState<'date' | 'age'>('date');
    const [endDateMode, setEndDateMode] = useState<'date' | 'age'>('date');

    const calculateDateFromAge = (age: number): Date => {
        if (!userProfile?.birthDate) {
            const currentYear = new Date().getFullYear();
            const years = Math.floor(age);
            const months = Math.round((age - years) * 12);
            return new Date(currentYear - years, months, 1);
        }
        const birthDate = new Date(userProfile.birthDate);
        const msInYear = 365.25 * 24 * 60 * 60 * 1000;
        return new Date(birthDate.getTime() + age * msInYear);
    };

    // Calculate duration string dynamically
    const durationText = useMemo(() => {
        if (!formData.startDate) return null;
        const start = new Date(formData.startDate);
        const end = formData.isCurrent ? new Date() : (formData.endDate ? new Date(formData.endDate) : new Date());

        if (isNaN(start.getTime()) || isNaN(end.getTime()) || end < start) return null;

        const duration = intervalToDuration({ start, end });
        const parts = [];
        if (duration.years) parts.push(`${duration.years}y`);
        if (duration.months) parts.push(`${duration.months}m`);
        if (parts.length === 0) parts.push('Less than a month');

        return parts.join(' ');
    }, [formData.startDate, formData.endDate, formData.isCurrent]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        // Step A: Save the Person (Connection)
        await onSubmit(formData);

        // Step B: Generate the Timeline Story (Heart/Event)
        if (addToTimeline) {
            const fullName = `${formData.firstName} ${formData.lastName}`.trim();
            const milestone = MILESTONE_TYPES.find(m => m.value === selectedMilestone);

            // Construct a smart title based on selection
            let title = `Relationship with ${fullName}`;
            if (selectedMilestone === 'met') title = `Met ${fullName}`;
            if (selectedMilestone === 'married') title = `Married ${fullName}`;
            if (selectedMilestone === 'colleague') title = `Worked with ${fullName}`;

            await addStory({
                title: title,
                content: formData.notes || `Timeline entry for ${fullName} (${milestone?.label})`,
                type: 'long', // 'long' type ensures the End Date renders as a visual range on the timeline
                date: formData.startDate,
                endDate: formData.isCurrent ? undefined : formData.endDate,
                tags: ['relationship', 'connection', selectedMilestone, formData.relationshipType.toLowerCase()],
                people: [fullName],
                importance: 'high',
                metadata: {
                    generatedFromRelationship: true,
                    milestoneType: selectedMilestone,
                    personName: fullName
                }
            });
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-theme-primary rounded-lg shadow-xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-theme bg-theme-primary sticky top-0 z-10">
                    <h3 className="text-xl font-bold text-theme-primary">
                        {initialData ? 'Edit Person' : 'Add Person'}
                    </h3>
                    <button onClick={onClose} className="text-gray-400 hover:text-theme-tertiary transition-colors">
                        <X className="w-6 h-6" />
                    </button>
                </div>

                {/* Scrollable Content */}
                <div className="p-6 space-y-6 overflow-y-auto flex-1">

                    {/* Status Toggle */}
                    <div className="flex items-center justify-between bg-theme-tertiary p-3 rounded-lg">
                        <span className="text-sm font-medium text-theme-primary">Status</span>
                        <button
                            type="button"
                            onClick={() => setFormData({ ...formData, isCurrent: !formData.isCurrent })}
                            className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-colors ${formData.isCurrent
                                ? 'bg-green-500/20 text-green-600 border border-green-200 dark:border-green-800'
                                : 'bg-red-500/20 text-red-600 border border-red-200 dark:border-red-800'
                                }`}
                        >
                            {formData.isCurrent ? <Heart className="w-4 h-4 fill-current" /> : <HeartCrack className="w-4 h-4" />}
                            {formData.isCurrent ? 'Active' : 'Ended'}
                        </button>
                    </div>

                    {/* Name Inputs */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-theme-secondary mb-1">First Name</label>
                            <input
                                type="text"
                                value={formData.firstName}
                                onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                                className="w-full px-3 py-2 border border-theme rounded-md bg-theme-primary text-theme-primary focus:outline-none focus:ring-2 focus:ring-primary-500"
                                placeholder="First Name"
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-theme-secondary mb-1">Last Name</label>
                            <input
                                type="text"
                                value={formData.lastName}
                                onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                                className="w-full px-3 py-2 border border-theme rounded-md bg-theme-primary text-theme-primary focus:outline-none focus:ring-2 focus:ring-primary-500"
                                placeholder="Last Name"
                            />
                        </div>
                    </div>

                    {/* Timeline Sync Section (The "Multiple Selections" Unification) */}
                    <div className="bg-primary-500/5 border border-primary-500/20 rounded-lg p-4 space-y-4">
                        <label className="flex items-center gap-3 cursor-pointer">
                            <input
                                type="checkbox"
                                checked={addToTimeline}
                                onChange={(e) => setAddToTimeline(e.target.checked)}
                                className="w-4 h-4 text-primary-600 rounded border-gray-300 focus:ring-primary-500"
                            />
                            <div className="flex items-center gap-2 font-medium text-theme-primary">
                                <Share2 className="w-4 h-4" />
                                Add this to Timeline
                            </div>
                        </label>

                        {/* Only show selections if Sync is on */}
                        {addToTimeline && (
                            <div className="animate-fade-in pl-7">
                                <label className="block text-xs font-medium text-theme-secondary mb-2">
                                    What kind of story is this?
                                </label>
                                <div className="grid grid-cols-2 gap-2">
                                    {MILESTONE_TYPES.map((type) => (
                                        <button
                                            key={type.value}
                                            type="button"
                                            onClick={() => {
                                                setSelectedMilestone(type.value);
                                                // Auto-set relationship type text based on selection for convenience
                                                setFormData(prev => ({ ...prev, relationshipType: type.label }));
                                            }}
                                            className={`px-2 py-2 rounded-md text-xs flex items-center gap-2 border transition-all ${selectedMilestone === type.value
                                                ? 'bg-primary-600 text-white border-primary-600 shadow-sm'
                                                : 'bg-theme-primary text-theme-secondary border-theme hover:border-primary-400'
                                                }`}
                                        >
                                            <span>{type.emoji}</span>
                                            <span>{type.label}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Dates & Duration */}
                    <div className="space-y-4 pt-2 border-t border-theme">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {/* Start Date */}
                            <div>
                                <label className="block text-sm font-medium mb-1 text-theme-secondary">Start Date</label>
                                <div className="flex gap-2 mb-2">
                                    <button
                                        type="button"
                                        onClick={() => setStartDateMode('date')}
                                        className={`px-2 py-1 rounded text-xs font-medium transition-colors ${startDateMode === 'date'
                                            ? 'bg-primary-600 text-white'
                                            : 'bg-theme-tertiary text-theme-secondary hover:text-theme-primary'
                                            }`}
                                    >
                                        Exact Date
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setStartDateMode('age')}
                                        className={`px-2 py-1 rounded text-xs font-medium transition-colors ${startDateMode === 'age'
                                            ? 'bg-primary-600 text-white'
                                            : 'bg-theme-tertiary text-theme-secondary hover:text-theme-primary'
                                            }`}
                                    >
                                        Age
                                    </button>
                                </div>

                                {startDateMode === 'date' ? (
                                    <div className="relative">
                                        <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                        <input
                                            type="date"
                                            value={formData.startDate ? format(formData.startDate, 'yyyy-MM-dd') : ''}
                                            onChange={(e) => setFormData({ ...formData, startDate: new Date(e.target.value) })}
                                            className="w-full pl-10 pr-3 py-2 border border-theme rounded-md bg-theme-primary text-theme-primary focus:outline-none focus:ring-2 focus:ring-primary-500"
                                        />
                                    </div>
                                ) : (
                                    <div className="space-y-1">
                                        <input
                                            type="number"
                                            min="0"
                                            max="120"
                                            step="0.1"
                                            placeholder="Age (e.g. 14)"
                                            className="w-full px-3 py-2 border border-theme rounded-md bg-theme-primary text-theme-primary focus:outline-none focus:ring-2 focus:ring-primary-500"
                                            onChange={(e) => {
                                                if (e.target.value) {
                                                    const date = calculateDateFromAge(parseFloat(e.target.value));
                                                    setFormData({ ...formData, startDate: date });
                                                }
                                            }}
                                        />
                                        {formData.startDate && (
                                            <div className="text-xs text-theme-tertiary">
                                                Calculated: {format(formData.startDate, 'MMM yyyy')}
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>

                            {/* End Date (Condition: Not Current) */}
                            {!formData.isCurrent && (
                                <div className="animate-fade-in">
                                    <label className="block text-sm font-medium mb-1 text-theme-secondary">End Date</label>
                                    <div className="flex gap-2 mb-2">
                                        <button
                                            type="button"
                                            onClick={() => setEndDateMode('date')}
                                            className={`px-2 py-1 rounded text-xs font-medium transition-colors ${endDateMode === 'date'
                                                ? 'bg-primary-600 text-white'
                                                : 'bg-theme-tertiary text-theme-secondary hover:text-theme-primary'
                                                }`}
                                        >
                                            Exact Date
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setEndDateMode('age')}
                                            className={`px-2 py-1 rounded text-xs font-medium transition-colors ${endDateMode === 'age'
                                                ? 'bg-primary-600 text-white'
                                                : 'bg-theme-tertiary text-theme-secondary hover:text-theme-primary'
                                                }`}
                                        >
                                            Age
                                        </button>
                                    </div>

                                    {endDateMode === 'date' ? (
                                        <div className="relative">
                                            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                            <input
                                                type="date"
                                                value={formData.endDate ? format(formData.endDate, 'yyyy-MM-dd') : ''}
                                                onChange={(e) => setFormData({ ...formData, endDate: new Date(e.target.value) })}
                                                className="w-full pl-10 pr-3 py-2 border border-theme rounded-md bg-theme-primary text-theme-primary focus:outline-none focus:ring-2 focus:ring-primary-500"
                                            />
                                        </div>
                                    ) : (
                                        <div className="space-y-1">
                                            <input
                                                type="number"
                                                min="0"
                                                max="120"
                                                step="0.1"
                                                placeholder="Age (e.g. 17)"
                                                className="w-full px-3 py-2 border border-theme rounded-md bg-theme-primary text-theme-primary focus:outline-none focus:ring-2 focus:ring-primary-500"
                                                onChange={(e) => {
                                                    if (e.target.value) {
                                                        const date = calculateDateFromAge(parseFloat(e.target.value));
                                                        setFormData({ ...formData, endDate: date });
                                                    }
                                                }}
                                            />
                                            {formData.endDate && (
                                                <div className="text-xs text-theme-tertiary">
                                                    Calculated: {format(formData.endDate, 'MMM yyyy')}
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* Live Duration Readout */}
                        {durationText && (
                            <div className="flex items-center gap-2 text-sm text-theme-tertiary bg-theme-tertiary p-3 rounded-md border border-theme">
                                <Clock className="w-4 h-4 text-primary-500" />
                                <span>Duration: <strong className="text-theme-primary">{durationText}</strong></span>
                                {!formData.isCurrent && <span className="ml-auto text-xs italic text-theme-secondary">(Ended)</span>}
                            </div>
                        )}
                    </div>

                    {/* Notes */}
                    <div>
                        <label className="block text-sm font-medium text-theme-secondary mb-1">Notes / Story</label>
                        <textarea
                            value={formData.notes}
                            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                            className="w-full px-3 py-2 border border-theme rounded-md bg-theme-primary text-theme-primary focus:outline-none focus:ring-2 focus:ring-primary-500"
                            rows={3}
                            placeholder="How did you meet? What made this time special?"
                        />
                    </div>
                </div>

                {/* Footer Actions */}
                <div className="p-6 border-t border-theme bg-theme-primary sticky bottom-0">
                    <div className="flex gap-3 justify-between">
                        {/* Delete Button (Conditional) */}
                        {initialData && onDelete && (
                            <button
                                type="button"
                                onClick={onDelete}
                                className="px-4 py-2 border border-red-200 text-red-600 dark:border-red-900 dark:text-red-400 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors flex items-center gap-2"
                            >
                                <Trash2 className="w-4 h-4" />
                                <span className="hidden sm:inline">Delete</span>
                            </button>
                        )}

                        <div className="flex gap-3 flex-1 justify-end">
                            <button
                                onClick={onClose}
                                className="px-4 py-2 border border-theme text-theme-secondary rounded-lg hover:bg-theme-tertiary transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleSubmit}
                                disabled={isSubmitting || !formData.firstName}
                                className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2 font-medium shadow-sm"
                            >
                                <Save className="w-4 h-4" />
                                {isSubmitting ? 'Saving...' : 'Save Person & Story'}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
