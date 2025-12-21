import React, { useState, useMemo } from 'react';
import { format, startOfYear, endOfYear, eachMonthOfInterval } from 'date-fns';
import { useTimelineStore } from '../store/timelineStore';
import { Story } from '../types';
import { Download, Calendar, Book, FileText } from 'lucide-react';

interface PDFExportProps {
  onClose?: () => void;
}

const moodEmojis = {
  happy: '😊',
  excited: '🎉',
  proud: '🏆',
  grateful: '🙏',
  neutral: '😐',
  sad: '😢',
};

export const PDFExport: React.FC<PDFExportProps> = ({ onClose }) => {
  const { stories, userProfile } = useTimelineStore();
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [exportType, setExportType] = useState<'yearly' | 'full' | 'category'>('yearly');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  // Filter and organize stories
  const organizedStories = useMemo(() => {
    let filteredStories = stories;

    // Filter by year
    if (exportType === 'yearly') {
      const yearStart = startOfYear(new Date(selectedYear, 0, 1));
      const yearEnd = endOfYear(new Date(selectedYear, 0, 1));
      filteredStories = stories.filter(story => {
        const storyDate = new Date(story.date);
        return storyDate >= yearStart && storyDate <= yearEnd;
      });
    }

    // Filter by category
    if (exportType === 'category' && selectedCategory !== 'all') {
      filteredStories = filteredStories.filter(story => 
        story.tags.includes(selectedCategory)
      );
    }

    // Group by month manually
    const monthGroups: Record<string, Story[]> = {};
    filteredStories.forEach(story => {
      const monthKey = format(new Date(story.date), 'yyyy-MM');
      if (!monthGroups[monthKey]) {
        monthGroups[monthKey] = [];
      }
      monthGroups[monthKey].push(story);
    });

    return monthGroups;
  }, [stories, selectedYear, exportType, selectedCategory]);

  // Get available categories
  const categories = useMemo(() => {
    const cats = new Set<string>();
    stories.forEach(story => {
      story.tags.forEach(tag => cats.add(tag));
    });
    return Array.from(cats).sort();
  }, [stories]);

  const handlePrint = () => {
    window.print();
  };

  const handleExportHTML = () => {
    const printContent = document.getElementById('pdf-content');
    if (!printContent) return;

    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>LifeFlow Memoir - ${selectedYear}</title>
          <style>
            ${getPrintStyles()}
          </style>
        </head>
        <body>
          ${printContent.innerHTML}
        </body>
      </html>
    `;

    const blob = new Blob([htmlContent], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `lifeflow-memoir-${selectedYear}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const getPrintStyles = () => `
    @page {
      size: A4;
      margin: 2cm;
    }
    
    @media print {
      body {
        font-family: 'Georgia', serif;
        line-height: 1.6;
        color: #333;
      }
      
      .no-print {
        display: none !important;
      }
      
      .page-break {
        page-break-before: always;
      }
      
      .chapter-title {
        font-size: 24pt;
        font-weight: bold;
        margin-bottom: 20pt;
        text-align: center;
      }
      
      .story-title {
        font-size: 14pt;
        font-weight: bold;
        margin-bottom: 5pt;
      }
      
      .story-date {
        font-size: 10pt;
        font-style: italic;
        color: #666;
        margin-bottom: 10pt;
      }
      
      .story-content {
        font-size: 11pt;
        margin-bottom: 15pt;
        text-align: justify;
      }
      
      .story-meta {
        font-size: 9pt;
        color: #888;
        margin-bottom: 20pt;
        border-bottom: 1px solid #eee;
        padding-bottom: 10pt;
      }
      
      .cover-page {
        text-align: center;
        height: 100vh;
        display: flex;
        flex-direction: column;
        justify-content: center;
      }
      
      .cover-title {
        font-size: 48pt;
        font-weight: bold;
        margin-bottom: 20pt;
      }
      
      .cover-subtitle {
        font-size: 18pt;
        color: #666;
        margin-bottom: 40pt;
      }
    }
  `;

  const yearOptions = Array.from({ length: 20 }, (_, i) => new Date().getFullYear() - i);

  return (
    <div className="bg-theme-primary rounded-lg shadow-lg p-6">
      <div className="no-print">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-theme-primary">Export to PDF</h2>
          {onClose && (
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-theme-tertiary"
            >
              ×
            </button>
          )}
        </div>

        {/* Export Options */}
        <div className="space-y-4 mb-6">
          {/* Export Type */}
          <div>
            <label className="block text-sm font-medium text-theme-secondary mb-2">
              Export Type
            </label>
            <select
              value={exportType}
              onChange={(e) => setExportType(e.target.value as any)}
              className="w-full px-3 py-2 border border-theme rounded-md bg-theme-primary text-theme-primary focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="yearly">Yearly Review</option>
              <option value="full">Complete Memoir</option>
              <option value="category">By Category</option>
            </select>
          </div>

          {/* Year Selection */}
          {exportType === 'yearly' && (
            <div>
              <label className="block text-sm font-medium text-theme-secondary mb-2">
                Select Year
              </label>
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(Number(e.target.value))}
                className="w-full px-3 py-2 border border-theme rounded-md bg-theme-primary text-theme-primary focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                {yearOptions.map(year => (
                  <option key={year} value={year}>{year}</option>
                ))}
              </select>
            </div>
          )}

          {/* Category Selection */}
          {exportType === 'category' && (
            <div>
              <label className="block text-sm font-medium text-theme-secondary mb-2">
                Select Category
              </label>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full px-3 py-2 border border-theme rounded-md bg-theme-primary text-theme-primary focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="all">All Categories</option>
                {categories.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* Export Actions */}
        <div className="flex gap-3">
          <button
            onClick={handlePrint}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 transition-colors"
          >
            <FileText className="w-4 h-4" />
            Print to PDF
          </button>
          <button
            onClick={handleExportHTML}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors"
          >
            <Download className="w-4 h-4" />
            Export HTML
          </button>
        </div>

        <p className="mt-3 text-sm text-slate-500 dark:text-slate-400">
          Tip: Use "Print to PDF" in your browser's print dialog for best results
        </p>
      </div>

      {/* Print Content - Hidden until print */}
      <div id="pdf-content" className="hidden">
        {/* Cover Page */}
        <div className="cover-page">
          <h1 className="cover-title">My Life Story</h1>
          <p className="cover-subtitle">
            {userProfile?.name || 'A Memoir'}
          </p>
          {exportType === 'yearly' && (
            <p className="text-lg">The Year {selectedYear}</p>
          )}
          {exportType === 'category' && selectedCategory !== 'all' && (
            <p className="text-lg capitalize">{selectedCategory} Stories</p>
          )}
          <p className="text-sm mt-8">
            Generated on {format(new Date(), 'MMMM d, yyyy')}
          </p>
        </div>

        {/* Stories by Month */}
        {Object.entries(organizedStories).map(([monthKey, monthStories], index) => (
          <div key={monthKey} className={index > 0 ? 'page-break' : ''}>
            <h2 className="chapter-title">
              {format(new Date(monthKey + '-01'), 'MMMM yyyy')}
            </h2>
            
            {monthStories.map((story: Story) => (
              <div key={story.id} className="mb-8">
                <h3 className="story-title">{story.title}</h3>
                <p className="story-date">
                  {format(new Date(story.date), 'MMMM d, yyyy')}
                  {story.location && ` • ${story.location}`}
                </p>
                <div className="story-content">
                  {story.content.split('\n').map((paragraph, i) => (
                    <p key={i} className="mb-3">
                      {paragraph}
                    </p>
                  ))}
                </div>
                <div className="story-meta">
                  {story.mood && (
                    <span className="mr-4">
                      Mood: {moodEmojis[story.mood]} {story.mood}
                    </span>
                  )}
                  {story.tags.length > 0 && (
                    <span>
                      Tags: {story.tags.join(', ')}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        ))}

        {/* Back Cover */}
        <div className="page-break">
          <div className="text-center mt-20">
            <p className="text-lg italic">The End</p>
            <p className="mt-8 text-sm text-theme-tertiary">
              Created with ❤️ using LifeFlow
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
