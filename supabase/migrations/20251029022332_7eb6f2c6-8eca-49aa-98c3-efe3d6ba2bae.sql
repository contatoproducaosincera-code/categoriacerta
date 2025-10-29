-- Remove duplicate athlete records, keeping only the oldest record for each name
DELETE FROM public.athletes
WHERE id IN (
  SELECT id
  FROM (
    SELECT id, name,
      ROW_NUMBER() OVER (PARTITION BY name ORDER BY created_at) as rn
    FROM public.athletes
  ) duplicates
  WHERE rn > 1
);