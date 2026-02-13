-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- -----------------------------------------------------------------------------
-- 1. Tables
-- -----------------------------------------------------------------------------

-- Table: surveys
-- Stores survey configurations and metadata.
CREATE TABLE IF NOT EXISTS public.surveys (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    slug TEXT NOT NULL UNIQUE,
    title TEXT NOT NULL,
    description TEXT,
    status TEXT NOT NULL CHECK (status IN ('draft', 'active', 'closed')) DEFAULT 'draft',
    config JSONB DEFAULT '{}'::JSONB, -- UI config: colors, logos, messages
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table: questions
-- Stores the questions for each survey.
CREATE TABLE IF NOT EXISTS public.questions (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    survey_id UUID NOT NULL REFERENCES public.surveys(id) ON DELETE CASCADE,
    type TEXT NOT NULL CHECK (type IN ('single_choice_image', 'multiple_choice', 'slider_scale', 'boolean', 'text')),
    content JSONB NOT NULL DEFAULT '{}'::JSONB, -- Question text, image URL, options, etc.
    "order" INTEGER NOT NULL DEFAULT 0,
    is_required BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table: survey_responses
-- Represents a single "session" or submission by a user.
-- Separation from answers allows for cleaner metadata tracking.
CREATE TABLE IF NOT EXISTS public.survey_responses (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    survey_id UUID NOT NULL REFERENCES public.surveys(id) ON DELETE CASCADE,
    fingerprint_hash TEXT NOT NULL, -- Browser fingerprint hash
    ip_hash TEXT NOT NULL,          -- Anonymized IP hash
    started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table: answers
-- Individual answers to questions within a response session.
CREATE TABLE IF NOT EXISTS public.answers (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    response_id UUID NOT NULL REFERENCES public.survey_responses(id) ON DELETE CASCADE,
    question_id UUID NOT NULL REFERENCES public.questions(id) ON DELETE CASCADE,
    answer_value JSONB NOT NULL, -- The actual answer (could be a string, number, or array)
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table: analytics_metadata
-- additional technical metadata for fraud detection and analytics.
CREATE TABLE IF NOT EXISTS public.analytics_metadata (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    response_id UUID NOT NULL REFERENCES public.survey_responses(id) ON DELETE CASCADE,
    device_type TEXT,
    browser TEXT,
    os TEXT,
    user_agent TEXT,
    screen_resolution TEXT,
    region_estimated TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);


-- -----------------------------------------------------------------------------
-- 2. Row Level Security (RLS)
-- -----------------------------------------------------------------------------

-- Enable RLS on all tables
ALTER TABLE public.surveys ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.survey_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.answers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.analytics_metadata ENABLE ROW LEVEL SECURITY;

-- Policy: Admin Access
-- Admins have full access to all tables.
-- Assuming 'authenticated' users are admins, or you can refine with a specific email check.
-- For now, we'll give full access to authenticated users.

CREATE POLICY "Admins have full access to surveys" ON public.surveys
    FOR ALL
    TO authenticated
    USING (true)
    WITH CHECK (true);

CREATE POLICY "Admins have full access to questions" ON public.questions
    FOR ALL
    TO authenticated
    USING (true)
    WITH CHECK (true);

CREATE POLICY "Admins have full access to survey_responses" ON public.survey_responses
    FOR ALL
    TO authenticated
    USING (true)
    WITH CHECK (true);

CREATE POLICY "Admins have full access to answers" ON public.answers
    FOR ALL
    TO authenticated
    USING (true)
    WITH CHECK (true);

CREATE POLICY "Admins have full access to analytics_metadata" ON public.analytics_metadata
    FOR ALL
    TO authenticated
    USING (true)
    WITH CHECK (true);


-- Policy: Public Access (Anon)
-- The general public needs to:
-- 1. Read 'surveys' and 'questions' to take the survey.
-- 2. Insert into 'survey_responses', 'answers', and 'analytics_metadata' to submit.
-- 3. They should NOT be able to read other people's responses.

-- Public Read Surveys
CREATE POLICY "Public can view active surveys" ON public.surveys
    FOR SELECT
    TO anon
    USING (status = 'active');

-- Public Read Questions
-- Creating a policy for questions that belong to active surveys.
CREATE POLICY "Public can view questions for active surveys" ON public.questions
    FOR SELECT
    TO anon
    USING (
        EXISTS (
            SELECT 1 FROM public.surveys
            WHERE id = questions.survey_id
            AND status = 'active'
        )
    );

-- Public Create Responses
CREATE POLICY "Public can submit responses" ON public.survey_responses
    FOR INSERT
    TO anon
    WITH CHECK (true);

-- Public Create Answers
-- Only verify that they are inserting answers for their own valid response session is hard without a session token,
-- but standard RLS for INSERT usually just allows it if they have the ID.
-- Ideally you'd check that the linked response_id was just created, but for high throughput public insert,
-- a simple INSERT policy is usually sufficient combined with potential application-side checks.
CREATE POLICY "Public can submit answers" ON public.answers
    FOR INSERT
    TO anon
    WITH CHECK (true);

-- Public Create Metadata
CREATE POLICY "Public can submit analytics metadata" ON public.analytics_metadata
    FOR INSERT
    TO anon
    WITH CHECK (true);

-- -----------------------------------------------------------------------------
-- 3. Indexes for Performance
-- -----------------------------------------------------------------------------

CREATE INDEX IF NOT EXISTS idx_surveys_slug ON public.surveys(slug);
CREATE INDEX IF NOT EXISTS idx_questions_survey_id ON public.questions(survey_id);
CREATE INDEX IF NOT EXISTS idx_questions_order ON public.questions("order");
CREATE INDEX IF NOT EXISTS idx_answers_response_id ON public.answers(response_id);
CREATE INDEX IF NOT EXISTS idx_answers_question_id ON public.answers(question_id);
CREATE INDEX IF NOT EXISTS idx_survey_responses_hashes ON public.survey_responses(fingerprint_hash, ip_hash);
