import { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '../services/api';

// Converts a hex like #4F46E5 → "79 70 229" (RGB space-separated for Tailwind opacity utilities)
function hexToRgbParts(hex) {
  const h = hex.replace('#', '');
  const full = h.length === 3 ? h.split('').map(c => c + c).join('') : h;
  const r = parseInt(full.slice(0, 2), 16);
  const g = parseInt(full.slice(2, 4), 16);
  const b = parseInt(full.slice(4, 6), 16);
  return `${r} ${g} ${b}`;
}

function lighten(hex, amount = 0.9) {
  const h = hex.replace('#', '');
  const full = h.length === 3 ? h.split('').map(c => c + c).join('') : h;
  const r = Math.round(parseInt(full.slice(0, 2), 16) + (255 - parseInt(full.slice(0, 2), 16)) * amount);
  const g = Math.round(parseInt(full.slice(2, 4), 16) + (255 - parseInt(full.slice(2, 4), 16)) * amount);
  const b = Math.round(parseInt(full.slice(4, 6), 16) + (255 - parseInt(full.slice(4, 6), 16)) * amount);
  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
}

export function useBranding() {
  const { data: org } = useQuery({
    queryKey: ['org'],
    queryFn: () => api.get('/org').then(r => r.data),
    staleTime: 5 * 60 * 1000,
  });

  useEffect(() => {
    const root = document.documentElement;

    if (org?.brandPrimary) {
      const rgb = hexToRgbParts(org.brandPrimary);
      root.style.setProperty('--color-primary', rgb);
      root.style.setProperty('--color-primary-hex', org.brandPrimary);
      // lighter shade for hover states
      root.style.setProperty('--color-primary-light', hexToRgbParts(lighten(org.brandPrimary, 0.85)));
    } else {
      root.style.removeProperty('--color-primary');
      root.style.removeProperty('--color-primary-hex');
      root.style.removeProperty('--color-primary-light');
    }

    if (org?.brandAccent) {
      root.style.setProperty('--color-accent', hexToRgbParts(org.brandAccent));
      root.style.setProperty('--color-accent-hex', org.brandAccent);
    } else {
      root.style.removeProperty('--color-accent');
      root.style.removeProperty('--color-accent-hex');
    }

    if (org?.brandBg) {
      root.style.setProperty('--color-brand-bg', org.brandBg);
    } else {
      root.style.removeProperty('--color-brand-bg');
    }

    // Favicon swap
    if (org?.brandFaviconUrl) {
      let link = document.querySelector("link[rel~='icon']");
      if (!link) {
        link = document.createElement('link');
        link.rel = 'icon';
        document.head.appendChild(link);
      }
      link.href = org.brandFaviconUrl;
    }

    // Page title
    if (org?.name) {
      document.title = org.name;
    }
  }, [org?.brandPrimary, org?.brandAccent, org?.brandBg, org?.brandFaviconUrl, org?.name]);

  return { org };
}
