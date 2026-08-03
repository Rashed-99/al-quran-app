import React, { useState, useEffect } from 'react';
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from '@/components/ui/drawer';
import { Check } from 'lucide-react';

export const FONTS = [
  {
    id: 'kitab',
    name: 'Kitab',
    fontFamily: "'Kitab', serif",
    lineHeight: 2.5,
  },
  {
    id: 'madina',
    name: 'Madina (Amiri Quran)',
    fontFamily: "'Amiri Quran', 'Amiri', serif",
    lineHeight: 2.5,
  },
  {
    id: 'indopak',
    name: 'Indo Pak Script',
    fontFamily: "'IndoPak Nastaleeq', 'Al Mushaf', serif",
    // Nastaleeq-style IndoPak fonts stack diacritics more vertically than
    // Uthmani-style fonts, so they read cleanly with more line-height.
    lineHeight: 3.1,
  },
  {
    id: 'scheherazade',
    name: 'Scheherazade',
    fontFamily: "'Scheherazade New', serif",
    lineHeight: 2.5,
  },
  {
    id: 'wordbyword',
    name: 'Word By Word Quran',
    fontFamily: "'Noto Naskh Arabic', serif",
    lineHeight: 2.3,
  },
];

export function getFontStyle(fontId) {
  const font = FONTS.find(f => f.id === fontId) || FONTS[0];
  return { fontFamily: font.fontFamily, lineHeight: font.lineHeight };
}

export default function FontPicker({ open, onOpenChange, currentFont, onFontChange }) {
  const [previewFont, setPreviewFont] = useState(currentFont);

  useEffect(() => {
    if (open) setPreviewFont(currentFont);
  }, [currentFont, open]);

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="max-h-[92vh]" style={{ background: '#e8e2d4' }}>
        <DrawerHeader className="text-center">
          <DrawerTitle style={{ color: '#1a3c34' }}>Quran Script</DrawerTitle>
        </DrawerHeader>
        <div className="overflow-y-auto px-4 pb-8 flex-1 safe-area-pb">
          <p className="text-sm text-center mb-5 mt-1 select-none" style={{ color: '#8c7b4a' }}>
            Pick a font — see how each typeface renders
          </p>
          <div className="w-full max-w-md mx-auto space-y-3">
            {FONTS.map((f) => {
              const isSelected = previewFont === f.id;
              return (
                <button
                  key={f.id}
                  onClick={() => { onFontChange(f.id); setPreviewFont(f.id); }}
                  className="w-full p-4 rounded-2xl text-left touch-manipulation transition-all"
                  style={{
                    background: isSelected ? '#f5efdf' : '#f0ead8',
                    border: isSelected ? '2px solid #c5b37e' : '2px solid transparent',
                  }}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-semibold uppercase tracking-wider select-none" style={{ color: '#8c7b4a' }}>
                      {f.name}
                    </span>
                    {isSelected && <Check className="w-4 h-4" style={{ color: '#1a3c34' }} />}
                  </div>
                  <p
                    className="text-2xl text-center select-none"
                    dir="rtl"
                    style={{ fontFamily: f.fontFamily, lineHeight: 2, color: '#1a3c34' }}
                  >
                    بِسْمِ اللَّهِ الرَّحْمَنِ الرَّحِيمِ
                  </p>
                </button>
              );
            })}
          </div>
        </div>
      </DrawerContent>
    </Drawer>
  );
}