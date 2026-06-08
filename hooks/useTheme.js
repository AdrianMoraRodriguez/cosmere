import { useState, useEffect } from 'react';

export function useTheme() {
  const [theme, setTheme] = useState('dark');

  useEffect(() => {
    const saved = localStorage.getItem('wiki-theme') || 'dark';
    applyTheme(saved);
    setTheme(saved);
  }, []);

  const toggle = () => {
    const next = theme === 'dark' ? 'gradient' : 'dark';
    applyTheme(next);
    setTheme(next);
    localStorage.setItem('wiki-theme', next);
  };

  return { theme, toggle };
}

function applyTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme);
  document.body.setAttribute('data-theme', theme);
}
