-- Add admin delete policy for travel records
CREATE POLICY "Admins can delete all travel records" 
ON public.travel_records 
FOR DELETE 
USING (has_role(auth.uid(), 'admin'::app_role));