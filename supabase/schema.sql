-- סנדרין — סכימת מסד הנתונים
-- להריץ ב-Supabase SQL Editor

-- קודי כניסה לזוגות
CREATE TABLE IF NOT EXISTS access_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL UNIQUE,
  auth_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS access_codes_code_idx ON access_codes(code);
CREATE INDEX IF NOT EXISTS access_codes_user_idx ON access_codes(auth_user_id);

ALTER TABLE access_codes ENABLE ROW LEVEL SECURITY;
GRANT ALL ON TABLE public.access_codes TO service_role;

-- אירוע חתונה
CREATE TABLE IF NOT EXISTS events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  groom_name TEXT NOT NULL,
  bride_name TEXT NOT NULL,
  event_date DATE NOT NULL,
  groom_phone TEXT,
  bride_phone TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- שולחנות באולם
CREATE TABLE IF NOT EXISTS tables (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID REFERENCES events(id) ON DELETE CASCADE NOT NULL,
  table_number INT NOT NULL,
  capacity INT NOT NULL DEFAULT 10,
  shape TEXT NOT NULL DEFAULT 'round', -- 'round' | 'rectangular'
  pos_x FLOAT NOT NULL DEFAULT 0,
  pos_y FLOAT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- מוזמנים
CREATE TABLE IF NOT EXISTS guests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID REFERENCES events(id) ON DELETE CASCADE NOT NULL,
  full_name TEXT NOT NULL,
  phone_number TEXT NOT NULL,
  side TEXT NOT NULL DEFAULT 'משותף', -- 'חתן' | 'כלה' | 'משותף'
  group_tag TEXT NOT NULL DEFAULT 'כללי',
  invited_pax INT NOT NULL DEFAULT 1,
  confirmed_pax INT NOT NULL DEFAULT 0,
  rsvp_status TEXT NOT NULL DEFAULT 'טרם ענה', -- 'מגיע' | 'לא מגיע' | 'טרם ענה'
  table_id UUID REFERENCES tables(id) ON DELETE SET NULL,
  rsvp_token UUID DEFAULT gen_random_uuid() UNIQUE,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS tables_event_number_idx ON tables(event_id, table_number);
CREATE INDEX IF NOT EXISTS guests_event_id_idx ON guests(event_id);
CREATE INDEX IF NOT EXISTS guests_table_id_idx ON guests(table_id);
CREATE INDEX IF NOT EXISTS guests_rsvp_token_idx ON guests(rsvp_token);
CREATE INDEX IF NOT EXISTS events_user_id_idx ON events(user_id);

ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE tables ENABLE ROW LEVEL SECURITY;
ALTER TABLE guests ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS events_select_own ON events;
DROP POLICY IF EXISTS events_insert_own ON events;
DROP POLICY IF EXISTS events_update_own ON events;
DROP POLICY IF EXISTS events_delete_own ON events;
DROP POLICY IF EXISTS tables_all_own ON tables;
DROP POLICY IF EXISTS guests_all_own ON guests;

CREATE POLICY events_select_own ON events
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY events_insert_own ON events
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY events_update_own ON events
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY events_delete_own ON events
  FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY tables_all_own ON tables
  FOR ALL
  USING (EXISTS (SELECT 1 FROM events e WHERE e.id = tables.event_id AND e.user_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM events e WHERE e.id = tables.event_id AND e.user_id = auth.uid()));

CREATE POLICY guests_all_own ON guests
  FOR ALL
  USING (EXISTS (SELECT 1 FROM events e WHERE e.id = guests.event_id AND e.user_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM events e WHERE e.id = guests.event_id AND e.user_id = auth.uid()));

-- דף RSVP ציבורי (ללא התחברות) — פונקציות מאובטחות לפי טוקן
CREATE OR REPLACE FUNCTION public.get_rsvp_context(p_token uuid)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  result json;
BEGIN
  SELECT json_build_object(
    'guest', json_build_object(
      'id', g.id,
      'full_name', g.full_name,
      'invited_pax', g.invited_pax,
      'confirmed_pax', g.confirmed_pax,
      'rsvp_status', g.rsvp_status
    ),
    'event', json_build_object(
      'groom_name', e.groom_name,
      'bride_name', e.bride_name,
      'event_date', e.event_date
    )
  )
  INTO result
  FROM guests g
  JOIN events e ON e.id = g.event_id
  WHERE g.rsvp_token = p_token;

  RETURN result;
END;
$$;

CREATE OR REPLACE FUNCTION public.submit_rsvp(p_token uuid, p_status text, p_confirmed_pax int)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF p_status NOT IN ('מגיע', 'לא מגיע') THEN
    RAISE EXCEPTION 'סטטוס לא תקין';
  END IF;

  UPDATE guests
  SET
    rsvp_status = p_status,
    confirmed_pax = CASE
      WHEN p_status = 'מגיע' THEN GREATEST(COALESCE(p_confirmed_pax, 1), 1)
      ELSE 0
    END
  WHERE rsvp_token = p_token;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'קישור לא תקין';
  END IF;

  RETURN json_build_object('ok', true);
END;
$$;

GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;

GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.events TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.tables TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.guests TO authenticated;

GRANT ALL ON TABLE public.events TO service_role;
GRANT ALL ON TABLE public.tables TO service_role;
GRANT ALL ON TABLE public.guests TO service_role;

GRANT EXECUTE ON FUNCTION public.get_rsvp_context(uuid) TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.submit_rsvp(uuid, text, int) TO anon, authenticated, service_role;

NOTIFY pgrst, 'reload schema';
