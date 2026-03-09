-- Migration: Add archive functionality to wildflowers table
-- Created: 2025-01-14
-- Description: Adds is_archived and archived_at columns to support Compost Bin feature

-- Add is_archived column (defaults to false)
ALTER TABLE public.wildflowers
ADD COLUMN IF NOT EXISTS is_archived boolean DEFAULT false;

-- Add archived_at column (nullable timestamp)
ALTER TABLE public.wildflowers
ADD COLUMN IF NOT EXISTS archived_at timestamptz;

-- Add index for better query performance on archived wildflowers
CREATE INDEX IF NOT EXISTS idx_wildflowers_is_archived 
ON public.wildflowers(is_archived);

-- Add index for archived_at for sorting
CREATE INDEX IF NOT EXISTS idx_wildflowers_archived_at 
ON public.wildflowers(archived_at DESC) 
WHERE is_archived = true;

-- Add comment for documentation
COMMENT ON COLUMN public.wildflowers.is_archived IS 'Indicates if the wildflower has been moved to the Compost Bin';
COMMENT ON COLUMN public.wildflowers.archived_at IS 'Timestamp when the wildflower was archived/composted';

