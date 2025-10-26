-- ============================================================================
-- Correction 19/10/2025 - Période heure d'été (UTC+2)
-- ============================================================================

-- ============================================================================
-- CORRECTION scheduled_time
-- ============================================================================

-- Xigduo soir : 17:30 → 18:00 UTC (affichera 20:00 Paris)
UPDATE medication_intakes
SET scheduled_time = '2025-10-19 18:00:00+00',
    updated_at = NOW()
WHERE medication_id = '0017616d-a18d-40d9-b586-31af1025d5fe'
  AND scheduled_time = '2025-10-19 17:30:00+00';

-- Simvastatine : 17:30 → 18:00 UTC (affichera 20:00 Paris)
UPDATE medication_intakes
SET scheduled_time = '2025-10-19 18:00:00+00',
    updated_at = NOW()
WHERE medication_id = '86ef1704-fbed-4a65-b026-dc5d0ea26953'
  AND scheduled_time = '2025-10-19 17:30:00+00';

-- ============================================================================
-- CORRECTION taken_at
-- ============================================================================

-- Xigduo matin taken_at : 09:47 → 07:47 UTC (affichera 09:47 Paris)
UPDATE medication_intakes
SET taken_at = '2025-10-19 07:47:00+00',
    updated_at = NOW()
WHERE DATE(scheduled_time) = '2025-10-19'
  AND medication_id = '0017616d-a18d-40d9-b586-31af1025d5fe'
  AND taken_at = '2025-10-19 09:47:00+00';

-- Xigduo soir taken_at : 17:59 → 18:59 UTC (affichera 20:59 Paris)
UPDATE medication_intakes
SET taken_at = '2025-10-19 18:59:00+00',
    updated_at = NOW()
WHERE DATE(scheduled_time) = '2025-10-19'
  AND medication_id = '0017616d-a18d-40d9-b586-31af1025d5fe'
  AND taken_at = '2025-10-19 17:59:16.338+00';

-- Simvastatine taken_at : 17:59 → 18:59 UTC (affichera 20:59 Paris)
UPDATE medication_intakes
SET taken_at = '2025-10-19 18:59:00+00',
    updated_at = NOW()
WHERE DATE(scheduled_time) = '2025-10-19'
  AND medication_id = '86ef1704-fbed-4a65-b026-dc5d0ea26953'
  AND taken_at = '2025-10-19 17:59:13.856+00';

-- Quviviq taken_at : 20:43 → 20:43 UTC (affichera 22:43 Paris)
UPDATE medication_intakes
SET taken_at = '2025-10-19 20:43:00+00',
    updated_at = NOW()
WHERE DATE(scheduled_time) = '2025-10-19'
  AND medication_id = '98a396ee-051d-4531-bb26-62fe0ccc57e3'
  AND taken_at = '2025-10-19 20:43:00+00';

-- Venlafaxine taken_at : 20:43 → 20:43 UTC (affichera 22:43 Paris)
UPDATE medication_intakes
SET taken_at = '2025-10-19 20:43:00+00',
    updated_at = NOW()
WHERE DATE(scheduled_time) = '2025-10-19'
  AND medication_id = 'eb3b4d05-b031-4bae-a212-a40087bb28f0'
  AND taken_at = '2025-10-19 20:43:00+00';

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
WHERE DATE(mi.scheduled_time) = '2025-10-19'
ORDER BY mi.scheduled_time, m.name;

-- ============================================================================
-- RÉSULTAT ATTENDU APRÈS CORRECTION
-- ============================================================================
-- Xigduo matin   : 07:30 UTC → 09:30 Paris | taken 07:47 UTC → 09:47 Paris
-- Xigduo soir    : 18:00 UTC → 20:00 Paris | taken 18:59 UTC → 20:59 Paris
-- Simvastatine   : 18:00 UTC → 20:00 Paris | taken 18:59 UTC → 20:59 Paris
-- Quviviq        : 20:00 UTC → 22:00 Paris | taken 20:43 UTC → 22:43 Paris
-- Venlafaxine    : 20:00 UTC → 22:00 Paris | taken 20:43 UTC → 22:43 Paris
