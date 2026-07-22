-- ═══════════════════════════════════════════════════════════════════
-- Team Route Plotter — Supabase Database Schema
-- Run this in: Supabase Dashboard → SQL Editor → New Query → Run
-- ═══════════════════════════════════════════════════════════════════

-- 1. Competitions (Meets)
CREATE TABLE IF NOT EXISTS competitions (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT NOT NULL,
  location    TEXT,
  date        TEXT,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Points of Interest (event pin locations)
CREATE TABLE IF NOT EXISTS points (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  competition_id UUID NOT NULL REFERENCES competitions(id) ON DELETE CASCADE,
  name           TEXT NOT NULL,
  latitude       DOUBLE PRECISION NOT NULL,
  longitude      DOUBLE PRECISION NOT NULL,
  display_order  INTEGER NOT NULL DEFAULT 0
);
CREATE INDEX IF NOT EXISTS idx_points_competition_id ON points(competition_id);

-- 3. Groups (teams with a route order)
CREATE TABLE IF NOT EXISTS groups (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  competition_id UUID NOT NULL REFERENCES competitions(id) ON DELETE CASCADE,
  name           TEXT NOT NULL,
  route_order    TEXT[] NOT NULL DEFAULT '{}'  -- ordered array of point UUIDs
);
CREATE INDEX IF NOT EXISTS idx_groups_competition_id ON groups(competition_id);

-- ═══════════════════════════════════════════════════════════════════
-- Row Level Security (RLS) — public read, no auth write for now
-- ═══════════════════════════════════════════════════════════════════
ALTER TABLE competitions ENABLE ROW LEVEL SECURITY;
ALTER TABLE points       ENABLE ROW LEVEL SECURITY;
ALTER TABLE groups       ENABLE ROW LEVEL SECURITY;

-- Anyone can read (for the public spectator view)
CREATE POLICY "Public read competitions" ON competitions FOR SELECT USING (true);
CREATE POLICY "Public read points"       ON points       FOR SELECT USING (true);
CREATE POLICY "Public read groups"       ON groups       FOR SELECT USING (true);

-- Anyone can write (admin PIN/auth can be added later)
CREATE POLICY "Public write competitions" ON competitions FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public write points"       ON points       FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public write groups"       ON groups       FOR ALL USING (true) WITH CHECK (true);
