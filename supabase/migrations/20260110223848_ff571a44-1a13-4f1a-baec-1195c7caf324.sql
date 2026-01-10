-- Fix navigation_items RLS: restrict to admin only instead of any authenticated user

-- Drop existing policies
DROP POLICY IF EXISTS "Authenticated users can delete navigation items" ON navigation_items;
DROP POLICY IF EXISTS "Authenticated users can insert navigation items" ON navigation_items;
DROP POLICY IF EXISTS "Authenticated users can update navigation items" ON navigation_items;
DROP POLICY IF EXISTS "Authenticated users can view navigation items" ON navigation_items;

-- Create new policies - anyone authenticated can READ, but only admin can modify
CREATE POLICY "Users can view navigation items" 
ON navigation_items 
FOR SELECT 
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Admin can insert navigation items" 
ON navigation_items 
FOR INSERT 
WITH CHECK (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admin can update navigation items" 
ON navigation_items 
FOR UPDATE 
USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admin can delete navigation items" 
ON navigation_items 
FOR DELETE 
USING (has_role(auth.uid(), 'admin'));