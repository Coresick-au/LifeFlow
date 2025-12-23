import React, { useState } from 'react';
import { useTimelineStore } from '../store/timelineStore';
import { format } from 'date-fns';
import { Heart, Calendar, MapPin, Users, X, Save, MessageCircle, Gift, Star } from 'lucide-react';

interface RelationshipTrackerFormProps {
    onClose: () => void;
    editData?: {
        id: string;
        person: string;
        relationshipType: 'family' | 'friend' | 'partner' | 'colleague';
        memoryType: 'milestone' | 'memory' | 'conversation' | 'gift' | 'note';
        title: string;
        description: string;
        date: Date;
        location?: string;
    };
}

export const RelationshipTrackerForm: React.FC<RelationshipTrackerFormProps> = ({ onClose, editData }) => {
    const { addStory, updateStory } = useTimelineStore();
    const [formData, setFormData] = useState({
        person: editData?.person || '',
        relationshipType: editData?.relationshipType || 'friend' as 'family' | 'friend' | 'partner' | 'colleague',
        memoryType: editData?.memoryType || 'memory' as 'milestone' | 'memory' | 'conversation' | 'gift' | 'note',
        title: editData?.title || '',
        description: editData?.description || '',
        date: editData?.date || new Date(),
        location: editData?.location || '',
    });
    const [isSaving, setIsSaving] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.person.trim() || !formData.title.trim()) return;

        setIsSaving(true);
        try {
            // Build tags based on relationship and memory type
            const tags = [
                'relationship',
                formData.relationshipType,
                formData.memoryType,
            ];

            // Add specific tags for filtering
            if (formData.relationshipType === 'partner') {
                tags.push('love');
            }

            const storyData = {
                title: formData.title,
                content: formData.description,
                type: 'long' as const,
                date: formData.date,
                tags,
                people: [formData.person],
                importance: formData.memoryType === 'milestone' ? 'high' as const : 'medium' as const,
                location: formData.location || undefined,
                mood: 'happy' as const,
                metadata: {
                    person: formData.person,
                    relationshipType: formData.relationshipType,
                    memoryType: formData.memoryType,
                    eventType: 'relationship'
                }
            };

            if (editData) {
                await updateStory(editData.id, storyData);
            } else {
                await addStory(storyData);
            }

            onClose();
        } catch (error) {
            console.error('Failed to save relationship memory:', error);
        } finally {
            setIsSaving(false);
        }
    };

    const getMemoryTypeIcon = (type: string) => {
        switch (type) {
            case 'milestone': return <Star className="w-4 h-4" />;
            case 'conversation': return <MessageCircle className="w-4 h-4" />;
            case 'gift': return <Gift className="w-4 h-4" />;
            default: return <Heart className="w-4 h-4" />;
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-theme-primary rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                <div className="sticky top-0 bg-theme-primary border-b border-theme px-6 py-4 flex items-center justify-between">
                    <h2 className="text-xl font-semibold text-theme-primary flex items-center gap-2">
                        <Heart className="w-5 h-5 text-pink-500" />
                        {editData ? 'Edit Relationship Memory' : 'Add Relationship Memory'}
                    </h2>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-theme-tertiary"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-6">
                    {/* Person Name */}
                    <div>
                        <label className="block text-sm font-medium text-theme-secondary mb-2">
                            Who is this about? *
                        </label>
                        <div className="relative">
                            <Users className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                            <input
                                type="text"
                                value={formData.person}
                                onChange={(e) => setFormData({ ...formData, person: e.target.value })}
                                className="w-full pl-10 pr-3 py-2 border border-theme rounded-lg bg-theme-primary text-theme-primary focus:outline-none focus:ring-2 focus:ring-primary-500"
                                placeholder="Person's name"
                                required
                            />
                        </div>
                    </div>

                    {/* Relationship Type */}
                    <div>
                        <label className="block text-sm font-medium text-theme-secondary mb-2">
                            Relationship Type
                        </label>
                        <div className="grid grid-cols-4 gap-2">
                            {(['family', 'friend', 'partner', 'colleague'] as const).map((type) => (
                                <button
                                    key={type}
                                    type="button"
                                    onClick={() => setFormData({ ...formData, relationshipType: type })}
                                    className={`px-4 py-2 rounded-lg capitalize transition-colors ${formData.relationshipType === type
                                            ? type === 'family' ? 'bg-blue-600 text-white'
                                                : type === 'friend' ? 'bg-green-600 text-white'
                                                    : type === 'partner' ? 'bg-pink-600 text-white'
                                                        : 'bg-slate-600 text-white'
                                            : 'bg-theme-tertiary text-theme-secondary hover:opacity-80'
                                        }`}
                                >
                                    {type}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Memory Type */}
                    <div>
                        <label className="block text-sm font-medium text-theme-secondary mb-2">
                            What type of memory?
                        </label>
                        <div className="grid grid-cols-5 gap-2">
                            {(['milestone', 'memory', 'conversation', 'gift', 'note'] as const).map((type) => (
                                <button
                                    key={type}
                                    type="button"
                                    onClick={() => setFormData({ ...formData, memoryType: type })}
                                    className={`px-3 py-2 rounded-lg capitalize transition-colors flex items-center justify-center gap-1 text-sm ${formData.memoryType === type
                                            ? 'bg-primary-600 text-white'
                                            : 'bg-theme-tertiary text-theme-secondary hover:opacity-80'
                                        }`}
                                >
                                    {getMemoryTypeIcon(type)}
                                    {type}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Title */}
                    <div>
                        <label className="block text-sm font-medium text-theme-secondary mb-2">
                            Title *
                        </label>
                        <input
                            type="text"
                            value={formData.title}
                            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                            className="w-full px-3 py-2 border border-theme rounded-lg bg-theme-primary text-theme-primary focus:outline-none focus:ring-2 focus:ring-primary-500"
                            placeholder="e.g., Coffee catch-up with Sarah"
                            required
                        />
                    </div>

                    {/* Date */}
                    <div>
                        <label className="block text-sm font-medium text-theme-secondary mb-2">
                            When did this happen?
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
                                className="w-full pl-10 pr-3 py-2 border border-theme rounded-lg bg-theme-primary text-theme-primary focus:outline-none focus:ring-2 focus:ring-primary-500"
                                placeholder="e.g., Local café, Their house, Video call"
                            />
                        </div>
                    </div>

                    {/* Description */}
                    <div>
                        <label className="block text-sm font-medium text-theme-secondary mb-2">
                            What happened?
                        </label>
                        <textarea
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            rows={4}
                            className="w-full px-3 py-2 border border-theme rounded-lg bg-theme-primary text-theme-primary focus:outline-none focus:ring-2 focus:ring-primary-500"
                            placeholder="Describe this moment..."
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
                            disabled={isSaving || !formData.person.trim() || !formData.title.trim()}
                            className="flex-1 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
                        >
                            <Save className="w-4 h-4" />
                            {isSaving ? 'Saving...' : 'Save Memory'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};
