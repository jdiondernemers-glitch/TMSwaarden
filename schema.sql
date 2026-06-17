-- ============================================================
-- TMS · Positioneringssurvey – Supabase schema v2
-- Run this once in your Supabase project SQL editor.
-- ============================================================

-- ── 1. Questions table ────────────────────────────────────
CREATE TABLE IF NOT EXISTS questions (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  q_id        text        UNIQUE NOT NULL,
  position    integer     NOT NULL,
  part        text        NOT NULL,
  type        text        NOT NULL,
  q           text        NOT NULL,
  help        text,
  opts        jsonb,
  items       jsonb,
  lo          text,
  hi          text,
  ph          text,
  core        boolean     NOT NULL DEFAULT true,
  active      boolean     NOT NULL DEFAULT true,
  created_at  timestamptz NOT NULL DEFAULT now()
);

-- ── 2. Survey responses table (v2 – JSONB answers) ────────
CREATE TABLE IF NOT EXISTS survey_responses (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at  timestamptz NOT NULL DEFAULT now(),
  naam        text,
  mode        text,
  answers     jsonb       NOT NULL DEFAULT '{}'::jsonb
);

-- ── 3. Row Level Security ─────────────────────────────────
ALTER TABLE questions        ENABLE ROW LEVEL SECURITY;
ALTER TABLE survey_responses ENABLE ROW LEVEL SECURITY;

-- Drop first so this script is safe to re-run
DROP POLICY IF EXISTS "questions_select_anon"         ON questions;
DROP POLICY IF EXISTS "questions_all_authenticated"   ON questions;
DROP POLICY IF EXISTS "responses_insert_anon"         ON survey_responses;
DROP POLICY IF EXISTS "responses_select_authenticated" ON survey_responses;
DROP POLICY IF EXISTS "responses_all_authenticated"   ON survey_responses;

CREATE POLICY "questions_select_anon"
  ON questions FOR SELECT TO anon
  USING (active = true);

CREATE POLICY "questions_all_authenticated"
  ON questions FOR ALL TO authenticated
  USING (true) WITH CHECK (true);

-- Allow anonymous (public) users to submit survey answers
CREATE POLICY "responses_insert_anon"
  ON survey_responses FOR INSERT TO anon
  WITH CHECK (true);

-- Allow authenticated admin to read and manage responses
CREATE POLICY "responses_all_authenticated"
  ON survey_responses FOR ALL TO authenticated
  USING (true) WITH CHECK (true);

-- ── 4. Seed: 16 original questions ────────────────────────
INSERT INTO questions (q_id, position, part, type, q, help, opts, items, lo, hi, ph, core)
VALUES

('A1', 1, 'A', 'alloc',
 'Hoe concurreert en wint TMS <em class="k">vandaag</em> écht?',
 'Verdeel 100 punten over de drie disciplines.',
 NULL, NULL, NULL, NULL, NULL, true),

('A2', 2, 'A', 'alloc',
 'Hoe zou TMS over <em class="k">3 jaar</em> moeten concurreren?',
 'Verdeel opnieuw 100 punten — waar willen we in leiden?',
 NULL, NULL, NULL, NULL, NULL, true),

('A3', 3, 'A', 'single',
 'Eén discipline kan dominant zijn. Welke moet dat voor TMS zijn?',
 NULL,
 '[["oe","Operationele excellentie"],["pl","Productleiderschap"],["ki","Klantintimiteit"]]',
 NULL, NULL, NULL, NULL, true),

('A4', 4, 'A', 'single',
 'Op welke discipline aanvaarden we bewust "enkel marktstandaard"?',
 'Goed genoeg, geen koploper.',
 '[["oe","Operationele excellentie"],["pl","Productleiderschap"],["ki","Klantintimiteit"]]',
 NULL, NULL, NULL, NULL, true),

