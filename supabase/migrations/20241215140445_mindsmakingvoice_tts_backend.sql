-- Location: supabase/migrations/20241215140445_mindsmakingvoice_tts_backend.sql
-- Schema Analysis: No existing schema found - creating complete schema from scratch
-- Integration Type: Auth-enabled mode - Authentication system with voice presets management
-- Dependencies: Creating auth system with user_profiles and voice_presets tables

-- 1. Custom Types
CREATE TYPE public.user_role AS ENUM ('admin', 'premium', 'free');

-- 2. Core User Profile Table (Critical intermediary table)
CREATE TABLE public.user_profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL UNIQUE,
    full_name TEXT NOT NULL,
    role public.user_role DEFAULT 'free'::public.user_role,
    subscription_active BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 3. Voice Presets Table (References user_profiles, not auth.users)
CREATE TABLE public.voice_presets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.user_profiles(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    voice_style TEXT NOT NULL,
    voice_speed TEXT NOT NULL,
    voice_pitch TEXT NOT NULL,
    emotion TEXT NOT NULL,
    character TEXT NOT NULL,
    is_default BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 4. Generated Audio History Table (Optional for future use)
CREATE TABLE public.audio_generations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.user_profiles(id) ON DELETE CASCADE,
    preset_id UUID REFERENCES public.voice_presets(id) ON DELETE SET NULL,
    text_content TEXT NOT NULL,
    audio_url TEXT,
    duration_seconds INTEGER,
    generated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 5. Essential Indexes
CREATE INDEX idx_user_profiles_email ON public.user_profiles(email);
CREATE INDEX idx_voice_presets_user_id ON public.voice_presets(user_id);
CREATE INDEX idx_voice_presets_is_default ON public.voice_presets(is_default) WHERE is_default = true;
CREATE INDEX idx_audio_generations_user_id ON public.audio_generations(user_id);
CREATE INDEX idx_audio_generations_preset_id ON public.audio_generations(preset_id);

-- 6. Functions for automatic profile creation and updated_at triggers
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
SECURITY DEFINER
LANGUAGE plpgsql
AS $$
BEGIN
  INSERT INTO public.user_profiles (id, email, full_name, role)
  VALUES (
    NEW.id, 
    NEW.email, 
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
    COALESCE((NEW.raw_user_meta_data->>'role')::public.user_role, 'free'::public.user_role)
  );
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER
SECURITY DEFINER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$;

-- 7. Enable RLS on all tables
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.voice_presets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audio_generations ENABLE ROW LEVEL SECURITY;

-- 8. RLS Policies using correct patterns

-- Pattern 1: Core user table (user_profiles) - Simple only, no functions
CREATE POLICY "users_manage_own_user_profiles"
ON public.user_profiles
FOR ALL
TO authenticated
USING (id = auth.uid())
WITH CHECK (id = auth.uid());

-- Pattern 2: Simple user ownership for voice_presets
CREATE POLICY "users_manage_own_voice_presets"
ON public.voice_presets
FOR ALL
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- Pattern 2: Simple user ownership for audio_generations
CREATE POLICY "users_manage_own_audio_generations"
ON public.audio_generations
FOR ALL
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- 9. Triggers
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

CREATE TRIGGER on_user_profiles_updated
  BEFORE UPDATE ON public.user_profiles
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER on_voice_presets_updated
  BEFORE UPDATE ON public.voice_presets
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- 10. Mock Data with Complete Auth Users
DO $$
DECLARE
    demo_user_uuid UUID := gen_random_uuid();
    premium_user_uuid UUID := gen_random_uuid();
    preset1_uuid UUID := gen_random_uuid();
    preset2_uuid UUID := gen_random_uuid();
    preset3_uuid UUID := gen_random_uuid();
BEGIN
    -- Create complete auth.users records (required for proper relationships)
    INSERT INTO auth.users (
        id, instance_id, aud, role, email, encrypted_password, email_confirmed_at,
        created_at, updated_at, raw_user_meta_data, raw_app_meta_data,
        is_sso_user, is_anonymous, confirmation_token, confirmation_sent_at,
        recovery_token, recovery_sent_at, email_change_token_new, email_change,
        email_change_sent_at, email_change_token_current, email_change_confirm_status,
        reauthentication_token, reauthentication_sent_at, phone, phone_change,
        phone_change_token, phone_change_sent_at
    ) VALUES
        (demo_user_uuid, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
         'demo@mindsmakingvoice.com', crypt('demo123', gen_salt('bf', 10)), now(), now(), now(),
         '{"full_name": "Demo User"}'::jsonb, '{"provider": "email", "providers": ["email"]}'::jsonb,
         false, false, '', null, '', null, '', '', null, '', 0, '', null, null, '', '', null),
        (premium_user_uuid, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
         'premium@mindsmakingvoice.com', crypt('premium123', gen_salt('bf', 10)), now(), now(), now(),
         '{"full_name": "Premium User", "role": "premium"}'::jsonb, '{"provider": "email", "providers": ["email"]}'::jsonb,
         false, false, '', null, '', null, '', '', null, '', 0, '', null, null, '', '', null);

    -- Create default voice presets
    INSERT INTO public.voice_presets (id, user_id, name, voice_style, voice_speed, voice_pitch, emotion, character, is_default) VALUES
        (preset1_uuid, demo_user_uuid, 'Professional Female', 'female', 'normal', 'medium', 'neutral', 'chloe', true),
        (preset2_uuid, demo_user_uuid, 'Excited Announcer', 'male', 'fast', 'high', 'excited', 'david', false),
        (preset3_uuid, premium_user_uuid, 'Calm Narrator', 'female', 'slow', 'low', 'calm', 'emma', true);

    -- Sample audio generation history
    INSERT INTO public.audio_generations (user_id, preset_id, text_content, duration_seconds) VALUES
        (demo_user_uuid, preset1_uuid, 'Welcome to MindsMakingVoice, the best text-to-speech platform.', 8),
        (demo_user_uuid, preset2_uuid, 'Check out our amazing features and premium voice options!', 6),
        (premium_user_uuid, preset3_uuid, 'This is a sample of our premium narrator voice with advanced emotional tones.', 12);

EXCEPTION
    WHEN foreign_key_violation THEN
        RAISE NOTICE 'Foreign key error: %', SQLERRM;
    WHEN unique_violation THEN
        RAISE NOTICE 'Unique constraint error: %', SQLERRM;
    WHEN OTHERS THEN
        RAISE NOTICE 'Unexpected error: %', SQLERRM;
END $$;

-- 11. Helpful cleanup function for development
CREATE OR REPLACE FUNCTION public.cleanup_demo_data()
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    demo_user_ids_to_delete UUID[];
BEGIN
    -- Get demo user IDs first
    SELECT ARRAY_AGG(id) INTO demo_user_ids_to_delete
    FROM auth.users
    WHERE email LIKE '%@mindsmakingvoice.com';

    -- Delete in dependency order (children first, then auth.users last)
    DELETE FROM public.audio_generations WHERE user_id = ANY(demo_user_ids_to_delete);
    DELETE FROM public.voice_presets WHERE user_id = ANY(demo_user_ids_to_delete);
    DELETE FROM public.user_profiles WHERE id = ANY(demo_user_ids_to_delete);
    
    -- Delete auth.users last (after all references are removed)
    DELETE FROM auth.users WHERE id = ANY(demo_user_ids_to_delete);
    
    RAISE NOTICE 'Demo data cleaned up successfully';
EXCEPTION
    WHEN foreign_key_violation THEN
        RAISE NOTICE 'Foreign key constraint prevents deletion: %', SQLERRM;
    WHEN OTHERS THEN
        RAISE NOTICE 'Cleanup failed: %', SQLERRM;
END;
$$;

-- Usage comment
-- To clean up demo data, run: SELECT public.cleanup_demo_data();