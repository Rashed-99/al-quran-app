import React, { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from './utils';
import { Home, BookOpen, Users, Heart, Settings } from 'lucide-react';

const navItems = [
  { name: 'Home', icon: Home, page: 'Home' },
  { name: 'Explore', icon: BookOpen, page: 'Explore' },
  { name: 'Groups', icon: Users, page: 'Groups' },
  { name: 'Favorites', icon: Heart, page: 'Favorites' },
  { name: 'Settings', icon: Settings, page: 'Settings' },
];

export default function Layout({ children, currentPageName }) {
  // Hide nav on reading pages for immersive experience
  const hideNav = currentPageName === 'Reading' || currentPageName === 'QuranReader' || currentPageName === 'StandaloneReader' || currentPageName === 'Companion';

  // Apply dark mode from localStorage
  useEffect(() => {
    const isDark = localStorage.getItem('darkMode') !== 'false';
    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, []);

  // Preserve scroll position per tab so switching tabs doesn't reset the view
  const scrollPositions = useRef({});

  useEffect(() => {
    const handleScroll = () => {
      scrollPositions.current[currentPageName] = window.scrollY;
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [currentPageName]);

  useEffect(() => {
    const saved = scrollPositions.current[currentPageName] || 0;
    requestAnimationFrame(() => window.scrollTo(0, saved));
  }, [currentPageName]);

  return (
    <div className="min-h-screen overscroll-none" style={{ overscrollBehaviorY: 'none', background: 'var(--app-bg)' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Amiri:wght@400;700&family=Amiri+Quran&family=Scheherazade+New:wght@400;700&family=Noto+Naskh+Arabic:wght@400;700&display=swap');
        @font-face {
          font-family: 'PDMS Saleem QuranFont';
          src: url('https://cdn.jsdelivr.net/gh/ArabicFonts/pdms-saleem-quranfont@1.1/PDMS_Saleem_QuranFont.ttf') format('truetype');
        }
        @font-face {
          font-family: 'Al Mushaf';
          src: url('https://cdn.jsdelivr.net/gh/ArabicFonts/al-mushaf@1.0/al-mushaf.ttf') format('truetype');
        }
        /* NOTE: 'Kitab' is intentionally NOT declared here - it's declared
           once in index.css (self-hosted from /fonts/Kitab-Regular.woff2,
           see docs/05_FONT_SETUP.md). This file previously ALSO declared a
           'Kitab' @font-face pointing at a different CDN source, which
           created a naming collision - two @font-face rules for the same
           family name from different sources is undefined/unpredictable
           which one wins. Consolidated to the one documented source. */
        .font-arabic {
          font-family: 'Amiri', 'Traditional Arabic', serif;
        }
        .font-indopak {
          font-family: 'PDMS Saleem QuranFont', 'Al Mushaf', 'Noto Naskh Arabic', serif;
          line-height: 2.5;
        }
        .font-quran {
          font-family: 'PDMS Saleem QuranFont', 'Al Mushaf', serif;
          line-height: 2.5;
        }
        html, body {
          overscroll-behavior-y: none;
        }
        .safe-area-top {
          padding-top: env(safe-area-inset-top);
        }
        .safe-area-bottom {
          padding-bottom: env(safe-area-inset-bottom);
        }
        .safe-area-pb {
          padding-bottom: calc(1rem + env(safe-area-inset-bottom));
        }
        .safe-area-pt {
          padding-top: env(safe-area-inset-top);
        }
        .safe-area-px {
          padding-left: env(safe-area-inset-left);
          padding-right: env(safe-area-inset-right);
        }
      `}</style>
      
      {/* Main content */}
      <main className={`${hideNav ? '' : 'pb-24'}`} style={{ paddingBottom: hideNav ? undefined : `calc(6rem + env(safe-area-inset-bottom))` }}>
        {children}
      </main>

      {/* Bottom Navigation - this persists on every page except the
          immersive reading pages, so it being hardcoded dark regardless of
          theme was very likely the single biggest reason light mode looked
          "incomplete" everywhere, including on Settings itself. */}
      {!hideNav && (
        <nav className="fixed bottom-0 left-0 right-0 z-50 select-none" style={{ paddingBottom: 'env(safe-area-inset-bottom)', background: 'var(--app-bar-bg)', borderTop: '1px solid var(--app-divider)', backdropFilter: 'blur(16px)' }}>
          <div className="max-w-lg mx-auto px-4">
            <div className="flex items-center justify-around py-2">
              {navItems.map((item) => {
                const isActive = currentPageName === item.page;
                return (
                  <Link
                    key={item.name}
                    to={createPageUrl(item.page)}
                    className="flex flex-col items-center gap-1 py-2 px-4 rounded-xl transition-all select-none touch-manipulation"
                    style={{ color: isActive ? '#a78bfa' : 'var(--app-text-tertiary)' }}
                  >
                    <item.icon className={`w-5 h-5 select-none ${isActive ? 'stroke-2' : ''}`} />
                    <span className="text-xs font-medium select-none">{item.name}</span>
                    {isActive && (
                      <div className="absolute bottom-1 w-1 h-1 rounded-full bg-violet-400" />
                    )}
                  </Link>
                );
              })}
            </div>
          </div>
        </nav>
      )}
    </div>
  );
}