('B1', 5, 'B', 'multi2',
 '"Een klant kiest voor TMS vooral omdat…"',
 'Kies je top 2.',
 '[["a","we betrouwbaar, veilig en vlot leveren tegen een scherpe prijs"],["b","we hun installatie en proces beter kennen dan wie ook"],["c","we technisch het meest geavanceerd zijn / het complexe aankunnen"],["d","we snel mensen beschikbaar hebben"]]',
 NULL, NULL, NULL, NULL, false),

('B2', 6, 'B', 'single',
 'Detachering / "outsourcing" sturen we het best op:',
 NULL,
 '[["a","bezettingsgraad, fill rate, kost-per-uur"],["b","diepte en duur van de klantrelatie, herhaalopdrachten, kennisopbouw bij de klant"],["c","de moeilijkheidsgraad en specialisatie van de geplaatste profielen"]]',
 NULL, NULL, NULL, NULL, true),

('B3', 7, 'B', 'single',
 'De grootste groei de komende 2 jaar komt vooral uit:',
 NULL,
 '[["a","nieuwe klanten in nieuwe markten"],["b","uitbreiding en consolidatie bij bestaande klanten"],["c","nieuwe klanten via een scherp geprijsd, schaalbaar standaardaanbod"]]',
 NULL, NULL, NULL, NULL, true),

('B4', 8, 'B', 'single',
 'Een trouwe klant vraagt een complexe klus tegen dunne marge om de relatie te onderhouden. We…',
 NULL,
 '[["a","houden onze prijs/marge aan, ook als we de klus mislopen"],["b","nemen het als investering in de relatie"],["c","nemen het enkel als het technisch uitdagend of referentiewaardig is"]]',
 NULL, NULL, NULL, NULL, false),

('B5', 9, 'B', 'rank',
 'Waarin moet TMS de komende jaren het meest investeren?',
 'Tik in volgorde van belang — 1 is het belangrijkst.',
 NULL,
 '[["p","Processen, efficiëntie, prijs- en kostenstructuur"],["k","Kennisopbouw over klanten, accountteams, relatiemanagement, managed services"],["r","Technische R&D, nieuwe methodes, specialisatie"]]',
 NULL, NULL, NULL, false),

('C1', 10, 'C', 'text',
 'In één zin: waarom kiest een klant voor TMS en niet voor een concurrent?',
 NULL, NULL, NULL, NULL, NULL, 'Typ je antwoord…', true),

('C2', 11, 'C', 'text',
 'Wat zou TMS bewust <em class="k">níét</em> (meer) moeten doen?',
 NULL, NULL, NULL, NULL, NULL, 'Typ je antwoord…', true),

('C3', 12, 'C', 'text',
 'Welke (soort) concurrent vrees je het meest, en waarom?',
 NULL, NULL, NULL, NULL, NULL, 'Typ je antwoord…', false),

('C4', 13, 'C', 'text',
 'Als TMS over 3 jaar om één ding bekend zou staan — wat zou dat zijn?',
 NULL, NULL, NULL, NULL, NULL, 'Typ je antwoord…', false),

('D1', 14, 'D', 'scale',
 'Hoe sterk denk je dat de rest van StratCom het met jouw antwoorden eens is?',
 NULL, NULL, NULL, 'totaal niet', 'volledig', NULL, true),

('D2', 15, 'D', 'scale',
 'Hoe duidelijk is de strategische positionering van TMS vandaag, voor jou?',
 NULL, NULL, NULL, 'heel onduidelijk', 'heel duidelijk', NULL, false),

('naam', 16, 'D', 'name',
 'Tot slot — je naam en rol',
 'Zodat we bij de bespreking de juiste context hebben (optioneel).',
 NULL, NULL, NULL, NULL, 'Naam · rol', true)

ON CONFLICT (q_id) DO NOTHING;

-- ── 5. Admin user ─────────────────────────────────────────
-- Create the admin account via Supabase Dashboard:
-- Authentication → Users → "Add user" → hardwig@jdi.be / Justdoit1!
-- Tick "Auto Confirm User". Do NOT put credentials in code.
