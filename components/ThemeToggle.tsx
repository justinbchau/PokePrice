'use client';

import { useState, useEffect } from 'react';

export default function ThemeToggle() {
  const [darkMode, setDarkMode] = useState(true);

  useEffect(() => {
    const root = document.documentElement;
    if (darkMode) {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, [darkMode]);

  return (
    <button
      onClick={() => setDarkMode(!darkMode)}
      className="relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 bg-gray-700 dark:bg-blue-600"
    >
      <span className="sr-only">Toggle theme</span>
      <span
        className={`${
          darkMode ? 'translate-x-6' : 'translate-x-1'
        } inline-block h-4 w-4 transform rounded-full bg-white transition-transform`}
      >
        {darkMode ? (
          <span className="absolute inset-0 flex items-center justify-center text-[10px]">🌙</span>
        ) : (
          <span className="absolute inset-0 flex items-center justify-center text-[10px]">☀️</span>
        )}
      </span>
    </button>
  );
} 