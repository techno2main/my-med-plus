-- ============================================================================
-- Script de correction CIBLÉE des heures UTC incorrectes (période heure d'été)
-- Période : 13/10/2025 au 25/10/2025 (avant changement heure d'hiver le 26/10)
-- Pendant cette période : UTC+2 (heure d'été)
-- ============================================================================

-- IMPORTANT : Ce script corrige UNIQUEMENT les lignes identifiées comme incorrectes
-- Il ne touche PAS aux taken_at (heures réelles de prise)

-- ============================================================================
-- CORRECTION 1 : 14/10 - Toutes les prises (heures stockées en local au lieu d'UTC)
-- ============================================================================

-- Xigduo matin 14/10 : 09:30 → 07:30
UPDATE medication_intakes
SET scheduled_time = '2025-10-14 07:30:00+00',
    updated_at = NOW()
WHERE medication_id = '0017616d-a18d-40d9-b586-31af1025d5fe'
  AND scheduled_time = '2025-10-14 09:30:00+00';

-- Xigduo soir 14/10 : 20:00 → 18:00
UPDATE medication_intakes
SET scheduled_time = '2025-10-14 18:00:00+00',
    updated_at = NOW()
WHERE medication_id = '0017616d-a18d-40d9-b586-31af1025d5fe'
  AND scheduled_time = '2025-10-14 20:00:00+00';

-- Simvastatine 14/10 : 20:00 → 18:00
UPDATE medication_intakes
SET scheduled_time = '2025-10-14 18:00:00+00',
    updated_at = NOW()
WHERE medication_id = '86ef1704-fbed-4a65-b026-dc5d0ea26953'
  AND scheduled_time = '2025-10-14 20:00:00+00';

-- Quviviq 14/10 : 22:00 → 20:00
UPDATE medication_intakes
SET scheduled_time = '2025-10-14 20:00:00+00',
    updated_at = NOW()
WHERE medication_id = '98a396ee-051d-4531-bb26-62fe0ccc57e3'
  AND scheduled_time = '2025-10-14 22:00:00+00';

-- Venlafaxine 14/10 : 22:00 → 20:00
UPDATE medication_intakes
SET scheduled_time = '2025-10-14 20:00:00+00',
    updated_at = NOW()
WHERE medication_id = 'eb3b4d05-b031-4bae-a212-a40087bb28f0'
  AND scheduled_time = '2025-10-14 22:00:00+00';

-- ============================================================================
-- CORRECTION 2 : 13/10 au 19/10 - Prises du soir à 17:00 ou 17:30 → 18:00
-- ============================================================================

-- Xigduo soir 13/10 : 17:00 → 18:00
UPDATE medication_intakes
SET scheduled_time = '2025-10-13 18:00:00+00',
    updated_at = NOW()
WHERE medication_id = '0017616d-a18d-40d9-b586-31af1025d5fe'
  AND scheduled_time = '2025-10-13 17:00:00+00';

-- Simvastatine 13/10 : 17:00 → 18:00 (devrait être 20:00 pour afficher 20:00 Paris)
UPDATE medication_intakes
SET scheduled_time = '2025-10-13 18:00:00+00',
    updated_at = NOW()
WHERE medication_id = '86ef1704-fbed-4a65-b026-dc5d0ea26953'
  AND scheduled_time = '2025-10-13 17:00:00+00';

-- Xigduo soir 15/10 : 17:00 → 18:00
UPDATE medication_intakes
SET scheduled_time = '2025-10-15 18:00:00+00',
    updated_at = NOW()
WHERE medication_id = '0017616d-a18d-40d9-b586-31af1025d5fe'
  AND scheduled_time = '2025-10-15 17:00:00+00';

-- Simvastatine 15/10 : 17:00 → 18:00
UPDATE medication_intakes
SET scheduled_time = '2025-10-15 18:00:00+00',
    updated_at = NOW()
WHERE medication_id = '86ef1704-fbed-4a65-b026-dc5d0ea26953'
  AND scheduled_time = '2025-10-15 17:00:00+00';

-- ============================================================================
-- CORRECTION 3 : Quviviq corrections scheduled_time
-- ============================================================================

-- Quviviq 13/10 : 20:30 → 20:00
UPDATE medication_intakes
SET scheduled_time = '2025-10-13 20:00:00+00',
    updated_at = NOW()
WHERE medication_id = '98a396ee-051d-4531-bb26-62fe0ccc57e3'
  AND scheduled_time = '2025-10-13 20:30:00+00';

-- Quviviq 15/10 : 20:30 → 20:00 (doit afficher 22:00 Paris)
UPDATE medication_intakes
SET scheduled_time = '2025-10-15 20:00:00+00',
    updated_at = NOW()
WHERE medication_id = '98a396ee-051d-4531-bb26-62fe0ccc57e3'
  AND scheduled_time = '2025-10-15 20:30:00+00';

-- ============================================================================
-- CORRECTION 4 : taken_at - Heures réelles stockées en local au lieu d'UTC
-- Pour calculer correctement les retards/avances dans les stats
-- ============================================================================

-- 14/10 - Toutes les prises taken : soustraire 2h (UTC+2 été)
UPDATE medication_intakes
SET taken_at = taken_at - INTERVAL '2 hours',
    updated_at = NOW()
WHERE DATE(scheduled_time) = '2025-10-14'
  AND taken_at IS NOT NULL
  AND status = 'taken'
  AND EXTRACT(HOUR FROM taken_at) >= 7; -- Éviter les prises déjà correctes

-- 13/10 - Xigduo matin taken_at : déjà correct à 07:35 UTC (affiche 09:35 Paris)
-- Pas de correction nécessaire

-- 13/10 - Quviviq + Venlafaxine taken : garder 19:54 UTC pour afficher 21:54 Paris
-- Pas de correction nécessaire - déjà correct

-- 13/10 - Xigduo soir + Simvastatine du soir : forcer à 18:10 UTC (affichera 20:10 Paris)
UPDATE medication_intakes
SET taken_at = '2025-10-13 18:10:00+00',
    updated_at = NOW()
WHERE DATE(scheduled_time) = '2025-10-13'
  AND taken_at IS NOT NULL
  AND status = 'taken'
  AND medication_id IN ('0017616d-a18d-40d9-b586-31af1025d5fe', '86ef1704-fbed-4a65-b026-dc5d0ea26953')
  AND scheduled_time >= '2025-10-13 17:00:00+00'; -- Prises du soir uniquement

-- 15/10 - Xigduo matin : forcer à 07:35 UTC (affichera 09:35 Paris)
UPDATE medication_intakes
SET taken_at = '2025-10-15 07:35:00+00',
    updated_at = NOW()
WHERE DATE(scheduled_time) = '2025-10-15'
  AND taken_at IS NOT NULL
  AND status = 'taken'
  AND medication_id = '0017616d-a18d-40d9-b586-31af1025d5fe'
  AND scheduled_time < '2025-10-15 12:00:00+00'; -- Prise du matin uniquement

-- 15/10 - Xigduo soir + Simvastatine : ajouter 1h pour corriger (17:27 → 18:27 UTC pour afficher 20:27 Paris)
UPDATE medication_intakes
SET taken_at = taken_at + INTERVAL '1 hour',
    updated_at = NOW()
WHERE DATE(scheduled_time) = '2025-10-15'
  AND taken_at IS NOT NULL
  AND status = 'taken'
  AND medication_id IN ('0017616d-a18d-40d9-b586-31af1025d5fe', '86ef1704-fbed-4a65-b026-dc5d0ea26953')
  AND EXTRACT(HOUR FROM taken_at) = 17
  AND EXTRACT(MINUTE FROM taken_at) = 27;

-- 15/10 - Quviviq + Venlafaxine : soustraire 1h (21:59 → 20:59 UTC pour afficher 22:59 Paris)
UPDATE medication_intakes
SET taken_at = taken_at - INTERVAL '1 hour',
    updated_at = NOW()
WHERE DATE(scheduled_time) = '2025-10-15'
  AND taken_at IS NOT NULL
  AND status = 'taken'
  AND medication_id IN ('98a396ee-051d-4531-bb26-62fe0ccc57e3', 'eb3b4d05-b031-4bae-a212-a40087bb28f0')
  AND EXTRACT(HOUR FROM taken_at) = 21
  AND EXTRACT(MINUTE FROM taken_at) = 59;

-- ============================================================================
-- Vérification : Afficher TOUTES les prises de la période pour contrôle
-- ============================================================================
SELECT 
  TO_CHAR(mi.scheduled_time, 'DD/MM') as date,
  m.name as medication,
  TO_CHAR(mi.scheduled_time, 'HH24:MI') as scheduled_utc,
  TO_CHAR(mi.scheduled_time AT TIME ZONE 'Europe/Paris', 'HH24:MI') as scheduled_paris,
  CASE 
    WHEN mi.taken_at IS NOT NULL THEN TO_CHAR(mi.taken_at, 'HH24:MI')
    ELSE NULL
  END as taken_utc,
  CASE 
    WHEN mi.taken_at IS NOT NULL THEN TO_CHAR(mi.taken_at AT TIME ZONE 'Europe/Paris', 'HH24:MI')
    ELSE NULL
  END as taken_paris,
  mi.status
FROM medication_intakes mi
JOIN medications m ON m.id = mi.medication_id
WHERE mi.scheduled_time >= '2025-10-13 00:00:00+00'
  AND mi.scheduled_time < '2025-10-26 00:00:00+00'
ORDER BY mi.scheduled_time, m.name;
