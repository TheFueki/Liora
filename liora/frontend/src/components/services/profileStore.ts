import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface ProfileData {
  username: string;
  bio: string;
  avatar_url: string;
}

interface ProfileState {
  profiles: Record<string, ProfileData>; 
  getProfileForUser: (myID: string) => ProfileData | null;
  setProfileForUser: (myID: string, data: ProfileData) => void;
  clearProfileCache: (myID: string) => void;
}

export const useProfileStore = create<ProfileState>()(
  persist(
    (set, get) => ({
      profiles: {},
      getProfileForUser: (myID) => get().profiles[myID] || null,
      setProfileForUser: (myID, data) => set((state) => ({
        profiles: { ...state.profiles, [myID]: data }
      })),
      clearProfileCache: (myID) => set((state) => {
        const updatedProfiles = { ...state.profiles };
        delete updatedProfiles[myID];
        return { profiles: updatedProfiles };
      }),
    }),
    {
      name: 'multi_profile_cache',
    }
  )
);