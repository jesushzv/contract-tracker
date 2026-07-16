import { useState, useEffect } from 'react';
import { Profile } from '@/lib/types';
import { getProfile } from '@/lib/storageClient';

export function useProfile() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isDemo, setIsDemo] = useState(false);

  useEffect(() => {
    // Basic initialization for profile extraction
    const loadProfile = async () => {
      try {
        const loadedProfile = await getProfile();
        setProfile(loadedProfile);
        setIsDemo(loadedProfile?.tier === 'free');
      } catch (e) {
        console.error("Failed to load profile", e);
      }
    };
    loadProfile();
  }, []);

  return {
    profile,
    setProfile,
    isDemo,
    setIsDemo
  };
}
