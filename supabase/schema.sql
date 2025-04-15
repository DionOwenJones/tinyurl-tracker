-- Create the urls table if it doesn't exist
CREATE TABLE IF NOT EXISTS urls (
  id SERIAL PRIMARY KEY,
  short_code TEXT UNIQUE NOT NULL,
  original_url TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Create the clicks table if it doesn't exist
CREATE TABLE IF NOT EXISTS clicks (
  id SERIAL PRIMARY KEY,
  short_code TEXT NOT NULL REFERENCES urls(short_code),
  ip_address TEXT,
  user_agent TEXT,
  referrer TEXT,
  latitude DOUBLE PRECISION,
  longitude DOUBLE PRECISION,
  city TEXT,
  country TEXT,
  clicked_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS clicks_short_code_idx ON clicks(short_code);
CREATE INDEX IF NOT EXISTS clicks_clicked_at_idx ON clicks(clicked_at);
