import React, { useState } from 'react';
import { Download, Eye, EyeOff, Copy, Check } from 'lucide-react';
import { useTimelineStore } from '../store/timelineStore';
import { CareerEvent } from './JobTracker';
import { format } from 'date-fns';

interface CareerExportProps {
  careerEvents: CareerEvent[];
}

export const CareerExport: React.FC<CareerExportProps> = ({ careerEvents }) => {
  const {
    stories,
    userProfile,
    yearlyIncomes,
    getTotalNetWorth,
    getLiquidAssets,
    getTotalDebt,
    getSuperannuation,
  } = useTimelineStore();
  const [isAnonymized, setIsAnonymized] = useState(false);
  const [copied, setCopied] = useState(false);

  // Apply privacy mask to data
  const applyPrivacyMask = (data: any, anonymize: boolean) => {
    if (!anonymize) return data;

    return {
      ...data,
      name: 'Valued Professional',
      company: data.company ? (data.company === data.currentCompany ? 'Current Employer' : 'Previous Employer') : undefined,
      date: data.date ? format(data.date, 'yyyy') : undefined,
      endDate: data.endDate ? format(data.endDate, 'yyyy') : undefined,
      duration: data.duration ? `${Math.round(data.duration)} years` : undefined
    };
  };

  // Generate AI Pivot Pack Markdown
  const generateAIPivotPack = () => {
    const currentDate = new Date();

    // Get current company for anonymization reference
    const currentCompany = careerEvents.find(e => !e.endDate)?.company;

    // Process career events
    const processedEvents = careerEvents.map(event => {
      const duration = event.endDate
        ? (event.endDate.getTime() - event.date.getTime()) / (1000 * 60 * 60 * 24 * 365)
        : (currentDate.getTime() - event.date.getTime()) / (1000 * 60 * 60 * 24 * 365);

      const eventData = {
        title: event.title,
        type: event.type,
        company: event.company,
        currentCompany: currentCompany,
        date: event.date,
        endDate: event.endDate,
        duration: duration,
        description: event.description
      };

      return applyPrivacyMask(eventData, isAnonymized);
    });

    // Extract life skills from non-career stories
    const lifeSkills = stories
      .filter(story =>
        !story.tags.some(tag => ['career', 'work', 'job', 'professional', 'business'].includes(tag.toLowerCase())) &&
        (story.tags.some(tag => ['achievement', 'skill', 'learning'].includes(tag.toLowerCase())) ||
          story.content.toLowerCase().includes('learned') ||
          story.content.toLowerCase().includes('achieved') ||
          story.content.toLowerCase().includes('mastered'))
      )
      .map(story => {
        const skillData = {
          title: story.title,
          description: story.content,
          date: story.date,
          tags: story.tags.filter(t => ['achievement', 'skill', 'learning'].includes(t.toLowerCase()))
        };
        return applyPrivacyMask(skillData, isAnonymized);
      });

    // Build Markdown payload
    let markdown = `# Career Analysis & AI Pivot Pack

## System Instruction
You are a Career Strategist AI. Analyze the following career history to:
1. Identify market value gaps and loyalty penalties
2. Translate unusual life skills into professional competencies
3. Suggest high-impact career pivots based on demonstrated abilities
4. Analyze earnings gap: If Total Earnings > Base Salary by 50%+, classify as "High-Utilization Specialist" and suggest roles that reward output over hours.

Ask for a resume style (e.g., Harvard, Functional, Combination) before drafting.

---

## Profile Information
${isAnonymized ? 'Name: Valued Professional' : `Name: ${userProfile?.name || 'Professional'}`}
Generated: ${format(currentDate, 'MMMM d, yyyy')}

---

## Career History

`;

    processedEvents.forEach((event, index) => {
      markdown += `### ${index + 1}. ${event.title}
- **Type**: ${event.type}
- **Company**: ${event.company || 'Independent'}
- **Period**: ${event.date}${event.endDate ? ` - ${event.endDate}` : ' - Present'}
- **Duration**: ${event.duration ? `${event.duration.toFixed(1)} years` : 'N/A'}
- **Description**: ${event.description}

`;
    });

    if (lifeSkills.length > 0) {
      markdown += `---

## Life Skills & Transferable Competencies

`;
      lifeSkills.forEach((skill, index) => {
        markdown += `### ${index + 1}. ${skill.title}
- **Date**: ${skill.date}
- **Tags**: ${skill.tags.join(', ') || 'General'}
- **Description**: ${skill.description}

`;
      });
    }

    if (yearlyIncomes.length > 0) {
      markdown += `---

## Wage & Earnings Capacity History

`;
      yearlyIncomes
        .sort((a, b) => b.year - a.year)
        .forEach((income) => {
          const multiplier = income.baseSalary > 0 ? (income.totalEarnings / income.baseSalary).toFixed(2) : '0';
          markdown += `- **${income.year}**: Contract ${formatFinancialValue(income.baseSalary)} | Actual ${formatFinancialValue(income.totalEarnings)} (Multiplier: ${multiplier}x) - ${income.role}
`;
        });
      markdown += `
`;
    }

    // Add Financial Health section
    const netWorth = getTotalNetWorth();
    const liquidAssets = getLiquidAssets();
    const totalDebt = getTotalDebt();
    const superannuation = getSuperannuation();
    const lockedAssets = superannuation; // Could add real estate equity here

    // Helper function to convert value to range (for privacy masking)
    const valueToRange = (value: number): string => {
      if (value < 0) return 'Negative';
      if (value < 10000) return '$0-$10k';
      if (value < 25000) return '$10k-$25k';
      if (value < 50000) return '$25k-$50k';
      if (value < 100000) return '$50k-$100k';
      if (value < 250000) return '$100k-$250k';
      if (value < 500000) return '$250k-$500k';
      if (value < 1000000) return '$500k-$1M';
      return '$1M+';
    };

    const formatFinancialValue = (value: number): string => {
      if (isAnonymized) {
        return valueToRange(value);
      }
      return `$${value.toLocaleString('en-AU', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
    };

    // Calculate liquid runway (months at $5k/month burn rate)
    const liquidRunwayMonths = liquidAssets > 0 ? Math.floor(liquidAssets / 5000) : 0;

    markdown += `---

## Financial Health Context

- **Net Worth**: ${formatFinancialValue(netWorth)}
- **Liquid Runway**: ${formatFinancialValue(liquidAssets)}${liquidAssets > 0 ? ` (~${liquidRunwayMonths} months at $5k/month)` : ''}
- **Locked Assets**: ${formatFinancialValue(lockedAssets)} (Superannuation + Real Estate Equity)
- **Total Liabilities**: ${formatFinancialValue(totalDebt)}

${isAnonymized
        ? '*Financial values shown as ranges for privacy.*'
        : '*Use this context to assess career risk tolerance and pivot feasibility.*'}

`;

    markdown += `---

## Analysis Request
Based on the above history, please provide:
1. Market value analysis with salary expectations
2. 3-5 recommended career pivot opportunities
3. Skills gap analysis for target roles
4. Professional development recommendations
5. Resume optimization suggestions

---

*Generated by LifeFlow Career Leverage Engine*`;

    return markdown;
  };

  // Copy to clipboard
  const copyToClipboard = async () => {
    const markdown = generateAIPivotPack();
    try {
      await navigator.clipboard.writeText(markdown);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  // Download as file
  const downloadMarkdown = () => {
    const markdown = generateAIPivotPack();
    const blob = new Blob([markdown], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `career-pivot-pack-${format(new Date(), 'yyyy-MM-dd')}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="bg-theme-primary rounded-lg shadow-lg p-6 mt-8">
      <h3 className="text-lg font-semibold text-theme-primary mb-2">Career Export Tools</h3>

      {/* How to Use Section */}
      <details className="mb-4">
        <summary className="text-sm font-medium text-primary-600 dark:text-primary-400 cursor-pointer hover:underline">
          ℹ️ How to use these tools
        </summary>
        <div className="mt-3 p-4 bg-blue-50 dark:bg-blue-900/30 rounded-lg text-sm space-y-3">
          <div>
            <strong className="text-blue-800 dark:text-blue-300">📋 Copy AI Pivot Pack</strong>
            <p className="text-blue-700 dark:text-blue-400 mt-1">
              Generates a structured prompt you can paste into ChatGPT, Claude, or other AI assistants. The AI will analyze your career history and provide:
            </p>
            <ul className="list-disc ml-5 mt-1 text-blue-700 dark:text-blue-400">
              <li>Market value assessment</li>
              <li>Career pivot recommendations</li>
              <li>Skills gap analysis</li>
              <li>Resume optimization tips</li>
            </ul>
          </div>
          <div>
            <strong className="text-blue-800 dark:text-blue-300">📥 Download Markdown</strong>
            <p className="text-blue-700 dark:text-blue-400 mt-1">
              Saves your career data as a .md file for backup, sharing with recruiters, or importing into other tools like Notion or Obsidian.
            </p>
          </div>
          <div>
            <strong className="text-blue-800 dark:text-blue-300">🔒 Privacy Mask</strong>
            <p className="text-blue-700 dark:text-blue-400 mt-1">
              Toggle to hide personal details (name, exact dates, specific companies, exact financial figures) before sharing. Great for getting advice while maintaining privacy.
            </p>
          </div>
        </div>
      </details>

      {/* Privacy Mask Toggle */}
      <div className="flex items-center justify-between p-4 bg-theme-tertiary dark:bg-slate-800 rounded-lg mb-4">
        <div className="flex items-center gap-3">
          {isAnonymized ? <EyeOff className="w-5 h-5 text-theme-tertiary" /> : <Eye className="w-5 h-5 text-theme-tertiary" />}
          <div>
            <p className="font-medium text-theme-primary">Privacy Mask</p>
            <p className="text-sm text-theme-tertiary">
              {isAnonymized ? 'Hide personal information' : 'Show all details'}
            </p>
          </div>
        </div>
        <button
          onClick={() => setIsAnonymized(!isAnonymized)}
          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${isAnonymized ? 'bg-primary-600' : 'bg-theme-tertiary dark:bg-gray-700'
            }`}
        >
          <span
            className={`inline-block h-4 w-4 transform rounded-full bg-theme-primary transition-transform ${isAnonymized ? 'translate-x-6' : 'translate-x-1'
              }`}
          />
        </button>
      </div>

      {/* Export Actions */}
      <div className="flex gap-3">
        <button
          onClick={copyToClipboard}
          className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 transition-colors"
        >
          {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
          {copied ? 'Copied!' : 'Copy AI Pivot Pack'}
        </button>
        <button
          onClick={downloadMarkdown}
          className="flex-1 flex items-center justify-center gap-2 px-4 py-2 border border-theme text-theme-secondary rounded-md hover:bg-theme-tertiary transition-colors"
        >
          <Download className="w-4 h-4" />
          Download Markdown
        </button>
      </div>

      {/* Export Preview */}
      <div className="mt-4 p-4 bg-blue-500/20 dark:bg-blue-900/20 rounded-lg">
        <p className="text-sm text-blue-800 dark:text-blue-300">
          <strong>AI Pivot Pack</strong> includes your career timeline, life skills, financial health context, and a structured prompt for career AI analysis.
          {isAnonymized && ' Personal and financial information will be anonymized.'}
        </p>
      </div>
    </div>
  );
};
