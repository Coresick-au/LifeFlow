import React, { useState, useMemo } from 'react';
import { format } from 'date-fns';
import { useTimelineStore } from '../store/timelineStore';
import { Advice } from '../types';
import {
    Lightbulb,
    Briefcase,
    DollarSign,
    Heart,
    Activity,
    Plus,
    Edit2,
    Trash2,
    BookOpen,
    User
} from 'lucide-react';

const adviceCategories = [
    { value: 'life', label: 'Life', icon: Lightbulb, color: 'bg-yellow-500/20 text-yellow-600 dark:text-yellow-400' },
    { value: 'career', label: 'Career', icon: Briefcase, color: 'bg-blue-500/20 text-blue-600 dark:text-blue-400' },
    { value: 'financial', label: 'Financial', icon: DollarSign, color: 'bg-green-500/20 text-green-600 dark:text-green-400' },
    { value: 'relationships', label: 'Relationships', icon: Heart, color: 'bg-pink-500/20 text-pink-600 dark:text-pink-400' },
    { value: 'health', label: 'Health', icon: Activity, color: 'bg-red-500/20 text-red-600 dark:text-red-400' },
] as const;

export const AdvicePanel: React.FC = () => {
    const { advice, addAdvice, updateAdvice, deleteAdvice, isSaving } = useTimelineStore();
    const [filterCategory, setFilterCategory] = useState<string>('all');
    const [searchTerm, setSearchTerm] = useState('');
    const [isAdding, setIsAdding] = useState(false);
    const [editingAdvice, setEditingAdvice] = useState<string | null>(null);
    const [formData, setFormData] = useState({
        content: '',
        category: 'life' as Advice['category'],
        source: '',
        tags: [] as string[],
    });

    // Filter advice
    const filteredAdvice = useMemo(() => {
        let filtered = advice || [];

        if (filterCategory !== 'all') {
            filtered = filtered.filter(a => a.category === filterCategory);
        }

        if (searchTerm) {
            filtered = filtered.filter(a =>
                a.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
                a.source?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                a.tags?.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
            );
        }

        return filtered;
    }, [advice, filterCategory, searchTerm]);

    // Group advice by category
    const groupedAdvice = useMemo(() => {
        const groups: Record<string, Advice[]> = {};

        filteredAdvice.forEach(item => {
            if (!groups[item.category]) {
                groups[item.category] = [];
            }
            groups[item.category].push(item);
        });

        return groups;
    }, [filteredAdvice]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.content.trim()) return;

        if (editingAdvice) {
            await updateAdvice(editingAdvice, formData);
            setEditingAdvice(null);
        } else {
            await addAdvice({
                ...formData,
                createdAt: new Date(),
            });
        }

        setFormData({ content: '', category: 'life', source: '', tags: [] });
        setIsAdding(false);
    };

    const handleDelete = async (id: string) => {
        if (window.confirm('Are you sure you want to delete this advice?')) {
            await deleteAdvice(id);
        }
    };

    const handleEdit = (item: Advice) => {
        setFormData({
            content: item.content,
            category: item.category,
            source: item.source || '',
            tags: item.tags || [],
        });
        setEditingAdvice(item.id);
        setIsAdding(true);
    };

    const handleCancel = () => {
        setFormData({ content: '', category: 'life', source: '', tags: [] });
        setIsAdding(false);
        setEditingAdvice(null);
    };

    return (
        <div className="max-w-4xl mx-auto">
            <div className="mb-8">
                <h2 className="text-3xl font-bold text-theme-primary mb-2">Advice</h2>
                <p className="text-theme-tertiary">Collect wisdom and insights to guide your journey</p>
            </div>

            {/* Add Advice Button */}
            {!isAdding && (
                <button
                    onClick={() => setIsAdding(true)}
                    className="mb-6 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors flex items-center gap-2"
                >
                    <Plus className="w-5 h-5" />
                    Add Advice
                </button>
            )}

            {/* Add Advice Form */}
            {isAdding && (
                <div className="mb-6 p-6 bg-theme-primary rounded-lg shadow-md">
                    <form onSubmit={handleSubmit}>
                        <div className="mb-4">
                            <label className="block text-sm font-medium text-theme-secondary mb-2">
                                What's the advice?
                            </label>
                            <textarea
                                value={formData.content}
                                onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                                className="w-full px-3 py-2 border border-theme rounded-lg bg-theme-primary text-theme-primary focus:outline-none focus:ring-2 focus:ring-primary-500"
                                rows={4}
                                placeholder="Enter advice or wisdom..."
                                autoFocus
                            />
                        </div>

                        <div className="mb-4">
                            <label className="block text-sm font-medium text-theme-secondary mb-2">Category</label>
                            <div className="flex flex-wrap gap-2">
                                {adviceCategories.map(({ value, label, icon: Icon, color }) => (
                                    <button
                                        key={value}
                                        type="button"
                                        onClick={() => setFormData({ ...formData, category: value as Advice['category'] })}
                                        className={`px-3 py-2 rounded-md text-sm font-medium transition-colors flex items-center gap-1 ${formData.category === value
                                            ? color
                                            : 'bg-theme-tertiary text-theme-secondary hover:opacity-80'
                                            }`}
                                    >
                                        <Icon className="w-4 h-4" />
                                        {label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="mb-4">
                            <label className="block text-sm font-medium text-theme-secondary mb-2">
                                Source (optional)
                            </label>
                            <div className="flex items-center gap-2">
                                <User className="w-4 h-4 text-theme-tertiary" />
                                <input
                                    type="text"
                                    value={formData.source}
                                    onChange={(e) => setFormData({ ...formData, source: e.target.value })}
                                    className="flex-1 px-3 py-2 border border-theme rounded-lg bg-theme-primary text-theme-primary focus:outline-none focus:ring-2 focus:ring-primary-500"
                                    placeholder="Who said this? (e.g., Dad, Book Title, Mentor)"
                                />
                            </div>
                        </div>

                        <div className="flex gap-2">
                            <button
                                type="submit"
                                disabled={isSaving || !formData.content.trim()}
                                className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            >
                                {isSaving ? 'Saving...' : editingAdvice ? 'Update' : 'Save'}
                            </button>
                            <button
                                type="button"
                                onClick={handleCancel}
                                className="px-4 py-2 bg-theme-tertiary text-theme-secondary rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
                            >
                                Cancel
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {/* Filters */}
            <div className="mb-6 flex flex-col sm:flex-row gap-4">
                <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Search advice..."
                    className="flex-1 px-3 py-2 border border-theme rounded-lg bg-theme-primary text-theme-primary focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
                <select
                    value={filterCategory}
                    onChange={(e) => setFilterCategory(e.target.value)}
                    className="px-3 py-2 border border-theme rounded-lg bg-theme-primary text-theme-primary focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                    <option value="all">All Categories</option>
                    {adviceCategories.map(({ value, label }) => (
                        <option key={value} value={value}>{label}</option>
                    ))}
                </select>
            </div>

            {/* Advice List */}
            {filteredAdvice.length > 0 ? (
                <div className="space-y-6">
                    {Object.entries(groupedAdvice).map(([category, items]) => {
                        const categoryConfig = adviceCategories.find(c => c.value === category);
                        const Icon = categoryConfig?.icon || BookOpen;

                        return (
                            <div key={category}>
                                <h3 className="text-lg font-semibold text-theme-primary mb-3 flex items-center gap-2">
                                    <Icon className="w-5 h-5" />
                                    {categoryConfig?.label || category}
                                </h3>
                                <div className="space-y-3">
                                    {items.map((item) => (
                                        <div
                                            key={item.id}
                                            className="p-4 bg-theme-primary rounded-lg shadow-sm border border-theme hover:shadow-md transition-shadow"
                                        >
                                            <div className="flex items-start justify-between mb-2">
                                                <div className="flex items-center gap-2">
                                                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${categoryConfig?.color}`}>
                                                        {categoryConfig?.label}
                                                    </span>
                                                    <span className="text-sm text-slate-500 dark:text-slate-400">
                                                        {format(new Date(item.createdAt), 'MMM d, yyyy')}
                                                    </span>
                                                </div>
                                                <div className="flex items-center gap-1">
                                                    <button
                                                        onClick={() => handleEdit(item)}
                                                        className="p-1 text-gray-400 hover:text-blue-600 transition-colors"
                                                    >
                                                        <Edit2 className="w-4 h-4" />
                                                    </button>
                                                    <button
                                                        onClick={() => handleDelete(item.id)}
                                                        className="p-1 text-gray-400 hover:text-red-600 transition-colors"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            </div>

                                            <p className="text-theme-primary whitespace-pre-wrap mb-2">"{item.content}"</p>

                                            {item.source && (
                                                <p className="text-sm text-theme-tertiary italic">— {item.source}</p>
                                            )}

                                            {item.tags && item.tags.length > 0 && (
                                                <div className="mt-3 flex flex-wrap gap-1">
                                                    {item.tags.map((tag) => (
                                                        <span
                                                            key={tag}
                                                            className="px-2 py-1 bg-theme-tertiary text-theme-tertiary rounded-full text-xs"
                                                        >
                                                            #{tag}
                                                        </span>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        );
                    })}
                </div>
            ) : (
                <div className="text-center py-12">
                    <BookOpen className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-theme-primary mb-2">
                        No advice yet
                    </h3>
                    <p className="text-slate-500 dark:text-slate-400 mb-6">
                        Start collecting wisdom and insights
                    </p>
                    <button
                        onClick={() => setIsAdding(true)}
                        className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
                    >
                        Add Your First Advice
                    </button>
                </div>
            )}
        </div>
    );
};
