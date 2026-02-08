'use client';

import { useEffect } from 'react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://classinnews-admin-backend.onrender.com';

export function DynamicFavicon() {
  useEffect(() => {
    async function loadFavicon() {
      try {
        const res = await fetch(`${API_URL}/api/settings/branding`);
        if (res.ok) {
          const data = await res.json();
          const branding = data.data;
          if (branding?.site_favicon_url) {
            const faviconUrl = branding.site_favicon_url.startsWith('http')
              ? branding.site_favicon_url
              : `${API_URL}${branding.site_favicon_url}`;

            // Update or create favicon link elements
            let link = document.querySelector("link[rel='icon']") as HTMLLinkElement | null;
            if (!link) {
              link = document.createElement('link');
              link.rel = 'icon';
              document.head.appendChild(link);
            }
            link.href = faviconUrl;

            let shortcut = document.querySelector("link[rel='shortcut icon']") as HTMLLinkElement | null;
            if (!shortcut) {
              shortcut = document.createElement('link');
              shortcut.rel = 'shortcut icon';
              document.head.appendChild(shortcut);
            }
            shortcut.href = faviconUrl;
          }
        }
      } catch (error) {
        console.error('Failed to fetch branding:', error);
      }
    }

    loadFavicon();
  }, []);

  return null;
}
