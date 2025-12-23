import React from 'react';
import { Story } from '../types';
import { format } from 'date-fns';
import { X, MapPin, Tag, Users, Calendar, Star, Edit } from 'lucide-react';
import { useTimelineStore } from '../store/timelineStore';

const getMoodColor = (mood: Story['mood']): string => {
    const colors: Record<NonNullable<Story['mood']>, string> = {
        happy: 'bg-yellow-500',
        sad: 'bg-blue-500',
        neutral: 'bg-gray-500',
        excited: 'bg-pink-500',
        proud: 'bg-purple-500',
        grateful: 'bg-green-500',
    };
    return colors[mood || 'neutral'] || 'bg-gray-500';
};

const getMoodEmoji = (mood: Story['mood']): string => {
    const moods: Record<NonNullable<Story['mood']>, string> = {
        happy: '😊',
        sad: '😢',
        neutral: '😐',
        excited: '🎉',
        proud: '🏆',
        grateful: '🙏',
    };
    return moods[mood || 'neutral'] || '😐';
};

interface StoryViewerProps {
    story: Story;
    onClose: () => void;
    onEdit?: (storyId: string) => void;
}

/**
 * StoryViewer Component
 * Read-only view for consuming stories without editing distractions.
 * Separates "Journaling" from "Reliving".
 */
export const StoryViewer: React.FC<StoryViewerProps> = ({ story, onClose, onEdit }) => {
    // Close on Escape key
    React.useEffect(() => {
        const handleEscape = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
        };
        document.addEventListener('keydown', handleEscape);
        return () => document.removeEventListener('keydown', handleEscape);
    }, [onClose]);

    // Prevent scroll on body when modal is open
    React.useEffect(() => {
        document.body.style.overflow = 'hidden';
        return () => {
            document.body.style.overflow = 'unset';
        };
    }, []);

    return (
        <div
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={onClose}
        >
            <div
                className="bg-theme-primary w-full max-w-2xl rounded-2xl overflow-hidden shadow-2xl animate-slide-up"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Mood Color Header Bar */}
                <div className={`h-2 ${getMoodColor(story.mood)}`} />

                <div className="p-8 max-h-[80vh] overflow-y-auto">
                    {/* Header */}
                    <div className="flex justify-between items-start mb-6">
                        <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                                <Calendar className="w-4 h-4 text-theme-tertiary" />
                                <span className="text-xs font-mono text-theme-tertiary uppercase tracking-widest">
                                    {format(new Date(story.date), 'MMMM d, yyyy')}
                                </span>
                                {story.fuzzyDate && (
                                    <span className="text-xs text-amber-500">(approximate)</span>
                                )}
                            </div>
                            <h2 className="text-3xl font-serif font-bold text-theme-primary mt-1">
                                {story.title}
                            </h2>
                        </div>
                        <div className="flex items-center gap-2">
                            {onEdit && (
                                <button
                                    onClick={() => onEdit(story.id)}
                                    className="p-2 hover:bg-theme-tertiary rounded-full transition-colors"
                                    title="Edit story"
                                >
                                    <Edit className="w-5 h-5 text-theme-secondary" />
                                </button>
                            )}
                            <button
                                onClick={onClose}
                                className="p-2 hover:bg-theme-tertiary rounded-full transition-colors"
                            >
                                <X className="w-6 h-6 text-theme-secondary" />
                            </button>
                        </div>
                    </div>

                    {/* Meta Info Bar */}
                    <div className="flex flex-wrap items-center gap-4 mb-6 text-sm text-theme-secondary">
                        {/* Mood */}
                        <div className="flex items-center gap-1">
                            <span className="text-lg">{getMoodEmoji(story.mood)}</span>
                            <span className="capitalize">{story.mood || 'neutral'}</span>
                        </div>

                        {/* Importance */}
                        <div className="flex items-center gap-1">
                            <Star className={`w-4 h-4 ${story.importance === 'high' ? 'text-red-500' :
                                story.importance === 'medium' ? 'text-yellow-500' : 'text-gray-400'
                                }`} />
                            <span className="capitalize">{story.importance} importance</span>
                        </div>

                        {/* Type */}
                        <span className={`px-2 py-0.5 rounded text-xs font-medium ${story.type === 'long'
                            ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300'
                            : 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
                            }`}>
                            {story.type === 'long' ? 'Long Story' : 'Short Story'}
                        </span>
                    </div>

                    {/* Story Content */}
                    <div className="prose dark:prose-invert max-w-none mb-8">
                        <p className="text-lg leading-relaxed text-theme-secondary whitespace-pre-wrap break-words">
                            {story.content}
                        </p>
                    </div>

                    {/* Location */}
                    {story.location && (
                        <div className="flex items-center gap-2 mb-4 text-theme-secondary">
                            <MapPin className="w-4 h-4" />
                            <span>{story.location}</span>
                        </div>
                    )}

                    {/* People */}
                    {story.people && story.people.length > 0 && (
                        <div className="flex items-center gap-2 mb-4">
                            <Users className="w-4 h-4 text-theme-tertiary" />
                            <div className="flex flex-wrap gap-1">
                                {story.people.map(person => (
                                    <span
                                        key={person}
                                        className="text-sm bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-300 px-2 py-0.5 rounded"
                                    >
                                        {person}
                                    </span>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Tags */}
                    {story.tags && story.tags.length > 0 && (
                        <div className="pt-6 border-t border-theme flex flex-wrap gap-2">
                            <Tag className="w-4 h-4 text-theme-tertiary" />
                            {story.tags.map(tag => (
                                <span
                                    key={tag}
                                    className="text-xs bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-300 px-2 py-1 rounded"
                                >
                                    #{tag}
                                </span>
                            ))}
                        </div>
                    )}

                    {/* Images */}
                    {story.images && story.images.length > 0 && (
                        <div className="mt-6 grid grid-cols-2 gap-2">
                            {story.images.map((img, idx) => (
                                <img
                                    key={idx}
                                    src={img}
                                    alt={`Story image ${idx + 1}`}
                                    className="rounded-lg object-cover w-full h-40"
                                />
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
