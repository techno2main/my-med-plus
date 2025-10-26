-- ============================================================================
-- Correction des prises futures (27/10 au 02/11) - Passage heure d'hiver UTC+1
-- ============================================================================
-- Problème : Les prises futures ont été générées avec les horaires Paris sans
--            conversion UTC, donc elles affichent 1h de plus (10:30 au lieu de 09:30)
-- Solution : Soustraire 1h pour convertir correctement Paris → UTC hiver
-- ============================================================================

-- ============================================================================
-- AVANT CORRECTION : Vérifier l'état actuel
-- ============================================================================
SELECT 
  TO_CHAR(mi.scheduled_time, 'DD/MM/YYYY') as date,
  TO_CHAR(mi.scheduled_time, 'HH24:MI') as utc_time,
  TO_CHAR(mi.scheduled_time AT TIME ZONE 'Europe/Paris', 'HH24:MI') as paris_time,
  m.name,
  mi.status
FROM medication_intakes mi
JOIN medications m ON m.id = mi.medication_id
WHERE mi.scheduled_time >= '2025-10-27'
  AND mi.scheduled_time <= '2025-11-02 23:59:59'
  AND mi.status = 'pending'
ORDER BY mi.scheduled_time, m.name;

-- ============================================================================
-- CORRECTION : Soustraire 1h sur toutes les prises futures pending
-- ============================================================================
UPDATE medication_intakes
SET scheduled_time = scheduled_time - INTERVAL '1 hour',
    updated_at = NOW()
WHERE scheduled_time >= '2025-10-27'
  AND scheduled_time <= '2025-11-02 23:59:59'
  AND status = 'pending';

-- ============================================================================
-- APRÈS CORRECTION : Vérifier le résultat
-- ============================================================================
SELECT 
  TO_CHAR(mi.scheduled_time, 'DD/MM/YYYY') as date,
  TO_CHAR(mi.scheduled_time, 'HH24:MI') as utc_time,
  TO_CHAR(mi.scheduled_time AT TIME ZONE 'Europe/Paris', 'HH24:MI') as paris_time,
  m.name,
  mi.status
FROM medication_intakes mi
JOIN medications m ON m.id = mi.medication_id
WHERE mi.scheduled_time >= '2025-10-27'
  AND mi.scheduled_time <= '2025-11-02 23:59:59'
  AND mi.status = 'pending'
ORDER BY mi.scheduled_time, m.name;

-- ============================================================================
-- RÉSULTAT ATTENDU APRÈS CORRECTION
-- ============================================================================
-- 27/10 : 08:30 UTC → 09:30 Paris (Xigduo matin)
-- 27/10 : 19:00 UTC → 20:00 Paris (Xigduo soir)
-- 27/10 : 19:00 UTC → 20:00 Paris (Simvastatine)
-- 27/10 : 21:00 UTC → 22:00 Paris (Quviviq)
-- 27/10 : 21:00 UTC → 22:00 Paris (Venlafaxine)
-- (idem pour 28/10 à 02/11)
