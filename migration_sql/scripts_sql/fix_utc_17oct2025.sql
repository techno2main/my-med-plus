-- ============================================================================
-- Correction 17/10/2025 - Période heure d'été (UTC+2)
-- ============================================================================

-- ============================================================================
-- CORRECTION scheduled_time
-- ============================================================================

-- Xigduo soir : 17:00 → 18:00 UTC (affichera 20:00 Paris)
UPDATE medication_intakes
SET scheduled_time = '2025-10-17 18:00:00+00',
    updated_at = NOW()
WHERE medication_id = '0017616d-a18d-40d9-b586-31af1025d5fe'
  AND scheduled_time = '2025-10-17 17:00:00+00';

-- Simvastatine : 17:00 → 18:00 UTC (affichera 20:00 Paris)
UPDATE medication_intakes
SET scheduled_time = '2025-10-17 18:00:00+00',
    updated_at = NOW()
WHERE medication_id = '86ef1704-fbed-4a65-b026-dc5d0ea26953'
  AND scheduled_time = '2025-10-17 17:00:00+00';

-- Quviviq : 20:30 → 20:00 UTC (affichera 22:00 Paris)
UPDATE medication_intakes
SET scheduled_time = '2025-10-17 20:00:00+00',
    updated_at = NOW()
WHERE medication_id = '98a396ee-051d-4531-bb26-62fe0ccc57e3'
  AND scheduled_time = '2025-10-17 20:30:00+00';

-- ============================================================================
-- CORRECTION taken_at
-- ============================================================================

-- Xigduo matin taken_at : 08:33 → 06:33 UTC (affichera 08:33 Paris)
UPDATE medication_intakes
SET taken_at = '2025-10-17 06:33:00+00',
    updated_at = NOW()
WHERE DATE(scheduled_time) = '2025-10-17'
  AND medication_id = '0017616d-a18d-40d9-b586-31af1025d5fe'
  AND taken_at = '2025-10-17 08:33:34.389+00';

-- Xigduo soir taken_at : 17:31 → 18:31 UTC (affichera 20:31 Paris)
UPDATE medication_intakes
SET taken_at = '2025-10-17 18:31:00+00',
    updated_at = NOW()
WHERE DATE(scheduled_time) = '2025-10-17'
  AND medication_id = '0017616d-a18d-40d9-b586-31af1025d5fe'
  AND taken_at = '2025-10-17 17:31:50.114+00';

-- Simvastatine taken_at : 17:31 → 18:31 UTC (affichera 20:31 Paris)
UPDATE medication_intakes
SET taken_at = '2025-10-17 18:31:00+00',
    updated_at = NOW()
WHERE DATE(scheduled_time) = '2025-10-17'
  AND medication_id = '86ef1704-fbed-4a65-b026-dc5d0ea26953'
  AND taken_at = '2025-10-17 17:31:46.07+00';

-- Venlafaxine taken_at : 20:12 → 20:12 UTC (affichera 22:12 Paris)
UPDATE medication_intakes
SET taken_at = '2025-10-17 20:12:00+00',
    updated_at = NOW()
WHERE DATE(scheduled_time) = '2025-10-17'
  AND medication_id = 'eb3b4d05-b031-4bae-a212-a40087bb28f0'
  AND taken_at = '2025-10-17 20:12:35.069+00';

-- Quviviq taken_at : 20:12 → 20:12 UTC (affichera 22:12 Paris)
UPDATE medication_intakes
SET taken_at = '2025-10-17 20:19:00+00',
    updated_at = NOW()
WHERE DATE(scheduled_time) = '2025-10-17'
  AND medication_id = '98a396ee-051d-4531-bb26-62fe0ccc57e3'
  AND taken_at = '2025-10-17 20:12:35.069+00';

-- ============================================================================
-- Vérification
-- ============================================================================
SELECT 
  TO_CHAR(mi.scheduled_time, 'DD/MM HH24:MI') as scheduled_utc,
  TO_CHAR(mi.scheduled_time AT TIME ZONE 'Europe/Paris', 'HH24:MI') as scheduled_paris,
  m.name,
  TO_CHAR(mi.taken_at, 'HH24:MI') as taken_utc,
  TO_CHAR(mi.taken_at AT TIME ZONE 'Europe/Paris', 'HH24:MI') as taken_paris,
  mi.status
FROM medication_intakes mi
JOIN medications m ON m.id = mi.medication_id
WHERE DATE(mi.scheduled_time) = '2025-10-17'
ORDER BY mi.scheduled_time, m.name;

-- ============================================================================
-- RÉSULTAT ATTENDU APRÈS CORRECTION
-- ============================================================================
-- Xigduo matin   : 07:30 UTC → 09:30 Paris | taken 06:33 UTC → 08:33 Paris
-- Xigduo soir    : 18:00 UTC → 20:00 Paris | taken 18:31 UTC → 20:31 Paris
-- Simvastatine   : 18:00 UTC → 20:00 Paris | taken 18:31 UTC → 20:31 Paris
-- Venlafaxine    : 20:00 UTC → 22:00 Paris | taken 20:12 UTC → 22:12 Paris
-- Quviviq        : 20:00 UTC → 22:00 Paris | taken 20:19 UTC → 22:19 Paris
