import React, { useState, useMemo, useEffect } from 'react';
import { format, intervalToDuration, isValid } from 'date-fns';
import { Calendar, Clock, HeartCrack, Heart, X, Save, User, MapPin } from 'lucide-react';
import { Relationship } from '../types';
import { useTimelineStore } from '../store/timelineStore';

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
}

export const RelationshipTrackerForm: React.FC<RelationshipTrackerFormProps> = ({
    onClose,
    onSubmit,
    initialData,
    isSubmitting = false
}) => {
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

    // Age Calculation Logic
    const { userProfile } = useTimelineStore();
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

        // Ensure we have valid Date objects
        const start = new Date(formData.startDate);
        const end = formData.isCurrent ? new Date() : (formData.endDate ? new Date(formData.endDate) : new Date());

        if (isNaN(start.getTime()) || isNaN(end.getTime()) || end < start) return null;

        const duration = intervalToDuration({
            start,
            end
        });

        const parts = [];
        if (duration.years) parts.push(`${duration.years}y`);
        if (duration.months) parts.push(`${duration.months}m`);
        if (parts.length === 0) parts.push('Less than a month');

        return parts.join(' ');
    }, [formData.startDate, formData.endDate, formData.isCurrent]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSubmit(formData);
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
                    {/* Active/History Toggle */}
                    <div className="flex items-center justify-between bg-theme-tertiary p-3 rounded-lg">
                        <span className="text-sm font-medium text-theme-primary">Relationship Status</span>
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

                    {/* Basic Info */}
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

                    <div>
                        <label className="block text-sm font-medium text-theme-secondary mb-1">Relationship Type</label>
                        <input
                            type="text"
                            value={formData.relationshipType}
                            onChange={(e) => setFormData({ ...formData, relationshipType: e.target.value })}
                            className="w-full px-3 py-2 border border-theme rounded-md bg-theme-primary text-theme-primary focus:outline-none focus:ring-2 focus:ring-primary-500"
                            placeholder="e.g. Partner, Friend, Colleague"
                        />
                    </div>

                    {/* Dates & Duration */}
                    <div className="space-y-4 pt-2 border-t border-theme">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium mb-1 text-theme-secondary">Start Date</label>

                                {/* Date/Age Toggle */}
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
                                        I Was Age...
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

                            {/* Conditionally show Separation Date */}
                            {!formData.isCurrent && (
                                <div className="animate-fade-in">
                                    <label className="block text-sm font-medium mb-1 text-theme-secondary">Separation Date</label>

                                    {/* End Date/Age Toggle */}
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
                                            I Was Age...
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
                                                placeholder="Age (e.g. 25.5)"
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
                                {!formData.isCurrent && <span className="ml-auto text-xs italic text-theme-secondary">(Historical)</span>}
                            </div>
                        )}
                    </div>

                    {/* Notes */}
                    <div>
                        <label className="block text-sm font-medium text-theme-secondary mb-1">Notes</label>
                        <textarea
                            value={formData.notes}
                            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                            className="w-full px-3 py-2 border border-theme rounded-md bg-theme-primary text-theme-primary focus:outline-none focus:ring-2 focus:ring-primary-500"
                            rows={3}
                            placeholder="Any additional details..."
                        />
                    </div>
                </div>

                {/* Footer Actions */}
                <div className="p-6 border-t border-theme bg-theme-primary sticky bottom-0">
                    <div className="flex gap-3">
                        <button
                            onClick={onClose}
                            className="flex-1 px-4 py-2 border border-theme text-theme-secondary rounded-lg hover:bg-theme-tertiary transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleSubmit}
                            disabled={isSubmitting || !formData.firstName}
                            className="flex-1 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2 font-medium shadow-sm"
                        >
                            <Save className="w-4 h-4" />
                            {isSubmitting ? 'Saving...' : 'Save Person'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};
