import { useState, useEffect } from 'react';

export function useVersionCheck() {
  const [currentVersion, setCurrentVersion] = useState<string | null>(null);
  const [newVersionAvailable, setNewVersionAvailable] = useState(false);

  useEffect(() => {
    let initialVersion: string | null = null;
    let checkInterval: NodeJS.Timeout;

    const checkVersion = async () => {
      try {
        const res = await fetch('/version.json?t=' + Date.now());
        if (!res.ok) return;
        const data = await res.json();
        
        if (!initialVersion) {
          initialVersion = data.version;
          setCurrentVersion(data.version);
        } else if (data.version !== initialVersion) {
          setNewVersionAvailable(true);
        }
      } catch (err) {
        // silently ignore fetch errors
      }
    };

    // Initial check
    checkVersion();

    // Poll every 5 minutes
    checkInterval = setInterval(checkVersion, 5 * 60 * 1000);

    return () => clearInterval(checkInterval);
  }, []);

  return { currentVersion, newVersionAvailable };
}
