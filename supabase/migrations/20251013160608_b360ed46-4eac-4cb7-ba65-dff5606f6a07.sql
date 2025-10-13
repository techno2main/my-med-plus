-- Create medication_intakes table to track medication history
CREATE TABLE public.medication_intakes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  medication_id UUID NOT NULL REFERENCES public.medications(id) ON DELETE CASCADE,
  scheduled_time TIMESTAMP WITH TIME ZONE NOT NULL,
  taken_at TIMESTAMP WITH TIME ZONE,
  status TEXT NOT NULL CHECK (status IN ('pending', 'taken', 'skipped')),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.medication_intakes ENABLE ROW LEVEL SECURITY;

-- Create policies for medication_intakes
CREATE POLICY "Users can view own medication intakes"
ON public.medication_intakes
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.medications m
    INNER JOIN public.treatments t ON t.id = m.treatment_id
    WHERE m.id = medication_intakes.medication_id
    AND t.user_id = auth.uid()
  )
);

CREATE POLICY "Users can create own medication intakes"
ON public.medication_intakes
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.medications m
    INNER JOIN public.treatments t ON t.id = m.treatment_id
    WHERE m.id = medication_intakes.medication_id
    AND t.user_id = auth.uid()
  )
);

CREATE POLICY "Users can update own medication intakes"
ON public.medication_intakes
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.medications m
    INNER JOIN public.treatments t ON t.id = m.treatment_id
    WHERE m.id = medication_intakes.medication_id
    AND t.user_id = auth.uid()
  )
);

CREATE POLICY "Users can delete own medication intakes"
ON public.medication_intakes
FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM public.medications m
    INNER JOIN public.treatments t ON t.id = m.treatment_id
    WHERE m.id = medication_intakes.medication_id
    AND t.user_id = auth.uid()
  )
);

-- Add indexes for better performance
CREATE INDEX idx_medication_intakes_medication_id ON public.medication_intakes(medication_id);
CREATE INDEX idx_medication_intakes_scheduled_time ON public.medication_intakes(scheduled_time DESC);
CREATE INDEX idx_medication_intakes_status ON public.medication_intakes(status);