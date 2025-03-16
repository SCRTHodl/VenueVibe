import React, { createContext, useState, useEffect, useContext, useCallback } from 'react';
import { toast } from 'react-hot-toast';
import { supabase } from '../lib/supabase';
import { InviteCode, EventTheme, Group, Post, PromotionSettings } from '../types';
// TODO: Fix import when mockData is properly implemented
// import { TEST_GROUPS, MOCK_POSTS } from '../mockData';

// Temporary mock data directly in this file to avoid import issues
// Extended Group type with additional properties needed for this context
interface ExtendedGroup extends Group {
  inviteCode?: string;
  eventTheme?: EventTheme;
}

const TEST_GROUPS: ExtendedGroup[] = [];
const MOCK_POSTS: Post[] = [];

interface InviteCodeContextType {
  inviteCodes: InviteCode[];
  activeEventTheme: EventTheme | null;
  filteredByInviteCode: boolean;
  setInviteCodes: React.Dispatch<React.SetStateAction<InviteCode[]>>;
  setActiveEventTheme: React.Dispatch<React.SetStateAction<EventTheme | null>>;
  setFilteredByInviteCode: React.Dispatch<React.SetStateAction<boolean>>;
  setShowInviteCodeEntry: React.Dispatch<React.SetStateAction<boolean>>;
  setPromotionSettings: React.Dispatch<React.SetStateAction<PromotionSettings>>;
  handleInviteCodeSuccess: (inviteCode: string, theme?: EventTheme) => void;
  loadInviteCodes: () => Promise<void>;
  handleCreateInviteCode: (newInviteCode: Partial<InviteCode>) => Promise<void>;
  toggleInviteCodeStatus: (id: string, is_active: boolean) => Promise<void>;
  resetFilters: () => void;
  showInviteCodeEntry: boolean;
  setExternalSetters: (
    postsUpdater: React.Dispatch<React.SetStateAction<Post[]>>,
    groupsUpdater: React.Dispatch<React.SetStateAction<Group[]>>,
    promotionSettingsUpdater: React.Dispatch<React.SetStateAction<PromotionSettings>>,
    bannerUpdater: React.Dispatch<React.SetStateAction<boolean>>
  ) => void;
}

const InviteCodeContext = createContext<InviteCodeContextType | undefined>(undefined);

