-- Add new columns to clicks table if they don't exist
DO $$ 
BEGIN
    -- Add clicked_at column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'clicks' AND column_name = 'clicked_at') THEN
        ALTER TABLE clicks ADD COLUMN clicked_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW());
    END IF;

    -- Add latitude column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'clicks' AND column_name = 'latitude') THEN
        ALTER TABLE clicks ADD COLUMN latitude DOUBLE PRECISION;
    END IF;

    -- Add longitude column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'clicks' AND column_name = 'longitude') THEN
        ALTER TABLE clicks ADD COLUMN longitude DOUBLE PRECISION;
    END IF;

    -- Add city column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'clicks' AND column_name = 'city') THEN
        ALTER TABLE clicks ADD COLUMN city TEXT;
    END IF;

    -- Add country column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'clicks' AND column_name = 'country') THEN
        ALTER TABLE clicks ADD COLUMN country TEXT;
    END IF;
END $$;

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS clicks_short_code_idx ON clicks(short_code);
CREATE INDEX IF NOT EXISTS clicks_clicked_at_idx ON clicks(clicked_at);
