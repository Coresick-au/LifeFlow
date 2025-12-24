import React from 'react';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { Calendar } from 'lucide-react';

interface ThemedDatePickerProps {
  selected: Date | null | undefined;
  onChange: (date: Date | null) => void;
  placeholder?: string;
  minDate?: Date;
  maxDate?: Date;
  disabled?: boolean;
  showMonthYearPicker?: boolean;
  showYearPicker?: boolean;
  dateFormat?: string;
  className?: string;
  id?: string;
}

/**
 * ThemedDatePicker - A wrapper around react-datepicker with dark mode support
 * Replaces native <input type="date"> for better UX
 */
export const ThemedDatePicker: React.FC<ThemedDatePickerProps> = ({
  selected,
  onChange,
  placeholder = 'Select date',
  minDate,
  maxDate,
  disabled = false,
  showMonthYearPicker = false,
  showYearPicker = false,
  dateFormat = 'dd/MM/yyyy',
  className = '',
  id,
}) => {
  return (
    <div className="relative">
      <DatePicker
        id={id}
        selected={selected}
        onChange={onChange}
        placeholderText={placeholder}
        minDate={minDate}
        maxDate={maxDate}
        disabled={disabled}
        showMonthYearPicker={showMonthYearPicker}
        showYearPicker={showYearPicker}
        dateFormat={dateFormat}
        showYearDropdown
        scrollableYearDropdown
        yearDropdownItemNumber={100}
        className={`w-full px-3 py-2 pl-10 border border-theme-border bg-theme-primary text-theme-primary rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent ${className}`}
        calendarClassName="themed-datepicker-calendar"
        popperClassName="themed-datepicker-popper"
        wrapperClassName="w-full"
        showPopperArrow={false}
        autoComplete="off"
      />
      <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-theme-tertiary pointer-events-none" />
    </div>
  );
};

// Add global styles for the datepicker - this should be imported in App.tsx or index.css
export const datepickerStyles = `
/* Themed DatePicker Styles */
.themed-datepicker-calendar {
  background-color: var(--theme-bg-primary) !important;
  border: 1px solid var(--theme-border) !important;
  border-radius: 0.5rem !important;
  font-family: inherit !important;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.3) !important;
}

.themed-datepicker-calendar .react-datepicker__header {
  background-color: var(--theme-bg-secondary) !important;
  border-bottom: 1px solid var(--theme-border) !important;
  padding-top: 0.75rem !important;
}

.themed-datepicker-calendar .react-datepicker__current-month,
.themed-datepicker-calendar .react-datepicker__day-name,
.themed-datepicker-calendar .react-datepicker-year-header {
  color: var(--theme-text-primary) !important;
}

.themed-datepicker-calendar .react-datepicker__day {
  color: var(--theme-text-secondary) !important;
  border-radius: 0.375rem !important;
}

.themed-datepicker-calendar .react-datepicker__day:hover {
  background-color: var(--theme-bg-tertiary) !important;
  color: var(--theme-text-primary) !important;
}

.themed-datepicker-calendar .react-datepicker__day--selected,
.themed-datepicker-calendar .react-datepicker__day--keyboard-selected,
.themed-datepicker-calendar .react-datepicker__month-text--selected,
.themed-datepicker-calendar .react-datepicker__year-text--selected {
  background-color: var(--primary-500) !important;
  color: white !important;
}

.themed-datepicker-calendar .react-datepicker__day--today {
  font-weight: bold !important;
  border: 2px solid var(--primary-500) !important;
}

.themed-datepicker-calendar .react-datepicker__day--outside-month {
  color: var(--theme-text-tertiary) !important;
  opacity: 0.5 !important;
}

.themed-datepicker-calendar .react-datepicker__navigation-icon::before {
  border-color: var(--theme-text-secondary) !important;
}

.themed-datepicker-calendar .react-datepicker__navigation:hover *::before {
  border-color: var(--theme-text-primary) !important;
}

.themed-datepicker-calendar .react-datepicker__year-dropdown,
.themed-datepicker-calendar .react-datepicker__month-dropdown {
  background-color: var(--theme-bg-primary) !important;
  border: 1px solid var(--theme-border) !important;
}

.themed-datepicker-calendar .react-datepicker__year-option,
.themed-datepicker-calendar .react-datepicker__month-option {
  color: var(--theme-text-secondary) !important;
}

.themed-datepicker-calendar .react-datepicker__year-option:hover,
.themed-datepicker-calendar .react-datepicker__month-option:hover {
  background-color: var(--theme-bg-tertiary) !important;
}

.themed-datepicker-calendar .react-datepicker__month-text,
.themed-datepicker-calendar .react-datepicker__year-text {
  color: var(--theme-text-secondary) !important;
  padding: 0.5rem !important;
}

.themed-datepicker-calendar .react-datepicker__month-text:hover,
.themed-datepicker-calendar .react-datepicker__year-text:hover {
  background-color: var(--theme-bg-tertiary) !important;
}

.themed-datepicker-popper {
  z-index: 100 !important;
}

/* Year/Month dropdown text and arrows - fixes dark mode visibility */
.themed-datepicker-calendar .react-datepicker__year-read-view,
.themed-datepicker-calendar .react-datepicker__month-read-view,
.themed-datepicker-calendar .react-datepicker__year-read-view--selected-year,
.themed-datepicker-calendar .react-datepicker__month-read-view--selected-month {
  color: var(--theme-text-primary) !important;
}

.themed-datepicker-calendar .react-datepicker__year-read-view--down-arrow,
.themed-datepicker-calendar .react-datepicker__month-read-view--down-arrow {
  border-color: var(--theme-text-primary) !important;
  border-top-color: var(--theme-text-primary) !important;
}
`;

export default ThemedDatePicker;