export const InviteCodeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [inviteCodes, setInviteCodes] = useState<InviteCode[]>([]);
  const [activeEventTheme, setActiveEventTheme] = useState<EventTheme | null>(null);
  const [showInviteCodeEntry, setShowInviteCodeEntry] = useState<boolean>(false);
  const [filteredByInviteCode, setFilteredByInviteCode] = useState<boolean>(false);
  
  // External state setters that need to be updated
  const [externalSetters, setExternalSetters] = 
    useState<{
      setPosts: React.Dispatch<React.SetStateAction<Post[]>>,
      setGroups: React.Dispatch<React.SetStateAction<Group[]>>,
      setPromotionSettings: React.Dispatch<React.SetStateAction<PromotionSettings>>,
      setShowBanner: React.Dispatch<React.SetStateAction<boolean>>
    }>({setPosts: () => {}, setGroups: () => {}, setPromotionSettings: () => {}, setShowBanner: () => {}});

  // Set the external state setters from the parent component
  const updateExternalSetters = useCallback((
    postsUpdater: React.Dispatch<React.SetStateAction<Post[]>>,
    groupsUpdater: React.Dispatch<React.SetStateAction<Group[]>>,
    promotionSettingsUpdater: React.Dispatch<React.SetStateAction<PromotionSettings>>,
    bannerUpdater: React.Dispatch<React.SetStateAction<boolean>>
  ) => {
    setExternalSetters({
      setPosts: postsUpdater,
      setGroups: groupsUpdater,
      setPromotionSettings: promotionSettingsUpdater,
      setShowBanner: bannerUpdater
    });
  }, []);

  const handleInviteCodeSuccess = useCallback((inviteCode: string, theme?: EventTheme) => {
    // Close modal
    setShowInviteCodeEntry(false);
    
    // Display success message
    toast.success(`Invite code ${inviteCode} accepted!`);
    
    // Set active theme if provided
    if (theme) {
      // Update the active event theme
      setActiveEventTheme(theme);
      
      // Show the promotional banner with the new theme
      externalSetters.setShowBanner(true);
      
      // Also update the promotion settings to use this theme
      externalSetters.setPromotionSettings((prev: PromotionSettings) => ({
        ...prev,
        promotionTheme: theme,
        isEnabled: true // Enable promotions when using a themed invite code
      }));
      
      // Display a themed welcome message
      toast.success(`Welcome to ${theme.name} experience!`, {
        icon: '✨',
        duration: 5000
      });
    }
    
    // Filter groups by invite code
    const filteredGroups = TEST_GROUPS.filter(group => 
      group.inviteCode === inviteCode || 
      (theme && group.eventTheme?.id === theme.id)
    );
    
    if (filteredGroups.length > 0) {
      // Update state with proper type annotations
      externalSetters.setGroups(filteredGroups);
      setFilteredByInviteCode(true);
      
      // Filter posts to match the filtered groups
      const groupIds = filteredGroups.map((g: Group) => g.id);
      // Ensure proper typing with comments as an array
      const filteredPosts = MOCK_POSTS.filter((post: Post) => 
        post.venue && groupIds.includes(post.venue.id)
      ).map((post: Post) => ({
        ...post,
        comments: Array.isArray(post.comments) ? post.comments : []
      }));
      
      externalSetters.setPosts(filteredPosts);
    } else {
      toast.error("No venues found for this invite code");
    }
  }, [externalSetters]);

  const loadInviteCodes = useCallback(async () => {
    try {
      // Use public schema for invite codes
      const { data, error } = await supabase
        .from('invite_codes')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) {
        throw error;
      }
      
      // Map the returned data to match our InviteCode interface
      const formattedCodes: InviteCode[] = data.map(code => ({
        id: code.id,
        code: code.code,
        is_active: code.is_active,
        created_at: code.created_at,
        expiry_date: code.expiry_date || code.expires_at, // Support both field names
        max_uses: code.max_uses,
        uses: code.uses || code.current_uses, // Support both field names
        created_by: code.created_by,
        themeId: code.theme_id
      }));
      
      setInviteCodes(formattedCodes);
    } catch (error) {
      console.error("Error loading invite codes:", error);
      toast.error("Failed to load invite codes");
    }
  }, []);

  const handleCreateInviteCode = useCallback(async (newInviteCode: Partial<InviteCode>) => {
    try {
      // Check if user is logged in and has admin rights
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error("You must be logged in to create invite codes");
      }
      
      // Check if user is admin
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('is_admin')
        .eq('id', user.id)
        .single();
      
      if (userError || !userData?.is_admin) {
        throw new Error("You must be an admin to create invite codes");
      }
      
      // Create the invite code in the database
      // Use public schema for invite codes
      const { data, error } = await supabase
        .from('invite_codes')
        .insert([{

            code: newInviteCode.code,
            is_active: newInviteCode.is_active !== undefined ? newInviteCode.is_active : true,
            max_uses: newInviteCode.max_uses || 100,
            uses: 0,
            theme_id: newInviteCode.themeId || null,
            created_by: user.id,
            expiry_date: newInviteCode.expiry_date || null
          }
        ])
        .select();
      
      if (error) {
        throw error;
      }
      
      // Add the new invite code to state
      const formattedCode: InviteCode = {
        id: data[0].id,
        code: data[0].code,
        is_active: data[0].is_active,
        created_at: data[0].created_at,
        expiry_date: data[0].expiry_date || data[0].expires_at,
        max_uses: data[0].max_uses,
        uses: data[0].uses || data[0].current_uses,
        created_by: data[0].created_by,
        themeId: data[0].theme_id
      };
      
      setInviteCodes(prevCodes => [formattedCode, ...prevCodes]);
      toast.success(`Invite code "${newInviteCode.code}" created`);
      
    } catch (error) {
      console.error("Error creating invite code:", error);
      toast.error(error instanceof Error ? error.message : "Failed to create invite code");
    }
  }, []);

  const toggleInviteCodeStatus = useCallback(async (id: string, is_active: boolean) => {
    try {
      // Use public schema for invite codes
      const { error } = await supabase
        .from('invite_codes')
        .update({ is_active })
        .eq('id', id);
      
      if (error) {
        throw error;
      }
      
      // Update the state
      setInviteCodes(prevCodes => 
        prevCodes.map(code => 
          code.id === id ? { ...code, is_active } : code
        )
      );
      
      toast.success(`Invite code ${is_active ? 'activated' : 'deactivated'}`);
    } catch (error) {
      console.error("Error toggling invite code status:", error);
      toast.error("Failed to update invite code");
    }
  }, []);

  const resetFilters = useCallback(() => {
    // Clear filters and reset to default state
    setFilteredByInviteCode(false);
    setActiveEventTheme(null);
    
    // Reset to all groups
    externalSetters.setGroups(TEST_GROUPS);
    
    // Reset to all posts with proper comment typing
    const allPosts = MOCK_POSTS.map((post: Post) => ({
      ...post,
      comments: Array.isArray(post.comments) ? post.comments : []
    }));
    externalSetters.setPosts(allPosts);
    
    toast.success("Filters reset");
  }, [externalSetters]);

  useEffect(() => {
    loadInviteCodes();
  }, [loadInviteCodes]);

  return (
    <InviteCodeContext.Provider
      value={{
        inviteCodes,
        activeEventTheme,
        filteredByInviteCode,
        setInviteCodes,
        setActiveEventTheme,
        setFilteredByInviteCode,
        showInviteCodeEntry,
        setShowInviteCodeEntry,
        setPromotionSettings: externalSetters.setPromotionSettings,
        handleInviteCodeSuccess,
        loadInviteCodes,
        handleCreateInviteCode,
        toggleInviteCodeStatus,
        resetFilters,
        setExternalSetters: updateExternalSetters
      }}
    >
      {children}
    </InviteCodeContext.Provider>
  );
};

export const useInviteCode = () => {
  const context = useContext(InviteCodeContext);
  if (context === undefined) {
    throw new Error('useInviteCode must be used within an InviteCodeProvider');
  }
  return context;
};
