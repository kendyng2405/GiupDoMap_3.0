import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { ModerationWorkspace } from './components/ModerationWorkspace';
import { GuidelinesModal } from './components/GuidelinesModal';
import { Heart } from 'lucide-react';

export default function App() {
  const [isGuidelinesOpen, setIsGuidelinesOpen] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);

  useEffect(() => {
    // Check initial theme from localStorage or parent
    const checkTheme = () => {
      const theme = localStorage.getItem('ttv_theme') || 'light';
      if (theme === 'dark') {
        setIsDarkMode(true);
        document.documentElement.classList.add('dark');
      } else {
        setIsDarkMode(false);
        document.documentElement.classList.remove('dark');
      }
    };
    
    checkTheme();
    
    // Simple interval to sync theme with parent if changed without reload
    const interval = setInterval(checkTheme, 500);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className={`min-h-screen font-sans selection:bg-red-100 selection:text-red-900 ${isDarkMode ? 'bg-gray-900 text-gray-100' : 'bg-gradient-to-b from-red-50/40 via-gray-50 to-red-50/20 text-gray-900'}`}>
      
      {/* Top Navigation Header */}
      <Header
        onOpenGuidelines={() => setIsGuidelinesOpen(true)}
      />

      {/* Main Container */}
      <main className="flex-1 py-4">
        <ModerationWorkspace />
      </main>

      <GuidelinesModal
        isOpen={isGuidelinesOpen}
        onClose={() => setIsGuidelinesOpen(false)}
      />
    </div>
  );
}
