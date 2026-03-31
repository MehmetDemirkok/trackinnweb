'use client';

import { useState, useEffect, useRef } from 'react';
import { ChevronDown, X } from 'lucide-react';

interface AutocompleteInputProps {
  value: string;
  onChange: (value: string) => void;
  suggestions: string[];
  placeholder?: string;
  label?: string;
  required?: boolean;
  className?: string;
  name?: string;
}

export default function AutocompleteInput({
  value,
  onChange,
  suggestions,
  placeholder = '',
  label,
  required = false,
  className = '',
  name,
}: AutocompleteInputProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [filteredSuggestions, setFilteredSuggestions] = useState<string[]>([]);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Filter suggestions based on input value
  useEffect(() => {
    if (value.trim() === '') {
      setFilteredSuggestions(suggestions.slice(0, 10)); // Show first 10 when empty
    } else {
      const filtered = suggestions
        .filter(suggestion => 
          suggestion.toLowerCase().includes(value.toLowerCase())
        )
        .slice(0, 10);
      setFilteredSuggestions(filtered);
    }
    setHighlightedIndex(-1);
  }, [value, suggestions]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(e.target.value);
    setIsOpen(true);
  };

  const handleSelect = (suggestion: string) => {
    onChange(suggestion);
    setIsOpen(false);
    inputRef.current?.blur();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!isOpen && (e.key === 'ArrowDown' || e.key === 'ArrowUp')) {
      setIsOpen(true);
      return;
    }

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlightedIndex(prev =>
        prev < filteredSuggestions.length - 1 ? prev + 1 : prev
      );
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlightedIndex(prev => (prev > 0 ? prev - 1 : -1));
    } else if (e.key === 'Enter' && highlightedIndex >= 0) {
      e.preventDefault();
      handleSelect(filteredSuggestions[highlightedIndex]);
    } else if (e.key === 'Escape') {
      setIsOpen(false);
    }
  };

  const handleClear = () => {
    onChange('');
    inputRef.current?.focus();
  };

  return (
    <div ref={containerRef} className="relative">
      {label && (
        <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1">
          {label} {required && <span className="text-red-500">*</span>}
        </label>
      )}
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          name={name}
          value={value}
          onChange={handleInputChange}
          onFocus={() => setIsOpen(true)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          required={required}
          className={`w-full px-3 py-2 pr-14 border border-[var(--card-border)] bg-[var(--card)] text-[var(--text-primary)] rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm placeholder:text-[var(--text-muted)] ${className}`}
        />
        <div className="absolute right-2 top-1/2 transform -translate-y-1/2 flex items-center gap-1">
          {value && (
            <button
              type="button"
              onClick={handleClear}
              className="p-1 text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
              aria-label="Temizle"
            >
              <X className="w-4 h-4" />
            </button>
          )}
          <button
            type="button"
            onClick={() => setIsOpen(!isOpen)}
            className="p-1 text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
            aria-label="Önerileri göster/gizle"
          >
            <ChevronDown
              className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`}
            />
          </button>
        </div>
      </div>

      {isOpen && filteredSuggestions.length > 0 && (
        <div className="absolute z-50 w-full mt-1 bg-[var(--card)] border border-[var(--card-border)] rounded-lg shadow-lg max-h-60 overflow-auto">
          {filteredSuggestions.map((suggestion, index) => (
            <button
              key={index}
              type="button"
              onClick={() => handleSelect(suggestion)}
              className={`w-full text-left px-3 py-2 text-sm hover:bg-[var(--hover-bg)] transition-colors ${
                index === highlightedIndex ? 'bg-[var(--active-bg)]' : ''
              } ${
                suggestion.toLowerCase() === value.toLowerCase()
                  ? 'font-semibold text-blue-600 dark:text-blue-400'
                  : 'text-[var(--text-primary)]'
              }`}
            >
              {suggestion}
            </button>
          ))}
        </div>
      )}

      {isOpen && filteredSuggestions.length === 0 && value.trim() !== '' && (
        <div className="absolute z-50 w-full mt-1 bg-[var(--card)] border border-[var(--card-border)] rounded-lg shadow-lg p-3 text-sm text-[var(--text-muted)]">
          Eşleşen öneri bulunamadı
        </div>
      )}
    </div>
  );
}

