-- Fix public storage bucket - make okr-evidences private
UPDATE storage.buckets 
SET public = false 
WHERE name = 'okr-evidences';