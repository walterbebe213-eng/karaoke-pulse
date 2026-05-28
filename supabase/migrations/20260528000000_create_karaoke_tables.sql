-- Create table to hold the active Karaoke queue
CREATE TABLE IF NOT EXISTS public.queue_items (
    id TEXT PRIMARY KEY,
    singer TEXT NOT NULL,
    song_title TEXT NOT NULL,
    artist TEXT NOT NULL,
    time_requested TEXT NOT NULL,
    position INTEGER NOT NULL,
    likes INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Index queue position to guarantee fast ordering queries
CREATE INDEX IF NOT EXISTS queue_items_position_idx ON public.queue_items (position);

-- Create table to hold the Song Library Catalog
CREATE TABLE IF NOT EXISTS public.library_songs (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    artist TEXT NOT NULL,
    category TEXT NOT NULL,
    times_requested INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Index library songs for fast search on title and artist
CREATE INDEX IF NOT EXISTS library_songs_title_artist_idx ON public.library_songs (title, artist);

-- Enable publication for Realtime subscriptions
ALTER publication supabase_realtime ADD TABLE public.queue_items;
ALTER publication supabase_realtime ADD TABLE public.library_songs;

-- Insert the default catalog songs to bootstrap the library
INSERT INTO public.library_songs (id, title, artist, category, times_requested) VALUES
('lib-1', 'Flowers', 'Miley Cyrus', 'Pop/Hits', 1),
('lib-2', 'Bohemian Rhapsody', 'Queen', 'Rock/Classic', 1),
('lib-3', 'Evidências', 'Chitãozinho & Xororó', 'Nacionais', 1),
('lib-4', 'Dancing Queen', 'ABBA', 'Pop/Hits', 0),
('lib-5', 'Rolling in the Deep', 'Adele', 'Pop/Hits', 0),
('lib-6', 'Wonderwall', 'Oasis', 'Rock/Classic', 0),
('lib-7', 'As It Was', 'Harry Styles', 'Pop/Hits', 0),
('lib-8', 'Hotel California', 'Eagles', 'Rock/Classic', 0),
('lib-9', 'Billie Jean', 'Michael Jackson', 'Pop/Hits', 0),
('lib-10', 'Creep', 'Radiohead', 'Rock/Classic', 0),
('lib-11', 'Sweet Child O'' Mine', 'Guns N'' Roses', 'Rock/Classic', 0),
('lib-12', 'I Will Survive', 'Gloria Gaynor', 'Pop/Hits', 0)
ON CONFLICT (id) DO NOTHING;
