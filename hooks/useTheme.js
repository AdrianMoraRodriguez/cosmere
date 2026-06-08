import { useState, useEffect } from 'react';

export const THEMES = {
  caminapiedras: {
    name: 'Caminapiedras',
    swatchGradient: 'linear-gradient(135deg, #1e3a8a, #065f46, #581c87)',
  },
  odium: {
    name: 'Odium',
    swatchGradient: 'linear-gradient(135deg, #951c0f, #550790, #d8c41a)',
  },
  honor: {
    name: 'Honor',
    swatchGradient: 'linear-gradient(135deg, #2a9bbd, #c6e3e7, #d8c41a)',
  },
  cultivacion: {
    name: 'Cultivación',
    swatchGradient: 'linear-gradient(135deg, #495d3a, #287f79, #865743)',
  },
  'sangre-espectral': {
    name: 'Sangre Espectral',
    swatchGradient: 'linear-gradient(135deg, #91040a, #909090)',
  },
  'ojos-de-palah': {
    name: 'Ojos de Palah',
    swatchGradient: 'linear-gradient(135deg, #659b69, #d0b774)',
  },
};

export function useTheme() {
  const [theme, setThemeState] = useState('caminapiedras');

  useEffect(() => {
    const saved = localStorage.getItem('wiki-theme') || 'caminapiedras';
    applyTheme(saved);
    setThemeState(saved);
  }, []);

  const setTheme = (name) => {
    applyTheme(name);
    setThemeState(name);
    localStorage.setItem('wiki-theme', name);
  };

  return { theme, setTheme };
}

function applyTheme(t) {
  document.documentElement.setAttribute('data-theme', t);
  document.body.setAttribute('data-theme', t);
}
