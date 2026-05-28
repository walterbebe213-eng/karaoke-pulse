-- Create table to hold real-time coordinated room settings and passcode
CREATE TABLE IF NOT EXISTS public.lounge_settings (
    id TEXT PRIMARY KEY,
    host_password TEXT NOT NULL DEFAULT '1234',
    lighting_preset TEXT NOT NULL DEFAULT 'pulse',
    master_volume INTEGER NOT NULL DEFAULT 82,
    mic_gain INTEGER NOT NULL DEFAULT 65,
    is_playing BOOLEAN NOT NULL DEFAULT true,
    emergency_active BOOLEAN NOT NULL DEFAULT false,
    triggered_effect TEXT, -- can hold values like 'applause:timestamp' to trigger real-time sound events
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable publication for Realtime subscriptions
ALTER publication supabase_realtime ADD TABLE public.lounge_settings;

-- Insert initial single-row state for the main lounge session
INSERT INTO public.lounge_settings (id, host_password, lighting_preset, master_volume, mic_gain, is_playing, emergency_active, triggered_effect)
VALUES ('main-room-settings', '1234', 'pulse', 82, 65, true, false, NULL)
ON CONFLICT (id) DO NOTHING;
