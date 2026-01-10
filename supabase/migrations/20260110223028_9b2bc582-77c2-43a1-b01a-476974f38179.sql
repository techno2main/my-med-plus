-- Mettre le bucket prescriptions en privé (contient des données médicales sensibles)
UPDATE storage.buckets 
SET public = false 
WHERE id = 'prescriptions';