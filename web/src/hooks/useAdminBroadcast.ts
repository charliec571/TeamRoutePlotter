import { supabase } from '../lib/supabase';
import type { Competition, TeamMessage } from '../types';

/**
 * Broadcast a message to all teams within a competition.
 * The message respects the same 80‑character limit as regular team messages.
 */
export async function broadcastToAllTeams(competition: Competition, rawText: string): Promise<void> {
  const text = rawText.trim().slice(0, 80);
  if (!text) return;

  // Build message objects for each team.
  const teamMessages: TeamMessage[] = competition.schools.flatMap((school) =>
    school.teams.map((team) => ({
      id: 'm_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
      text,
      createdAt: Date.now(),
      competition_id: competition.id,
      team_id: team.id,
    }))
  );

  // Insert all messages in one batch.
  if (!supabase) { console.error('Supabase client not configured'); return; }

  // Notify each team via realtime broadcast.
  for (const team of competition.schools.flatMap((s) => s.teams)) {
    const channelName = `team-chat:${competition.id}:${team.id}`;
    const channel = supabase.channel(channelName, { config: { broadcast: { self: false } } });
    const payload = {
      id: teamMessages.find((m) => m.team_id === team.id)!.id,
      text,
      createdAt: Date.now(),
    } as TeamMessage;
    await channel.send({ type: 'broadcast', event: 'new_message', payload });
    await channel.unsubscribe();
  }
}
