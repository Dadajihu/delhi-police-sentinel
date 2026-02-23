-- Traffic Assist: Reports Schema

-- Create reports table
CREATE TABLE IF NOT EXISTS public.reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    media_url TEXT NOT NULL,
    violation_type TEXT NOT NULL,
    extracted_data JSONB DEFAULT '{}'::jsonb,
    plate_number TEXT,
    authenticity_score DOUBLE PRECISION,
    validity_score DOUBLE PRECISION,
    priority_score DOUBLE PRECISION,
    ai_explanation TEXT,
    evidence_hash TEXT,
    status TEXT NOT NULL DEFAULT 'submitted', -- submitted, ai_processed, pending_review, approved, rejected, sent_to_police
    metadata JSONB DEFAULT '{}'::jsonb, -- { gps: { lat, lng }, timestamp, device_info }
    reviewed_by TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable Row Level Security
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;

-- Policies
-- Allow anyone to insert (citizens reporting) - In a real app, this would be authenticated or rate-limited
CREATE POLICY "Allow public inserts for reports" ON public.reports
    FOR INSERT WITH CHECK (true);

-- Allow everyone to read (for tracking status) - In a real app, this would be restricted to own reports or officers
CREATE POLICY "Allow public read for reports" ON public.reports
    FOR SELECT USING (true);

-- Allow authenticated officers to update status
-- CREATE POLICY "Allow authorized updates" ON public.reports
--     FOR UPDATE USING (auth.role() = 'authenticated');
