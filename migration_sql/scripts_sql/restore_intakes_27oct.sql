-- RESTAURATION DES PRISES DU 27/10/2025 (AUJOURD'HUI)
-- Ces prises ont été supprimées par erreur par la fonction regenerate_future_intakes

-- Traitement DT2-CHL : 5 prises
-- 1. Xigduo - 09:30 Paris = 08:30 UTC
INSERT INTO medication_intakes (medication_id, scheduled_time, status, created_at, updated_at)
VALUES (
  '0017616d-a18d-40d9-b586-31af1025d5fe',
  '2025-10-27 08:30:00+00',
  'pending',
  NOW(),
  NOW()
)
ON CONFLICT DO NOTHING;

-- 2. Xigduo - 20:00 Paris = 19:00 UTC
INSERT INTO medication_intakes (medication_id, scheduled_time, status, created_at, updated_at)
VALUES (
  '0017616d-a18d-40d9-b586-31af1025d5fe',
  '2025-10-27 19:00:00+00',
  'pending',
  NOW(),
  NOW()
)
ON CONFLICT DO NOTHING;

-- 3. Simvastatine - 20:00 Paris = 19:00 UTC
INSERT INTO medication_intakes (medication_id, scheduled_time, status, created_at, updated_at)
VALUES (
  '86ef1704-fbed-4a65-b026-dc5d0ea26953',
  '2025-10-27 19:00:00+00',
  'pending',
  NOW(),
  NOW()
)
ON CONFLICT DO NOTHING;

-- 4. Quviviq - 22:00 Paris = 21:00 UTC
INSERT INTO medication_intakes (medication_id, scheduled_time, status, created_at, updated_at)
VALUES (
  '98a396ee-051d-4531-bb26-62fe0ccc57e3',
  '2025-10-27 21:00:00+00',
  'pending',
  NOW(),
  NOW()
)
ON CONFLICT DO NOTHING;

-- 5. Venlafaxine - 22:00 Paris = 21:00 UTC
INSERT INTO medication_intakes (medication_id, scheduled_time, status, created_at, updated_at)
VALUES (
  'eb3b4d05-b031-4bae-a212-a40087bb28f0',
  '2025-10-27 21:00:00+00',
  'pending',
  NOW(),
  NOW()
)
ON CONFLICT DO NOTHING;

-- Traitement DOULEURS PIED : 3 prises
-- 6. Doliprane - 09:30 Paris = 08:30 UTC
INSERT INTO medication_intakes (medication_id, scheduled_time, status, created_at, updated_at)
VALUES (
  'b3087022-943f-4830-a94c-32866f856776',
  '2025-10-27 08:30:00+00',
  'pending',
  NOW(),
  NOW()
)
ON CONFLICT DO NOTHING;

-- 7. Doliprane - 12:30 Paris = 11:30 UTC
INSERT INTO medication_intakes (medication_id, scheduled_time, status, created_at, updated_at)
VALUES (
  'b3087022-943f-4830-a94c-32866f856776',
  '2025-10-27 11:30:00+00',
  'pending',
  NOW(),
  NOW()
)
ON CONFLICT DO NOTHING;

-- 8. Doliprane - 19:30 Paris = 18:30 UTC
INSERT INTO medication_intakes (medication_id, scheduled_time, status, created_at, updated_at)
VALUES (
  'b3087022-943f-4830-a94c-32866f856776',
  '2025-10-27 18:30:00+00',
  'pending',
  NOW(),
  NOW()
)
ON CONFLICT DO NOTHING;

-- Vérification
SELECT 
  t.name as traitement,
  m.name as medicament,
  mi.scheduled_time AT TIME ZONE 'Europe/Paris' as heure_paris,
  mi.status
FROM medication_intakes mi
JOIN medications m ON mi.medication_id = m.id
JOIN treatments t ON m.treatment_id = t.id
WHERE DATE(mi.scheduled_time AT TIME ZONE 'Europe/Paris') = '2025-10-27'
ORDER BY t.name, mi.scheduled_time;
