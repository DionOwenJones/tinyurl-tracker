-- Create the URLs table
CREATE TABLE IF NOT EXISTS urls (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    original_url TEXT NOT NULL,
    short_code TEXT UNIQUE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Create the clicks table
CREATE TABLE IF NOT EXISTS clicks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    short_code TEXT NOT NULL REFERENCES urls(short_code),
    ip_address TEXT,
    user_agent TEXT,
    referrer TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    clicked_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    latitude DOUBLE PRECISION,
    longitude DOUBLE PRECISION,
    city TEXT,
    country TEXT
);

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
