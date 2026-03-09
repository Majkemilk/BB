-- Part A: Drop Existing Tables
DROP TABLE IF EXISTS public.tasks CASCADE;
DROP TABLE IF EXISTS public.wildflowers CASCADE;
DROP TABLE IF EXISTS public.templates CASCADE;
DROP TABLE IF EXISTS public.contexts CASCADE;
DROP TABLE IF EXISTS public.plots CASCADE;

-- Part B: Create All Tables

-- Tasks table
CREATE TABLE public.tasks (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES auth.users(id) NOT NULL,
    title text NOT NULL,
    description text,
    priority text,
    context text,
    plot text,
    start_date timestamptz,
    due_date timestamptz,
    is_mit boolean DEFAULT false,
    is_completed boolean DEFAULT false,
    created_at timestamptz DEFAULT now(),
    completed_at timestamptz,
    calendar_event_id text,
    branches jsonb,
    recurrence jsonb,
    is_recurring_template boolean DEFAULT false,
    parent_task_id uuid REFERENCES public.tasks(id)
);

-- Wildflowers table
CREATE TABLE public.wildflowers (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES auth.users(id) NOT NULL,
    title text NOT NULL,
    description text,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz
);

-- Contexts table
CREATE TABLE public.contexts (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES auth.users(id) NOT NULL,
    name text NOT NULL,
    UNIQUE(user_id, name)
);

-- Plots table
CREATE TABLE public.plots (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES auth.users(id) NOT NULL,
    name text NOT NULL,
    UNIQUE(user_id, name)
);

-- Templates table
CREATE TABLE public.templates (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES auth.users(id) NOT NULL,
    name text NOT NULL,
    task_data jsonb NOT NULL,
    created_at timestamptz DEFAULT now()
);

-- Part C: Enable Row Level Security (RLS)
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wildflowers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contexts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.plots ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.templates ENABLE ROW LEVEL SECURITY;

-- Part D: Create RLS Policies

-- Tasks table policy
CREATE POLICY "Users can manage their own data" ON public.tasks
    FOR ALL USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Wildflowers table policy
CREATE POLICY "Users can manage their own data" ON public.wildflowers
    FOR ALL USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Contexts table policy
CREATE POLICY "Users can manage their own data" ON public.contexts
    FOR ALL USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Plots table policy
CREATE POLICY "Users can manage their own data" ON public.plots
    FOR ALL USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Templates table policy
CREATE POLICY "Users can manage their own data" ON public.templates
    FOR ALL USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id); 