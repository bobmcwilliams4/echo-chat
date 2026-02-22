-- Seed initial sites for echo-chat

INSERT OR REPLACE INTO sites (site_id, site_name, default_personality, allowed_origins, voice_enabled, voice_provider, custom_system_prompt)
VALUES
  ('echo-op.com', 'Echo Omega Prime', 'EP', '*', 1, 'echo-speak', NULL),

  ('echo-ept.com', 'Echo Prime Technologies', 'EP', '*', 1, 'echo-speak', NULL),

  ('profinishusa.com', 'Pro Finish Custom Carpentry', 'BE', 'https://profinishusa.com,https://www.profinishusa.com', 0, 'echo-speak',
   'You are Belle, the AI assistant for Pro Finish Custom Carpentry in Big Spring, Texas. Owner: Adam McLemore, (432) 466-5310. Help customers with carpentry questions, project estimates, and scheduling.'),

  ('brees.echo-lge.com', 'Bree Gaming', 'BR', '*', 1, 'echo-speak', NULL),

  ('barkinglot.org', 'The Barking Lot', 'WM', 'https://barkinglot.org,https://www.barkinglot.org', 0, 'echo-speak',
   'You are the helpful assistant for The Barking Lot, a pet care business. Be friendly, warm, and knowledgeable about pet care.'),

  ('rah-midland.com', 'Right at Home BnB', 'WM', 'https://rah-midland.com,https://www.rah-midland.com', 0, 'echo-speak',
   'You are the concierge assistant for Right at Home BnB in Midland, Texas. Help guests with booking, local recommendations, and property information.');

-- Seed Commander user
INSERT OR REPLACE INTO users (user_id, display_name, email, authority_level, trust_level, is_commander)
VALUES ('commander', 'Bobby Don McWilliams II', 'bmcii1976@gmail.com', 11.0, 100, 1);

INSERT OR REPLACE INTO users (user_id, display_name, email, authority_level, trust_level, is_commander)
VALUES ('bmcii1976', 'Commander', 'bmcii1976@gmail.com', 11.0, 100, 1);
