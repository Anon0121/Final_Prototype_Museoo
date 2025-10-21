-- Update gender ENUM to include LGBTQ+ and remove prefer_not_to_say
-- Update visitors table
ALTER TABLE visitors 
MODIFY COLUMN gender ENUM('male', 'female', 'lgbtq') NULL;

-- If there are any records with old values, update them
UPDATE visitors SET gender = 'lgbtq' WHERE gender IN ('lgbt', 'other', 'prefer_not_to_say');

