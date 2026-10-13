'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useLanguage } from '@/context/LanguageContext';
import { Globe, ChevronDown, Check } from 'lucide-react';

export default function LanguageSelector({
  variant = 'navbar',
  className = '',
  showLabel = true,
}) {
  const { language, setLanguage, languages, currentLanguage, t } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const [focusedIndex, setFocusedIndex] = useState(-1);
  const containerRef = useRef(null);
  const dropdownRef = useRef(null);

  // Close when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Keyboard navigation
  const handleKeyDown = (e) => {
    if (e.key === 'Escape') {
      setIsOpen(false);
      return;
    }

    if (!isOpen && (e.key === 'Enter' || e.key === ' ' || e.key === 'ArrowDown')) {
      e.preventDefault();
      setIsOpen(true);
      setFocusedIndex(languages.findIndex((l) => l.code === language));
      return;
    }

    if (isOpen) {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setFocusedIndex((prev) => (prev + 1) % languages.length);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setFocusedIndex((prev) => (prev - 1 + languages.length) % languages.length);
      } else if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        if (focusedIndex >= 0 && focusedIndex < languages.length) {
          setLanguage(languages[focusedIndex].code);
          setIsOpen(false);
        }
      }
    }
  };

  const handleSelectLanguage = (code) => {
    setLanguage(code);
    setIsOpen(false);
  };

  return (
    <div
      ref={containerRef}
      className={`kf-lang-selector-wrap ${variant} ${className}`}
      onKeyDown={handleKeyDown}
      style={{ position: 'relative', display: 'inline-block' }}
    >
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-label={`${t('common.selectLanguage', 'Select Language')}: ${currentLanguage.nativeName}`}
        className={`kf-lang-btn ${variant}`}
      >
        <span className="kf-lang-globe-icon" aria-hidden="true">
          <Globe size={16} />
        </span>
        {showLabel && (
          <span className="kf-lang-label">
            {currentLanguage.nativeName}
          </span>
        )}
        <ChevronDown
          size={14}
          className={`kf-lang-chevron ${isOpen ? 'rotate' : ''}`}
          aria-hidden="true"
        />
      </button>

      {isOpen && (
        <div
          ref={dropdownRef}
          role="listbox"
          aria-label={t('common.selectLanguage', 'Select Language')}
          className="kf-lang-dropdown"
        >
          <div className="kf-lang-dropdown-header">
            <span>{t('common.selectLanguage', 'Select Language')}</span>
          </div>

          <div className="kf-lang-options-list">
            {languages.map((lang, idx) => {
              const isSelected = lang.code === language;
              const isFocused = idx === focusedIndex;

              return (
                <button
                  key={lang.code}
                  role="option"
                  type="button"
                  aria-selected={isSelected}
                  onClick={() => handleSelectLanguage(lang.code)}
                  className={`kf-lang-option ${isSelected ? 'selected' : ''} ${
                    isFocused ? 'focused' : ''
                  }`}
                >
                  <div className="kf-lang-option-text">
                    <span className="kf-lang-native">{lang.nativeName}</span>
                    <span className="kf-lang-english">({lang.name})</span>
                  </div>
                  {isSelected && (
                    <Check size={16} className="kf-lang-check" aria-hidden="true" />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
