-- Add column to track which point this was forwarded from
ALTER TABLE meeting_points 
ADD COLUMN forwarded_from_point_id INT NULL,
ADD CONSTRAINT fk_forwarded_from_point 
    FOREIGN KEY (forwarded_from_point_id) 
    REFERENCES meeting_points(id) 
    ON DELETE SET NULL;

-- Create index for better query performance
CREATE INDEX idx_forwarded_from_point ON meeting_points(forwarded_from_point_id);

-- Optional: Update existing forwarded points based on meeting_point_future
-- This will link existing forwarded points
UPDATE meeting_points new_mp
INNER JOIN meeting_point_future mpf ON mpf.current_meeting_id = new_mp.meeting_id
INNER JOIN meeting_points old_mp ON old_mp.id = mpf.point_id
SET new_mp.forwarded_from_point_id = old_mp.id
WHERE new_mp.point_name = old_mp.point_name
  AND mpf.forward_type != 'NIL'
  AND new_mp.forwarded_from_point_id IS NULL;
