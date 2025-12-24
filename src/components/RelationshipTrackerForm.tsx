import React, { useState, useMemo, useEffect } from 'react';
import { format, intervalToDuration, addYears, addMonths, isValid } from 'date-fns';
import { Calendar, Clock, X, Save, Share2, Trash2, UserCheck, UserX } from 'lucide-react';
import { Relationship } from '../types';
import { useTimelineStore } from '../store/timelineStore';
import { ThemedDatePicker } from './ThemedDatePicker';

// --- Relationship Categories and Subtypes ---
const RELATIONSHIP_CATEGORIES = [
    { value: 'family', label: 'Family', emoji: '👨‍👩‍👧' },
    { value: 'romantic', label: 'Romantic', emoji: '💑' },
    { value: 'social', label: 'Social', emoji: '👋' },
    { value: 'work', label: 'Work', emoji: '💼' },
] as const;

const RELATIONSHIP_SUBTYPES: Record<string, Array<{ value: string; label: string; emoji: string }>> = {
    family: [
        { value: 'parent', label: 'Parent', emoji: '👨‍👩' },
        { value: 'sibling', label: 'Sibling', emoji: '👫' },
        { value: 'child', label: 'Child', emoji: '👶' },
        { value: 'grandparent', label: 'Grandparent', emoji: '👴' },
        { value: 'cousin', label: 'Cousin', emoji: '🧑‍🤝‍🧑' },
        { value: 'aunt-uncle', label: 'Aunt / Uncle', emoji: '🧑' },
        { value: 'in-law', label: 'In-Law', emoji: '💒' },
        { value: 'step', label: 'Step-Family', emoji: '👪' },
    ],
    romantic: [
        { value: 'dating', label: 'Dating', emoji: '💑' },
        { value: 'engaged', label: 'Engaged', emoji: '💍' },
        { value: 'married', label: 'Married', emoji: '💒' },
        { value: 'partner', label: 'Partner', emoji: '❤️' },
    ],
    social: [
        { value: 'friend', label: 'Friend', emoji: '👋' },
        { value: 'acquaintance', label: 'Acquaintance', emoji: '🤝' },
    ],
    work: [
        { value: 'colleague', label: 'Colleague', emoji: '💼' },
        { value: 'manager', label: 'Manager', emoji: '👔' },
        { value: 'mentor', label: 'Mentor', emoji: '🎓' },
    ],
};

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

    const [addToTimeline, setAddToTimeline] = useState(!initialData);
    const [selectedCategory, setSelectedCategory] = useState<string>('social');
    const [selectedSubtype, setSelectedSubtype] = useState<string>('friend');

    // New State: Decouple the "Phase/Event" end from the "Person" end
    // Sync with initialData.isCurrent as well as endDate
    const [eventHasEnded, setEventHasEnded] = useState(
        !!initialData?.endDate || initialData?.isCurrent === false
    );

    const [startDateMode, setStartDateMode] = useState<'date' | 'age'>('date');
    const [endDateMode, setEndDateMode] = useState<'date' | 'age' | 'duration'>('date');

    const [durationYears, setDurationYears] = useState<number>(0);
    const [durationMonths, setDurationMonths] = useState<number>(0);

    // Safe date formatting helper
    const safeFormatDate = (date: Date | undefined): string => {
        if (!date || !isValid(date)) return '';
        return format(date, 'yyyy-MM-dd');
    };

    // Sync eventHasEnded with initial data if editing
    useEffect(() => {
        if (initialData?.endDate || initialData?.isCurrent === false) {
            setEventHasEnded(true);
        }
    }, [initialData]);

    // Update duration inputs when dates change externally
    useEffect(() => {
        if (formData.startDate && formData.endDate && eventHasEnded) {
            const duration = intervalToDuration({
                start: formData.startDate,
                end: formData.endDate
            });
            setDurationYears(duration.years || 0);
            setDurationMonths(duration.months || 0);
        }
    }, [formData.startDate, formData.endDate, eventHasEnded]);

    const handleDurationChange = (years: number, months: number) => {
        setDurationYears(years);
        setDurationMonths(months);

        if (formData.startDate) {
            let newEndDate = addYears(formData.startDate, years);
            newEndDate = addMonths(newEndDate, months);
            setFormData(prev => ({ ...prev, endDate: newEndDate }));
        }
    };

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

    const durationText = useMemo(() => {
        if (!formData.startDate) return null;
        const start = new Date(formData.startDate);
        const end = eventHasEnded ? (formData.endDate ? new Date(formData.endDate) : new Date()) : new Date();

        if (isNaN(start.getTime()) || isNaN(end.getTime()) || end < start) return null;

        const duration = intervalToDuration({ start, end });
        const parts = [];
        if (duration.years) parts.push(`${duration.years}y`);
        if (duration.months) parts.push(`${duration.months}m`);
        if (parts.length === 0) parts.push('Less than a month');

        return parts.join(' ');
    }, [formData.startDate, formData.endDate, eventHasEnded]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        // 1. Connection Logic (For the "Friends/Connections" List)
        // CRITICAL FIX: If eventHasEnded is true OR isCurrent is false, save the endDate
        const shouldHaveEndDate = eventHasEnded || !formData.isCurrent;
        const personDataToSave = {
            ...formData,
            isCurrent: formData.isCurrent,
            endDate: shouldHaveEndDate ? (formData.endDate || new Date()) : undefined
        };
        await onSubmit(personDataToSave);

        // 2. Timeline Logic (For the Gantt Chart / Timeline)
        // ONLY create a new story for NEW relationships, not edits
        if (addToTimeline && !initialData) {
            const fullName = `${formData.firstName} ${formData.lastName}`.trim();
            const subtypes = RELATIONSHIP_SUBTYPES[selectedCategory] || [];
            const subtype = subtypes.find(s => s.value === selectedSubtype);

            // Construct title based on category and subtype
            let title = `Relationship with ${fullName}`;
            if (selectedCategory === 'family') {
                title = `${subtype?.label || 'Family'}: ${fullName}`;
            } else if (selectedCategory === 'social') {
                title = `Known ${fullName}`;
            } else if (selectedCategory === 'romantic') {
                if (selectedSubtype === 'married') title = `Marriage to ${fullName}`;
                else if (selectedSubtype === 'engaged') title = `Engaged to ${fullName}`;
                else title = `Relationship with ${fullName}`;
            } else if (selectedCategory === 'work') {
                title = `Worked with ${fullName}`;
            }

            // Determine tags based on category
            const categoryTag = selectedCategory === 'family' ? 'family' : 'relationship';

            // Create ONE continuous story
            await addStory({
                title: title,
                content: formData.notes || `${subtype?.label || selectedCategory} connection with ${fullName}`,
                type: 'long', // CRITICAL: 'long' tells the system this is a span, not a point
                date: formData.startDate,
                // If the phase ended, we save the end date.
                // If it hasn't ended, we leave it undefined (so it shows as "Ongoing" in Gantt)
                endDate: eventHasEnded ? formData.endDate : undefined,
                tags: [categoryTag, 'connection', selectedCategory, selectedSubtype, formData.relationshipType.toLowerCase()],
                people: [fullName],
                importance: selectedCategory === 'family' ? 'high' : 'medium',
                metadata: {
                    generatedFromRelationship: true,
                    category: selectedCategory,
                    subtype: selectedSubtype,
                    personName: fullName
                }
            });
        }
    };

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-theme-primary rounded-xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh] border border-theme">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-theme bg-theme-primary sticky top-0 z-10">
                    <h3 className="text-xl font-bold text-theme-primary flex items-center gap-2">
                        {initialData ? 'Edit Relationship' : 'Add Relationship'}
                    </h3>
                    <button onClick={onClose} className="text-gray-400 hover:text-theme-tertiary transition-colors">
                        <X className="w-6 h-6" />
                    </button>
                </div>

                {/* Scrollable Content */}
                <div className="p-6 space-y-6 overflow-y-auto flex-1 custom-scrollbar">

                    {/* Connection Status Toggle */}
                    <div className="flex items-center justify-between bg-theme-tertiary p-4 rounded-lg border border-theme">
                        <div className="flex flex-col">
                            <span className="text-sm font-bold text-theme-primary">Current Connection</span>
                            <span className="text-xs text-theme-secondary">Are you still in contact?</span>
                        </div>
                        <div className="flex bg-theme-primary rounded-full p-1 border border-theme">
                            <button
                                type="button"
                                onClick={() => setFormData({ ...formData, isCurrent: true })}
                                className={`flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-medium transition-all ${formData.isCurrent
                                    ? 'bg-green-500/10 text-green-600 shadow-sm'
                                    : 'text-theme-secondary hover:text-theme-primary'
                                    }`}
                            >
                                <UserCheck className="w-4 h-4" />
                                Active
                            </button>
                            <button
                                type="button"
                                onClick={() => {
                                    // Set isCurrent to false and mark event as ended
                                    setFormData(prev => ({
                                        ...prev,
                                        isCurrent: false,
                                        // Set default endDate to today if not already set
                                        endDate: prev.endDate || new Date()
                                    }));
                                    setEventHasEnded(true);
                                }}
                                className={`flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-medium transition-all ${!formData.isCurrent
                                    ? 'bg-red-500/10 text-red-600 shadow-sm'
                                    : 'text-theme-secondary hover:text-theme-primary'
                                    }`}
                            >
                                <UserX className="w-4 h-4" />
                                No Contact
                            </button>
                        </div>
                    </div>

                    {/* Name Inputs */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs uppercase font-bold text-theme-secondary mb-1.5">First Name</label>
                            <input
                                type="text"
                                value={formData.firstName}
                                onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                                className="w-full px-3 py-2 border border-theme rounded-lg bg-theme-primary text-theme-primary focus:outline-none focus:ring-2 focus:ring-primary-500 transition-shadow"
                                placeholder=""
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-xs uppercase font-bold text-theme-secondary mb-1.5">Last Name</label>
                            <input
                                type="text"
                                value={formData.lastName}
                                onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                                className="w-full px-3 py-2 border border-theme rounded-lg bg-theme-primary text-theme-primary focus:outline-none focus:ring-2 focus:ring-primary-500 transition-shadow"
                                placeholder=""
                            />
                        </div>
                    </div>

                    {/* Timeline Event Section */}
                    <div className="bg-primary-500/5 border border-primary-500/20 rounded-lg p-4 space-y-4">
                        <label className="flex items-center gap-3 cursor-pointer group">
                            <input
                                type="checkbox"
                                checked={addToTimeline}
                                onChange={(e) => setAddToTimeline(e.target.checked)}
                                className="w-4 h-4 text-primary-600 rounded border-gray-300 focus:ring-primary-500 cursor-pointer"
                            />
                            <div className="flex items-center gap-2 font-medium text-theme-primary group-hover:text-primary-600 transition-colors">
                                <Share2 className="w-4 h-4" />
                                Create Timeline Span
                            </div>
                        </label>

                        {/* Category Selection */}
                        <div className="animate-fade-in">
                            <label className="block text-xs font-medium text-theme-secondary mb-2">
                                What category?
                            </label>
                            <div className="grid grid-cols-4 gap-2 mb-4">
                                {RELATIONSHIP_CATEGORIES.map((cat) => (
                                    <button
                                        key={cat.value}
                                        type="button"
                                        onClick={() => {
                                            setSelectedCategory(cat.value);
                                            // Set default subtype for new category
                                            const subtypes = RELATIONSHIP_SUBTYPES[cat.value];
                                            if (subtypes && subtypes.length > 0) {
                                                setSelectedSubtype(subtypes[0].value);
                                                setFormData(prev => ({ ...prev, relationshipType: subtypes[0].label }));
                                            }
                                        }}
                                        className={`px-2 py-2.5 rounded-lg text-xs flex flex-col items-center gap-1 border transition-all ${selectedCategory === cat.value
                                            ? 'bg-primary-600 text-white border-primary-600 shadow-md transform scale-[1.02]'
                                            : 'bg-theme-primary text-theme-secondary border-theme hover:border-primary-400 hover:bg-theme-tertiary'
                                            }`}
                                    >
                                        <span className="text-lg">{cat.emoji}</span>
                                        <span>{cat.label}</span>
                                    </button>
                                ))}
                            </div>

                            {/* Subtype Selection */}
                            <label className="block text-xs font-medium text-theme-secondary mb-2">
                                Specific type?
                            </label>
                            <div className="grid grid-cols-2 gap-2">
                                {(RELATIONSHIP_SUBTYPES[selectedCategory] || []).map((subtype) => (
                                    <button
                                        key={subtype.value}
                                        type="button"
                                        onClick={() => {
                                            setSelectedSubtype(subtype.value);
                                            setFormData(prev => ({ ...prev, relationshipType: subtype.label }));
                                        }}
                                        className={`px-3 py-2 rounded-lg text-xs flex items-center gap-2 border transition-all ${selectedSubtype === subtype.value
                                            ? 'bg-primary-600 text-white border-primary-600 shadow-md'
                                            : 'bg-theme-primary text-theme-secondary border-theme hover:border-primary-400 hover:bg-theme-tertiary'
                                            }`}
                                    >
                                        <span className="text-base">{subtype.emoji}</span>
                                        <span>{subtype.label}</span>
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Dates & Duration */}
                    <div className="space-y-6 pt-2 border-t border-theme">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
                            {/* Start Date */}
                            <div>
                                <label className="block text-xs uppercase font-bold mb-1.5 text-theme-secondary">
                                    {selectedCategory === 'family' ? 'Birth Date' : 'Start Date'}
                                </label>
                                <div className="flex gap-2 mb-2">
                                    <button
                                        type="button"
                                        onClick={() => setStartDateMode('date')}
                                        className={`px-2 py-1 rounded text-xs font-medium transition-colors ${startDateMode === 'date'
                                            ? 'bg-primary-600 text-white'
                                            : 'bg-theme-tertiary text-theme-secondary hover:text-theme-primary'
                                            }`}
                                    >
                                        Date
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
                                    <ThemedDatePicker
                                        selected={formData.startDate}
                                        onChange={(date) => setFormData({ ...formData, startDate: date || new Date() })}
                                        placeholder="Select start date"
                                    />
                                ) : (
                                    <div className="space-y-1">
                                        <input
                                            type="number"
                                            min="0"
                                            max="120"
                                            step="0.1"
                                            placeholder="Age (e.g. 14)"
                                            className="w-full px-3 py-2 border border-theme rounded-lg bg-theme-primary text-theme-primary focus:outline-none focus:ring-2 focus:ring-primary-500"
                                            onChange={(e) => {
                                                if (e.target.value) {
                                                    const date = calculateDateFromAge(parseFloat(e.target.value));
                                                    setFormData({ ...formData, startDate: date });
                                                }
                                            }}
                                        />
                                        {formData.startDate && (
                                            <div className="text-xs text-theme-tertiary">
                                                {format(formData.startDate, 'MMM yyyy')}
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>

                            {/* End Date (Conditional) */}
                            <div>
                                <div className="flex items-center justify-between mb-2">
                                    <label className="block text-xs uppercase font-bold text-theme-secondary">Ended?</label>
                                    {/* Phase Ended Toggle */}
                                    <label className="flex items-center gap-2 cursor-pointer text-xs text-theme-primary">
                                        <input
                                            type="checkbox"
                                            checked={eventHasEnded}
                                            onChange={(e) => setEventHasEnded(e.target.checked)}
                                            className="rounded border-theme text-primary-600 focus:ring-primary-500"
                                        />
                                        This phase finished
                                    </label>
                                </div>

                                {eventHasEnded && (
                                    <div className="animate-fade-in p-3 bg-theme-tertiary/30 rounded-lg border border-theme/50">
                                        <div className="flex gap-1 mb-2">
                                            <button
                                                type="button"
                                                onClick={() => setEndDateMode('duration')}
                                                className={`px-2 py-1 rounded text-[10px] font-medium transition-colors ${endDateMode === 'duration'
                                                    ? 'bg-primary-600 text-white'
                                                    : 'bg-theme-tertiary text-theme-secondary hover:text-theme-primary'
                                                    }`}
                                            >
                                                Duration
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => setEndDateMode('date')}
                                                className={`px-2 py-1 rounded text-[10px] font-medium transition-colors ${endDateMode === 'date'
                                                    ? 'bg-primary-600 text-white'
                                                    : 'bg-theme-tertiary text-theme-secondary hover:text-theme-primary'
                                                    }`}
                                            >
                                                Date
                                            </button>
                                        </div>

                                        {endDateMode === 'duration' ? (
                                            <div className="flex gap-2">
                                                <div className="relative flex-1">
                                                    <input
                                                        type="number"
                                                        min="0"
                                                        placeholder="10"
                                                        value={durationYears || ''}
                                                        onChange={(e) => handleDurationChange(parseInt(e.target.value) || 0, durationMonths)}
                                                        className="w-full px-2 py-1.5 text-sm border border-theme rounded-md bg-theme-primary text-theme-primary"
                                                    />
                                                    <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-theme-secondary pointer-events-none">Yrs</span>
                                                </div>
                                                <div className="relative flex-1">
                                                    <input
                                                        type="number"
                                                        min="0"
                                                        max="11"
                                                        placeholder="0"
                                                        value={durationMonths || ''}
                                                        onChange={(e) => handleDurationChange(durationYears, parseInt(e.target.value) || 0)}
                                                        className="w-full px-2 py-1.5 text-sm border border-theme rounded-md bg-theme-primary text-theme-primary"
                                                    />
                                                    <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-theme-secondary pointer-events-none">Mos</span>
                                                </div>
                                            </div>
                                        ) : (
                                            <ThemedDatePicker
                                                selected={formData.endDate}
                                                onChange={(date) => setFormData({ ...formData, endDate: date || undefined })}
                                                placeholder="Select end date"
                                                minDate={formData.startDate}
                                            />
                                        )}
                                        {formData.endDate && endDateMode !== 'date' && (
                                            <div className="text-[10px] text-theme-tertiary mt-1 text-right">
                                                {format(formData.endDate, 'MMM yyyy')}
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Live Duration Readout (Confirmation) */}
                        {durationText && (
                            <div className="flex items-center gap-2 text-sm text-theme-tertiary bg-theme-tertiary/50 p-3 rounded-lg border border-theme/50">
                                <Clock className="w-4 h-4 text-primary-500" />
                                <span>Time: <strong className="text-theme-primary">{durationText}</strong></span>
                                {eventHasEnded && <span className="ml-auto text-xs font-medium text-theme-secondary uppercase tracking-wider">Completed</span>}
                            </div>
                        )}
                    </div>

                    {/* Notes */}
                    <div>
                        <label className="block text-xs uppercase font-bold text-theme-secondary mb-1.5">Notes / Memories</label>
                        <textarea
                            value={formData.notes}
                            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                            className="w-full px-3 py-2 border border-theme rounded-lg bg-theme-primary text-theme-primary focus:outline-none focus:ring-2 focus:ring-primary-500 transition-shadow"
                            rows={3}
                            placeholder="How did you meet? What made this time special?"
                        />
                    </div>
                </div>

                {/* Footer Actions */}
                <div className="p-6 border-t border-theme bg-theme-primary sticky bottom-0 z-10">
                    <div className="flex gap-3 justify-between">
                        {/* Delete Button */}
                        {initialData && onDelete && (
                            <button
                                type="button"
                                onClick={onDelete}
                                className="px-4 py-2 border border-red-200 text-red-600 dark:border-red-900/50 dark:text-red-400 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors flex items-center gap-2"
                            >
                                <Trash2 className="w-4 h-4" />
                                <span className="hidden sm:inline">Delete</span>
                            </button>
                        )}

                        <div className="flex gap-3 flex-1 justify-end">
                            <button
                                onClick={onClose}
                                className="px-5 py-2 border border-theme text-theme-secondary rounded-lg hover:bg-theme-tertiary transition-colors font-medium"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleSubmit}
                                disabled={isSubmitting || !formData.firstName}
                                className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2 font-medium shadow-md hover:shadow-lg transform active:scale-[0.98]"
                            >
                                <Save className="w-4 h-4" />
                                {isSubmitting ? 'Saving...' : 'Save Relationship'}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
