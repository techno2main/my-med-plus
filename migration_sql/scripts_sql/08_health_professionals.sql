-- =====================================================
-- TABLE: public.health_professionals
-- Médecins, pharmacies et laboratoires
-- =====================================================

-- STRUCTURE
CREATE TABLE public.health_professionals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('doctor', 'pharmacy', 'laboratory')),
  name TEXT NOT NULL,
  specialty TEXT,
  phone TEXT,
  email TEXT,
  address TEXT,
  is_primary_doctor BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- RLS POLICIES
ALTER TABLE public.health_professionals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own health professionals"
  ON public.health_professionals FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own health professionals"
  ON public.health_professionals FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own health professionals"
  ON public.health_professionals FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own health professionals"
  ON public.health_professionals FOR DELETE
  USING (auth.uid() = user_id);

-- TRIGGER pour mise à jour automatique
CREATE TRIGGER update_health_professionals_updated_at BEFORE UPDATE ON public.health_professionals
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- DONNÉES: Vos 7 professionnels de santé
INSERT INTO public.health_professionals VALUES
('90969f97-f2c9-476b-979b-c97b3813cab5', '634b0b48-e193-4827-983b-a0f7d2f1b068', 'pharmacy', 'Pharmacie de l''Étoile', NULL, '01 30 90 22 00', 'pharmacieetoile78@gmail.com', '2 Bd de la République, 78410 Aubergenville', false, '2025-10-13 13:08:47.965359+00', '2025-10-13 15:27:07.480261+00'),
('e38a3a24-e92d-4ea2-bee4-d06ad8e94b0d', '634b0b48-e193-4827-983b-a0f7d2f1b068', 'pharmacy', 'Pharmacie du Champy', NULL, '01 43 05 51 16', 'contact@pharmacieduchampy.fr', '20 All. du Bataillon Hildevert, 93160 Noisy-le-Grand', false, '2025-10-13 13:08:47.965359+00', '2025-10-13 15:28:18.44341+00'),
('297348e4-e97b-4f52-a9a9-295947c1f0ad', '634b0b48-e193-4827-983b-a0f7d2f1b068', 'doctor', 'Dr. Alice Denambride', 'Généraliste', '01 43 05 52 22', 'alicedenambride@gmail.com', '6 Promenade Michel Simon, 93160 Noisy-le-Grand', true, '2025-10-13 13:08:47.965359+00', '2025-10-13 15:28:57.336517+00'),
('edcce445-dd7b-45a9-8bf6-241f4f21c929', '634b0b48-e193-4827-983b-a0f7d2f1b068', 'doctor', 'Dr. Faiz Kassab', 'Psychiatre', '02 30 32 19 05', 'faiz.kassab@cliniqueparc-caen.fr', '20 Avenue Capitaine Georges Guynemer, 14000 Caen', false, '2025-10-13 13:08:47.965359+00', '2025-10-13 15:30:27.887268+00'),
('e37df190-4f4c-4a4a-a4df-60defd7708ab', '634b0b48-e193-4827-983b-a0f7d2f1b068', 'doctor', 'Dr Y-Lan Phung', 'Généraliste', '01 43 05 52 22', 'ylan.pgh@gmail.com', '6 Promenade Michel Simon, 93160 Noisy-le-Grand', false, '2025-10-13 13:08:47.965359+00', '2025-10-13 15:31:19.702455+00'),
('d786e12a-266d-490e-9414-56e1026327a2', '634b0b48-e193-4827-983b-a0f7d2f1b068', 'laboratory', 'Laboratoire Cerballiance', NULL, '01 30 95 96 96', 'laboaubergenville.idfo@cerballiance.fr', '26 Rue de Quarante Sous, 78410 Aubergenville', false, '2025-10-13 14:16:00.043063+00', '2025-10-13 15:32:31.188806+00'),
('9676e2b0-adc1-4a1a-978a-463d767487d5', '634b0b48-e193-4827-983b-a0f7d2f1b068', 'laboratory', 'Laboratoire CCR du Champy', NULL, '01 43 04 14 49', 'labo.champy@biogroup.fr', '3 Promenade Michel Simon, 93160 Noisy-le-Grand', false, '2025-10-13 14:16:00.043063+00', '2025-10-13 15:33:46.233218+00');