import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface ProfileData {
  username: string;
  bio: string;
  avatar_url: string;
}

interface ProfileState {
  cachedProfile: ProfileData | null;
  setCachedProfile: (data: ProfileData) => void;
  clearProfileCache: () => void;
}

export const useProfileStore = create<ProfileState>()(
  persist(
    (set) => ({
      cachedProfile: null,
      setCachedProfile: (data) => set({ cachedProfile: data }),
      clearProfileCache: () => set({ cachedProfile: null }),
    }),
    {
      name: 'liora_profile_cache', 
    }
  )
);