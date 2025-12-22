import React, { ReactNode } from 'react';
import { Info } from 'lucide-react';

interface TooltipProps {
    content: string;
    children?: ReactNode;
}

export const Tooltip: React.FC<TooltipProps> = ({ content, children }) => {
    return (
        <div className="group relative inline-block">
            {children || <Info className="w-4 h-4 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 cursor-help transition-colors" />}
            <div className="hidden group-hover:block absolute z-50 w-72 p-3 bg-gray-900 dark:bg-gray-700 text-white text-sm rounded-lg shadow-2xl -top-2 left-6 pointer-events-none">
                {content}
                {/* Arrow */}
                <div className="absolute top-3 -left-1 w-2 h-2 bg-gray-900 dark:bg-gray-700 transform rotate-45"></div>
            </div>
        </div>
    );
};
