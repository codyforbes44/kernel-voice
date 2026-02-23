import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { format, subDays, startOfDay, endOfDay } from 'date-fns';

interface ChartData {
  userGrowth: { date: string; users: number }[];
  conversationVolume: { date: string; conversations: number }[];
  voiceProviderUsage: { name: string; value: number }[];
  weeklyActivity: { day: string; active: number; new: number }[];
}

const DAYS_RANGE = 7;

const PROVIDER_LABELS: Record<string, string> = {
  openai: '3ʙɪ',
  elevenlabs: 'ElevenLabs',
  vapi: 'VAPI',
  gemini: 'Gemini Live',
};

export function useAdminChartData() {
  const [data, setData] = useState<ChartData>({
    userGrowth: [],
    conversationVolume: [],
    voiceProviderUsage: [],
    weeklyActivity: [],
  });
  const [loading, setLoading] = useState(true);

  const fetchChartData = useCallback(async () => {
    setLoading(true);
    const today = new Date();
    const rangeStart = startOfDay(subDays(today, DAYS_RANGE - 1)).toISOString();
    const rangeEnd = endOfDay(today).toISOString();

    const [profilesRes, conversationsRes, providerRes, activeProfilesRes] = await Promise.all([
      // User registrations in last 7 days
      supabase
        .from('profiles')
        .select('created_at')
        .gte('created_at', rangeStart)
        .lte('created_at', rangeEnd)
        .order('created_at', { ascending: true }),

      // Conversations in last 7 days
      supabase
        .from('conversations')
        .select('created_at')
        .gte('created_at', rangeStart)
        .lte('created_at', rangeEnd)
        .order('created_at', { ascending: true }),

      // Voice provider distribution from profiles
      supabase
        .from('profiles')
        .select('voice_provider'),

      // Active users (updated in last 7 days) for weekly activity
      supabase
        .from('profiles')
        .select('created_at, updated_at')
        .gte('updated_at', rangeStart)
        .lte('updated_at', rangeEnd),
    ]);

    // Build date buckets for the last 7 days
    const dateBuckets: string[] = [];
    for (let i = DAYS_RANGE - 1; i >= 0; i--) {
      dateBuckets.push(format(subDays(today, i), 'yyyy-MM-dd'));
    }

    // --- User Growth: cumulative count of new users per day ---
    const usersByDay = new Map<string, number>();
    dateBuckets.forEach(d => usersByDay.set(d, 0));
    (profilesRes.data || []).forEach(row => {
      const day = format(new Date(row.created_at!), 'yyyy-MM-dd');
      usersByDay.set(day, (usersByDay.get(day) || 0) + 1);
    });

    const userGrowth = dateBuckets.map(d => ({
      date: format(new Date(d), 'MMM d'),
      users: usersByDay.get(d) || 0,
    }));

    // --- Conversation Volume: count per day ---
    const convByDay = new Map<string, number>();
    dateBuckets.forEach(d => convByDay.set(d, 0));
    (conversationsRes.data || []).forEach(row => {
      const day = format(new Date(row.created_at), 'yyyy-MM-dd');
      convByDay.set(day, (convByDay.get(day) || 0) + 1);
    });

    const conversationVolume = dateBuckets.map(d => ({
      date: format(new Date(d), 'MMM d'),
      conversations: convByDay.get(d) || 0,
    }));

    // --- Voice Provider Usage: count per provider ---
    const providerCounts = new Map<string, number>();
    (providerRes.data || []).forEach(row => {
      const provider = row.voice_provider || 'openai';
      providerCounts.set(provider, (providerCounts.get(provider) || 0) + 1);
    });

    const voiceProviderUsage = Array.from(providerCounts.entries())
      .map(([key, value]) => ({
        name: PROVIDER_LABELS[key] || key,
        value,
      }))
      .sort((a, b) => b.value - a.value);

    // --- Weekly Activity: active users and new users per day ---
    const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const activeByDay = new Map<string, Set<string>>();
    const newByDay = new Map<string, number>();
    dateBuckets.forEach(d => {
      activeByDay.set(d, new Set());
      newByDay.set(d, 0);
    });

    (activeProfilesRes.data || []).forEach(row => {
      const updatedDay = format(new Date(row.updated_at!), 'yyyy-MM-dd');
      if (activeByDay.has(updatedDay)) {
        activeByDay.get(updatedDay)!.add(row.created_at!); // using created_at as unique proxy
      }
      // Check if this user was also created this week
      const createdDay = format(new Date(row.created_at!), 'yyyy-MM-dd');
      if (newByDay.has(createdDay) && createdDay === updatedDay) {
        // Only count as "new" if created_at matches the bucket (i.e., genuinely new)
      }
    });

    // For new users, reuse the profilesRes data
    (profilesRes.data || []).forEach(row => {
      const day = format(new Date(row.created_at!), 'yyyy-MM-dd');
      if (newByDay.has(day)) {
        newByDay.set(day, (newByDay.get(day) || 0) + 1);
      }
    });

    const weeklyActivity = dateBuckets.map(d => ({
      day: DAY_NAMES[new Date(d).getDay()],
      active: activeByDay.get(d)?.size || 0,
      new: newByDay.get(d) || 0,
    }));

    setData({ userGrowth, conversationVolume, voiceProviderUsage, weeklyActivity });
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchChartData();
  }, [fetchChartData]);

  return { data, loading, refetch: fetchChartData };
}
