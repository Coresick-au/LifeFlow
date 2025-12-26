import React, { useState, useRef, useEffect, useMemo } from 'react';
import { ChevronDown, Check, ChevronsUpDown } from 'lucide-react';

interface ComboboxProps {
    value: string;
    onChange: (value: string) => void;
    options: string[];
    label?: string;
    placeholder?: string;
    required?: boolean;
    className?: string;
}

export const Combobox: React.FC<ComboboxProps> = ({
    value,
    onChange,
    options,
    label,
    placeholder,
    required = false,
    className = ''
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    // Filter options based on input
    const filteredOptions = useMemo(() => {
        if (!value) return options;
        const lowerValue = value.toLowerCase();
        return options.filter(opt => opt.toLowerCase().includes(lowerValue));
    }, [options, value]);

    // Close on click outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleSelect = (option: string) => {
        onChange(option);
        setIsOpen(false);
    };

    return (
        <div className={`relative ${className}`} ref={containerRef}>
            {label && (
                <label className="block text-sm font-medium text-theme-secondary mb-1">
                    {label}
                </label>
            )}
            <div className="relative">
                <input
                    ref={inputRef}
                    type="text"
                    required={required}
                    className="w-full bg-theme-bg-primary border border-theme-border rounded-lg px-3 py-2 text-theme-primary focus:ring-2 focus:ring-primary-500 pr-10"
                    placeholder={placeholder}
                    value={value}
                    onChange={(e) => {
                        onChange(e.target.value);
                        if (!isOpen) setIsOpen(true);
                    }}
                    onFocus={() => setIsOpen(true)}
                // OnKeyDown can be added for arrow navigation if needed
                />
                <button
                    type="button"
                    onClick={() => {
                        setIsOpen(!isOpen);
                        if (!isOpen) inputRef.current?.focus();
                    }}
                    className="absolute right-0 top-0 h-full px-3 flex items-center text-theme-tertiary hover:text-theme-primary transition-colors"
                >
                    <ChevronDown className="w-4 h-4" />
                </button>
            </div>

            {isOpen && filteredOptions.length > 0 && (
                <div className="absolute z-50 w-full mt-1 bg-theme-bg-primary border border-theme-border rounded-lg shadow-lg max-h-60 overflow-y-auto animate-in fade-in zoom-in-95 duration-100">
                    {filteredOptions.map((option) => (
                        <button
                            key={option}
                            type="button"
                            onClick={() => handleSelect(option)}
                            className="w-full text-left px-3 py-2 text-sm text-theme-primary hover:bg-theme-tertiary flex items-center justify-between transition-colors"
                        >
                            <span>{option}</span>
                            {value === option && (
                                <Check className="w-3 h-3 text-primary-600" />
                            )}
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
};
