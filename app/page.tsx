"use client";

import React, { useState, useEffect, useRef } from "react";
import { 
  Search, 
  Bell, 
  Mic, 
  Clock, 
  Hourglass, 
  Heart, 
  Volume2, 
  Activity, 
  Sliders, 
  Trash2, 
  ArrowUp, 
  ListPlus, 
  Shuffle, 
  Sparkles, 
  User, 
  History as HistoryIcon, 
  Play, 
  Pause, 
  SkipForward, 
  RotateCcw, 
  Wifi, 
  AlertOctagon, 
  Music, 
  ChevronRight, 
  X,
  Check,
  Layers,
  Sparkle
} from "lucide-react";

// Standard popular catalog songs
const DEFAULT_SONGS = [
  { title: "Flowers", artist: "Miley Cyrus" },
  { title: "Bohemian Rhapsody", artist: "Queen" },
  { title: "Evidências", artist: "Chitãozinho & Xororó" },
  { title: "Dancing Queen", artist: "ABBA" },
  { title: "Rolling in the Deep", artist: "Adele" },
  { title: "Wonderwall", artist: "Oasis" },
  { title: "As It Was", artist: "Harry Styles" },
  { title: "Hotel California", artist: "Eagles" },
  { title: "Billie Jean", artist: "Michael Jackson" },
  { title: "Creep", artist: "Radiohead" },
  { title: "Sweet Child O' Mine", artist: "Guns N' Roses" },
  { title: "I Will Survive", artist: "Gloria Gaynor" }
];

import { supabase, isSupabaseConfigured } from "@/lib/supabase";

const mapQueueFromDb = (row: any, userQueueItemId: string | null): QueueItem => ({
  id: row.id,
  singer: row.singer,
  songTitle: row.song_title,
  artist: row.artist,
  timeRequested: row.time_requested,
  position: row.position,
  likes: row.likes,
  isUser: userQueueItemId ? row.id === userQueueItemId : false
});

const mapQueueToDb = (item: QueueItem) => ({
  id: item.id,
  singer: item.singer,
  song_title: item.songTitle,
  artist: item.artist,
  time_requested: item.timeRequested,
  position: item.position,
  likes: item.likes
});

interface QueueItem {
  id: string;
  singer: string;
  songTitle: string;
  artist: string;
  timeRequested: string;
  position: number;
  likes: number;
  isUser?: boolean;
}

export default function Home() {
  // Global States
  const [activeTab, setActiveTab] = useState<"client" | "host">("client");
  const [lightingPreset, setLightingPreset] = useState<"pulse" | "chill" | "electric" | "solo">("pulse");
  
  // Host Library and active sidebar tab status
  const [hostTab, setHostTab] = useState<"queue" | "library">("queue");
  const [hostLibrarySearch, setHostLibrarySearch] = useState<string>("");
  const [hostLibraryCategory, setHostLibraryCategory] = useState<string>("Todas");

  // Library catalog songs dynamic state - allowing adding songs to it!
  const [librarySongs, setLibrarySongs] = useState<{ id: string; title: string; artist: string; category: string; timesRequested: number }[]>([
    { id: "lib-1", title: "Flowers", artist: "Miley Cyrus", category: "Pop/Hits", timesRequested: 1 },
    { id: "lib-2", title: "Bohemian Rhapsody", artist: "Queen", category: "Rock/Classic", timesRequested: 1 },
    { id: "lib-3", title: "Evidências", artist: "Chitãozinho & Xororó", category: "Nacionais", timesRequested: 1 },
    { id: "lib-4", title: "Dancing Queen", artist: "ABBA", category: "Pop/Hits", timesRequested: 0 },
    { id: "lib-5", title: "Rolling in the Deep", artist: "Adele", category: "Pop/Hits", timesRequested: 0 },
    { id: "lib-6", title: "Wonderwall", artist: "Oasis", category: "Rock/Classic", timesRequested: 0 },
    { id: "lib-7", title: "As It Was", artist: "Harry Styles", category: "Pop/Hits", timesRequested: 0 },
    { id: "lib-8", title: "Hotel California", artist: "Eagles", category: "Rock/Classic", timesRequested: 0 },
    { id: "lib-9", title: "Billie Jean", artist: "Michael Jackson", category: "Pop/Hits", timesRequested: 0 },
    { id: "lib-10", title: "Creep", artist: "Radiohead", category: "Rock/Classic", timesRequested: 0 },
    { id: "lib-11", title: "Sweet Child O' Mine", artist: "Guns N' Roses", category: "Rock/Classic", timesRequested: 0 },
    { id: "lib-12", title: "I Will Survive", artist: "Gloria Gaynor", category: "Pop/Hits", timesRequested: 0 }
  ]);

  // Form states to Register new track into library
  const [newLibTitle, setNewLibTitle] = useState("");
  const [newLibArtist, setNewLibArtist] = useState("");
  const [newLibCategory, setNewLibCategory] = useState("Pop/Hits");
  const [showAddLibForm, setShowAddLibForm] = useState(false);

  // Host library add-to-queue inline/modal state
  const [selectedLibSongForQueue, setSelectedLibSongForQueue] = useState<{ title: string; artist: string } | null>(null);
  const [queueSingerName, setQueueSingerName] = useState("");
  const [masterVolume, setMasterVolume] = useState<number>(82);
  const [micGain, setMicGain] = useState<number>(65);
  
  // Real-time Queue State
  const [queue, setQueue] = useState<QueueItem[]>([
    {
      id: "q-1",
      singer: "Paloma S.",
      songTitle: "Flowers",
      artist: "Miley Cyrus",
      timeRequested: "12:38 PM",
      position: 1,
      likes: 12
    },
    {
      id: "q-2",
      singer: "Ricardo Alves",
      songTitle: "Bohemian Rhapsody",
      artist: "Queen",
      timeRequested: "12:45 PM",
      position: 2,
      likes: 8
    },
    {
      id: "q-3",
      singer: "Juliana M.",
      songTitle: "Evidências",
      artist: "Chitãozinho & Xororó",
      timeRequested: "12:51 PM",
      position: 3,
      likes: 15
    }
  ]);

  // Current Playing State
  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [nowPlayingProgress, setNowPlayingProgress] = useState<number>(45); // percent
  const [nowPlayingTime, setNowPlayingTime] = useState<number>(104); // seconds (1:44)
  const totalDuration = 231; // 3:51

  // User Interactive Search & Form for mobile
  const [userName, setUserName] = useState<string>("");
  const [songSearch, setSongSearch] = useState<string>("");
  const [selectedSong, setSelectedSong] = useState<{title: string, artist: string} | null>(null);
  const [searchDropdownOpen, setSearchDropdownOpen] = useState<boolean>(false);
  const [userQueueItem, setUserQueueItem] = useState<QueueItem | null>(null);
  const [isEditingRequest, setIsEditingRequest] = useState<boolean>(false);
  const [showCancelConfirm, setShowCancelConfirm] = useState<boolean>(false);

  // AI Recommender state
  const [aiPrompt, setAiPrompt] = useState<string>("");
  const [aiSuggestions, setAiSuggestions] = useState<{title: string, artist: string}[]>([]);
  const [aiLoading, setAiLoading] = useState<boolean>(false);
  const [showAiModal, setShowAiModal] = useState<boolean>(false);

  // New Request modal for host
  const [hostNewRequestOpen, setHostNewRequestOpen] = useState<boolean>(false);
  const [hostNewName, setHostNewName] = useState<string>("");
  const [hostNewSong, setHostNewSong] = useState<string>("");
  const [hostNewArtist, setHostNewArtist] = useState<string>("");

  // Sound effect feedback animation
  const [triggeredEffect, setTriggeredEffect] = useState<string | null>(null);
  const [emergencyActive, setEmergencyActive] = useState<boolean>(false);

  // History state of sung songs
  const [history, setHistory] = useState([
    { title: "Flowers", artist: "Miley Cyrus", singer: "Marina", time: "12:35 PM" },
    { title: "As It Was", artist: "Harry Styles", singer: "Carlos", time: "12:20 PM" },
    { title: "Wonderwall", artist: "Oasis", singer: "Lucas G.", time: "12:05 PM" }
  ]);

  // Bottom Nav Bar active element for client view ("Songs" | "My Queue" | "Profile")
  const [clientSubTab, setClientSubTab] = useState<"songs" | "queue" | "profile">("songs");

  // Timer Ref for song progress simulation
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Audio synthesis helper for soundboard effects (HTML5 Oscillator Synthesis)
  const playSynthesizedSound = (type: string) => {
    try {
      if (typeof window === "undefined") return;
      
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      
      const ctx = new AudioCtx();
      setTriggeredEffect(type);
      
      // Auto dim trigger name after 1.5s
      setTimeout(() => {
        setTriggeredEffect(null);
      }, 1500);

      switch (type) {
        case "applause": {
          // Sparkly sweeping white noise
          const bufferSize = ctx.sampleRate * 1.5;
          const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
          const data = buffer.getChannelData(0);
          for (let i = 0; i < bufferSize; i++) {
            data[i] = Math.random() * 2 - 1;
          }
          const noise = ctx.createBufferSource();
          noise.buffer = buffer;
          
          const filter = ctx.createBiquadFilter();
          filter.type = "bandpass";
          filter.frequency.setValueAtTime(1000, ctx.currentTime);
          filter.frequency.exponentialRampToValueAtTime(1500, ctx.currentTime + 1.2);
          
          const gain = ctx.createGain();
          gain.gain.setValueAtTime(0.15, ctx.currentTime);
          gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 1.4);
          
          noise.connect(filter);
          filter.connect(gain);
          gain.connect(ctx.destination);
          noise.start();
          break;
        }

        case "airhorn": {
          // Epic dual sliding pitch oscillators
          const osc1 = ctx.createOscillator();
          const osc2 = ctx.createOscillator();
          const gain = ctx.createGain();
          
          osc1.type = "sawtooth";
          osc2.type = "sawtooth";
          
          osc1.frequency.setValueAtTime(320, ctx.currentTime);
          osc1.frequency.linearRampToValueAtTime(300, ctx.currentTime + 0.1);
          osc1.frequency.setValueAtTime(300, ctx.currentTime + 0.15);
          osc1.frequency.linearRampToValueAtTime(280, ctx.currentTime + 0.8);

          osc2.frequency.setValueAtTime(324, ctx.currentTime);
          osc2.frequency.linearRampToValueAtTime(304, ctx.currentTime + 0.1);
          osc2.frequency.setValueAtTime(304, ctx.currentTime + 0.15);
          osc2.frequency.linearRampToValueAtTime(284, ctx.currentTime + 0.8);
          
          gain.gain.setValueAtTime(0.12, ctx.currentTime);
          gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.9);
          
          osc1.connect(gain);
          osc2.connect(gain);
          gain.connect(ctx.destination);
          
          osc1.start();
          osc2.start();
          setTimeout(() => {
            osc1.stop();
            osc2.stop();
          }, 900);
          break;
        }

        case "hype": {
          // Fast futuristic arpeggio
          const notes = [440, 554, 659, 880];
          notes.forEach((freq, idx) => {
            const osc = ctx.createOscillator();
            const oscGain = ctx.createGain();
            osc.type = "triangle";
            osc.frequency.setValueAtTime(freq, ctx.currentTime + idx * 0.1);
            oscGain.gain.setValueAtTime(0.08, ctx.currentTime + idx * 0.1);
            oscGain.gain.exponentialRampToValueAtTime(0.005, ctx.currentTime + idx * 0.1 + 0.2);
            osc.connect(oscGain);
            oscGain.connect(ctx.destination);
            osc.start(ctx.currentTime + idx * 0.1);
            setTimeout(() => {
              try { osc.stop(); } catch (e) {}
            }, (idx * 0.1 + 0.35) * 1000);
          });
          break;
        }

        case "magic": {
          // Sweeping chime oscillator with delay-like sparkles
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = "sine";
          osc.frequency.setValueAtTime(600, ctx.currentTime);
          osc.frequency.exponentialRampToValueAtTime(2200, ctx.currentTime + 0.8);
          
          gain.gain.setValueAtTime(0.08, ctx.currentTime);
          gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.9);
          
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start();
          setTimeout(() => osc.stop(), 900);
          break;
        }

        case "laugh": {
          // Rapid woodwind-like high-pitch beeps
          for (let i = 0; i < 5; i++) {
            const osc = ctx.createOscillator();
            const gainNode = ctx.createGain();
            osc.type = "sawtooth";
            osc.frequency.setValueAtTime(700 + Math.sin(i) * 100, ctx.currentTime + i * 0.12);
            gainNode.gain.setValueAtTime(0.05, ctx.currentTime + i * 0.12);
            gainNode.gain.exponentialRampToValueAtTime(0.002, ctx.currentTime + i * 0.12 + 0.1);
            osc.connect(gainNode);
            gainNode.connect(ctx.destination);
            osc.start(ctx.currentTime + i * 0.12);
            setTimeout(() => {
              try { osc.stop(); } catch (e) {}
            }, (i * 0.12 + 0.15) * 1000);
          }
          break;
        }

        case "drumroll": {
          // Fast low rumble with a crash
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = "triangle";
          osc.frequency.setValueAtTime(80, ctx.currentTime);
          // modulate pitch frequency for rumble
          for (let t = 0; t < 10; t++) {
            osc.frequency.setValueAtTime(70 + (t % 2 === 0 ? 25 : -25), ctx.currentTime + t * 0.08);
          }
          gain.gain.setValueAtTime(0.2, ctx.currentTime);
          gain.gain.linearRampToValueAtTime(0.2, ctx.currentTime + 0.7);
          gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 1.2);
          
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start();
          
          // Add cymbal crash at the end
          setTimeout(() => {
            const crashOsc = ctx.createOscillator();
            const crashGain = ctx.createGain();
            crashOsc.type = "sawtooth";
            crashOsc.frequency.setValueAtTime(2000, ctx.currentTime);
            crashGain.gain.setValueAtTime(0.1, ctx.currentTime);
            crashGain.gain.exponentialRampToValueAtTime(0.005, ctx.currentTime + 0.6);
            crashOsc.connect(crashGain);
            crashGain.connect(ctx.destination);
            crashOsc.start();
            setTimeout(() => { try { crashOsc.stop(); } catch(e){} }, 700);
          }, 700);

          setTimeout(() => osc.stop(), 1200);
          break;
        }
      }
    } catch(err) {
      console.warn("Audio Context is blocked or unsupported on this device.", err);
    }
  };

  // Handle advancing of active singer queue
  const advanceQueue = React.useCallback(async () => {
    if (queue.length === 0) return;
    
    // Add current singer to completed history
    const finishedItem = queue[0];
    const finishedTrack = {
      title: finishedItem.songTitle,
      artist: finishedItem.artist,
      singer: finishedItem.singer,
      time: new Date().toLocaleTimeString("en-US", { hour: 'numeric', minute: '2-digit' })
    };

    setHistory((prev) => [finishedTrack, ...prev.slice(0, 4)]);

    // Reconstruct next items
    const rest = queue.slice(1);
    const updated = rest.map((item, idx) => ({
      ...item,
      position: idx + 1
    }));
    
    setQueue(updated);
    setNowPlayingTime(0);
    setNowPlayingProgress(0);

    // Sync user item if they were bumped or finished
    const userItem = updated.find(q => q.isUser);
    if (userItem) {
      setUserQueueItem(userItem);
    } else if (userQueueItem && finishedItem.isUser) {
      setUserQueueItem(null); // User just finished singing!
      setClientSubTab("profile"); // Swithed to profile completion tab
    }

    // SUPABASE DATA SYNC
    if (isSupabaseConfigured && supabase) {
      try {
        await supabase.from("queue_items").delete().eq("id", finishedItem.id);
        if (updated.length > 0) {
          await supabase.from("queue_items").upsert(updated.map(mapQueueToDb));
        }
      } catch (err) {
        console.error("Error advancing queue in Supabase:", err);
      }
    }
  }, [queue, userQueueItem]);

  // Load initial state from Supabase & Subscribe to changes in real-time
  useEffect(() => {
    if (!isSupabaseConfigured || !supabase) {
      console.log("Supabase is not configured yet. Running in offline memory-grid simulation mode.");
      return;
    }

    const client = supabase;
    const storedUserId = typeof window !== "undefined" ? localStorage.getItem("user_queue_item_id") : null;

    // Load active karaoke queue
    const loadQueue = async () => {
      try {
        const { data, error } = await client
          .from("queue_items")
          .select("*")
          .order("position", { ascending: true });

        if (error) {
          console.error("Error loading queue from Supabase:", error);
        } else if (data) {
          const mapped = data.map(q => mapQueueFromDb(q, storedUserId));
          setQueue(mapped);

          // Update user queue item in state if found
          const userItem = mapped.find(q => q.isUser);
          if (userItem) {
            setUserQueueItem(userItem);
          } else {
            setUserQueueItem(null);
          }
        }
      } catch (err) {
        console.error("Unexpected error loading queue:", err);
      }
    };

    // Load music library
    const loadLibrary = async () => {
      try {
        const { data, error } = await client
          .from("library_songs")
          .select("*")
          .order("created_at", { ascending: true });

        if (error) {
          console.error("Error loading library from Supabase:", error);
        } else if (data && data.length > 0) {
          setLibrarySongs(data.map(item => ({
            id: item.id,
            title: item.title,
            artist: item.artist,
            category: item.category,
            timesRequested: item.times_requested
          })));
        }
      } catch (err) {
        console.error("Unexpected error loading library:", err);
      }
    };

    loadQueue();
    loadLibrary();

    // Setup real-time listeners for instant synchronization across devices
    const queueChannel = client
      .channel("live_queue")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "queue_items" },
        () => {
          loadQueue();
        }
      )
      .subscribe();

    const libraryChannel = client
      .channel("live_library")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "library_songs" },
        () => {
          loadLibrary();
        }
      )
      .subscribe();

    return () => {
      client.removeChannel(queueChannel);
      client.removeChannel(libraryChannel);
    };
  }, []);

  // Auto progression interval setup for active song
  useEffect(() => {
    if (isPlaying && !emergencyActive) {
      timerRef.current = setInterval(() => {
        setNowPlayingTime((prev) => {
          if (prev >= totalDuration) {
            // Song ends! Advance the singer queue of the Karaokê
            advanceQueue();
            return 0;
          }
          const nextSec = prev + 1;
          setNowPlayingProgress(Math.round((nextSec / totalDuration) * 100));
          return nextSec;
        });
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isPlaying, emergencyActive, advanceQueue]);

  // Sync state functions for host UI queue reordering/manipulations
  const handleMoveUp = async (id: string) => {
    const idx = queue.findIndex(q => q.id === id);
    if (idx <= 1) return; // Cant move above 1st (singing) or already 2nd (next in line)

    const updated = [...queue];
    const temp = updated[idx];
    updated[idx] = updated[idx - 1];
    updated[idx - 1] = temp;

    const remapped = updated.map((item, index) => ({
      ...item,
      position: index + 1
    }));

    setQueue(remapped);
    
    // Update user queue position if active
    const userItem = remapped.find(q => q.isUser);
    if (userItem) setUserQueueItem(userItem);

    // SUPABASE DATA SYNC
    if (isSupabaseConfigured && supabase) {
      try {
        await supabase.from("queue_items").upsert(remapped.map(mapQueueToDb));
      } catch (err) {
        console.error("Error moving queue item up in Supabase:", err);
      }
    }
  };

  const handleSkipToThis = async (id: string) => {
    const idx = queue.findIndex(q => q.id === id);
    if (idx === -1) return;

    // Shift specified item to position 1, moving current to history or queue shift
    const selectedItem = queue[idx];
    const withoutSelected = queue.filter(q => q.id !== id);
    const updated = [selectedItem, ...withoutSelected].map((item, index) => ({
      ...item,
      position: index + 1
    }));

    setQueue(updated);
    setNowPlayingTime(0);
    setNowPlayingProgress(0);

    const userItem = updated.find(q => q.isUser);
    if (userItem) setUserQueueItem(userItem);

    // SUPABASE DATA SYNC
    if (isSupabaseConfigured && supabase) {
      try {
        await supabase.from("queue_items").upsert(updated.map(mapQueueToDb));
      } catch (err) {
        console.error("Error skipping in Supabase queue:", err);
      }
    }
  };

  const handleCancelRequest = async (id: string) => {
    const updated = queue.filter(q => q.id !== id).map((item, index) => ({
      ...item,
      position: index + 1
    }));
    
    setQueue(updated);
    setIsEditingRequest(false);
    setShowCancelConfirm(false);

    const userItem = updated.find(q => q.isUser);
    if (userItem) {
      setUserQueueItem(userItem);
    } else {
      if (queue.find(q => q.id === id)?.isUser) {
        setUserQueueItem(null);
        if (typeof window !== "undefined") {
          localStorage.removeItem("user_queue_item_id");
        }
      }
    }

    // SUPABASE DATA SYNC
    if (isSupabaseConfigured && supabase) {
      try {
        await supabase.from("queue_items").delete().eq("id", id);
        if (updated.length > 0) {
          await supabase.from("queue_items").upsert(updated.map(mapQueueToDb));
        }
      } catch (err) {
        console.error("Error canceling queue item in Supabase:", err);
      }
    }
  };

  const handleShuffleQueue = async () => {
    if (queue.length <= 2) return; // Keep singing singer & immediate next
    const active = queue[0];
    const nextInLine = queue[1];
    const deck = queue.slice(2);

    // Fisher-Yates shuffle
    for (let i = deck.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [deck[i], deck[j]] = [deck[j], deck[i]];
    }

    const shuffled = [active, nextInLine, ...deck].map((item, idx) => ({
      ...item,
      position: idx + 1
    }));

    setQueue(shuffled);
    const userItem = shuffled.find(q => q.isUser);
    if (userItem) setUserQueueItem(userItem);

    // SUPABASE DATA SYNC
    if (isSupabaseConfigured && supabase) {
      try {
        await supabase.from("queue_items").upsert(shuffled.map(mapQueueToDb));
      } catch (err) {
        console.error("Error shuffling Supabase queue:", err);
      }
    }
  };

  // Emergency stop handler
  const handleHostEmergencyStop = () => {
    const result = window.confirm("Halt all audio immediately? This triggers an active block freeze.");
    if (result) {
      setEmergencyActive(true);
      setIsPlaying(false);
    }
  };

  // Client reserve microphone submit
  const handleClientSubmitQueue = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userName.trim()) {
      alert("Por favor, informe seu nome canônico para ser chamado!");
      return;
    }

    // Default to a standard selected song if none was highlighted
    const songName = selectedSong ? selectedSong.title : (songSearch.trim() || "Waiting for selection...");
    const artistName = selectedSong ? selectedSong.artist : "A definir";

    const newRequest: QueueItem = {
      id: `q-user-${Date.now()}`,
      singer: `${userName} (Você)`,
      songTitle: songName,
      artist: artistName,
      timeRequested: new Date().toLocaleTimeString("en-US", { hour: 'numeric', minute: '2-digit' }),
      position: queue.length + 1,
      likes: 0,
      isUser: true
    };

    setQueue([...queue, newRequest]);
    setUserQueueItem(newRequest);

    let chosenSong: { id: string; title: string; artist: string; category: string; timesRequested: number } | null = null;

    // Track dynamic addition or increment in librarySongs
    setLibrarySongs(prev => {
      const existsIdx = prev.findIndex(s => s.title.toLowerCase() === songName.toLowerCase());
      if (existsIdx > -1) {
        const item = prev[existsIdx];
        chosenSong = { ...item, timesRequested: item.timesRequested + 1 };
        return prev.map((s, idx) => idx === existsIdx ? chosenSong! : s);
      } else {
        chosenSong = {
          id: `lib-client-${Date.now()}`,
          title: songName,
          artist: artistName,
          category: "Sugestões",
          timesRequested: 1
        };
        return [...prev, chosenSong!];
      }
    });

    if (typeof window !== "undefined") {
      localStorage.setItem("user_queue_item_id", newRequest.id);
    }

    // SUPABASE DATA SYNC
    if (isSupabaseConfigured && supabase) {
      try {
        await supabase.from("queue_items").insert(mapQueueToDb(newRequest));
        if (chosenSong) {
          await supabase.from("library_songs").upsert({
            id: (chosenSong as any).id,
            title: (chosenSong as any).title,
            artist: (chosenSong as any).artist,
            category: (chosenSong as any).category,
            times_requested: (chosenSong as any).timesRequested
          });
        }
      } catch (err) {
        console.error("Error submitting queue item to Supabase:", err);
      }
    }
    
    // Clear selections
    setSongSearch("");
    setSelectedSong(null);
    setSearchDropdownOpen(false);
  };

  // Client update edit request submit
  const handleClientEditQueue = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userQueueItem) return;
    if (!userName.trim()) {
      alert("Por favor, informe seu nome canônico para ser chamado!");
      return;
    }

    const songName = selectedSong ? selectedSong.title : (songSearch.trim() || "Waiting for selection...");
    const artistName = selectedSong ? selectedSong.artist : "A definir";

    // Update the item inside queue
    const updated = queue.map(q => {
      if (q.id === userQueueItem.id) {
        return {
          ...q,
          singer: `${userName} (Você)`,
          songTitle: songName,
          artist: artistName
        };
      }
      return q;
    });

    setQueue(updated);
    
    // Find updated user item to keep in userQueueItem
    const updatedUserItem = updated.find(q => q.id === userQueueItem.id);
    if (updatedUserItem) {
      setUserQueueItem(updatedUserItem);
    }

    let chosenSong: { id: string; title: string; artist: string; category: string; timesRequested: number } | null = null;

    // Track dynamic addition or increment in librarySongs
    setLibrarySongs(prev => {
      const existsIdx = prev.findIndex(s => s.title.toLowerCase() === songName.toLowerCase());
      if (existsIdx > -1) {
        const item = prev[existsIdx];
        chosenSong = { ...item, timesRequested: item.timesRequested + 1 };
        return prev.map((s, idx) => idx === existsIdx ? chosenSong! : s);
      } else {
        chosenSong = {
          id: `lib-client-${Date.now()}`,
          title: songName,
          artist: artistName,
          category: "Sugestões",
          timesRequested: 1
        };
        return [...prev, chosenSong!];
      }
    });

    // SUPABASE DATA SYNC
    if (isSupabaseConfigured && supabase && updatedUserItem) {
      try {
        await supabase.from("queue_items").upsert(mapQueueToDb(updatedUserItem));
        if (chosenSong) {
          await supabase.from("library_songs").upsert({
            id: (chosenSong as any).id,
            title: (chosenSong as any).title,
            artist: (chosenSong as any).artist,
            category: (chosenSong as any).category,
            times_requested: (chosenSong as any).timesRequested
          });
        }
      } catch (err) {
        console.error("Error editing queue item in Supabase:", err);
      }
    }

    // Reset editing state
    setIsEditingRequest(false);
    setSongSearch("");
    setSelectedSong(null);
  };

  // Host manual add new request
  const handleHostNewRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!hostNewName || !hostNewSong) {
      alert("Preencha o Nome e a Música do Cantor!");
      return;
    }

    const titleVal = hostNewSong.trim();
    const artistVal = hostNewArtist.trim() || "Convidado";

    const newRequest: QueueItem = {
      id: `q-host-${Date.now()}`,
      singer: hostNewName.trim(),
      songTitle: titleVal,
      artist: artistVal,
      timeRequested: new Date().toLocaleTimeString("en-US", { hour: 'numeric', minute: '2-digit' }),
      position: queue.length + 1,
      likes: 0
    };

    setQueue([...queue, newRequest]);

    let chosenSong: { id: string; title: string; artist: string; category: string; timesRequested: number } | null = null;

    // Feed to librarySongs as well
    setLibrarySongs(prev => {
      const existsIdx = prev.findIndex(s => s.title.toLowerCase() === titleVal.toLowerCase());
      if (existsIdx > -1) {
        const item = prev[existsIdx];
        chosenSong = { ...item, timesRequested: item.timesRequested + 1 };
        return prev.map((s, idx) => idx === existsIdx ? chosenSong! : s);
      } else {
        chosenSong = {
          id: `lib-host-${Date.now()}`,
          title: titleVal,
          artist: artistVal,
          category: "Sugestões",
          timesRequested: 1
        };
        return [...prev, chosenSong!];
      }
    });

    // SUPABASE DATA SYNC
    if (isSupabaseConfigured && supabase) {
      try {
        await supabase.from("queue_items").insert(mapQueueToDb(newRequest));
        if (chosenSong) {
          await supabase.from("library_songs").upsert({
            id: (chosenSong as any).id,
            title: (chosenSong as any).title,
            artist: (chosenSong as any).artist,
            category: (chosenSong as any).category,
            times_requested: (chosenSong as any).timesRequested
          });
        }
      } catch (err) {
        console.error("Error submitting manual host request to Supabase:", err);
      }
    }

    setHostNewName("");
    setHostNewSong("");
    setHostNewArtist("");
    setHostNewRequestOpen(false);
  };

  // Add a brand new song to the session's library catalog
  const handleAddSongToLibrary = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLibTitle.trim() || !newLibArtist.trim()) {
      alert("Por favor, preencha o Título e o Artista da música!");
      return;
    }

    // Check if it already exists
    const exists = librarySongs.some(
      s => s.title.toLowerCase() === newLibTitle.trim().toLowerCase() &&
           s.artist.toLowerCase() === newLibArtist.trim().toLowerCase()
    );

    if (exists) {
      alert("Esta música já está cadastrada na biblioteca!");
      return;
    }

    const newSong = {
      id: `lib-custom-${Date.now()}`,
      title: newLibTitle.trim(),
      artist: newLibArtist.trim(),
      category: newLibCategory,
      timesRequested: 0
    };

    setLibrarySongs([...librarySongs, newSong]);

    // SUPABASE DATA SYNC
    if (isSupabaseConfigured && supabase) {
      try {
        await supabase.from("library_songs").insert({
          id: newSong.id,
          title: newSong.title,
          artist: newSong.artist,
          category: newSong.category,
          times_requested: newSong.timesRequested
        });
      } catch (err) {
        console.error("Error adding song to Supabase catalog:", err);
      }
    }
    
    setNewLibTitle("");
    setNewLibArtist("");
    setShowAddLibForm(false);
  };

  // Add selected library song directly to the live queue
  const handleAddLibrarySongToQueue = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedLibSongForQueue) return;
    if (!queueSingerName.trim()) {
      alert("Por favor, informe o nome do Cantor!");
      return;
    }

    let chosenSong: any = null;

    // Increment timesRequested counter in library for statistics
    setLibrarySongs(prev => prev.map(s => {
      if (s.title.toLowerCase() === selectedLibSongForQueue.title.toLowerCase() &&
          s.artist.toLowerCase() === selectedLibSongForQueue.artist.toLowerCase()) {
        chosenSong = { ...s, timesRequested: s.timesRequested + 1 };
        return chosenSong;
      }
      return s;
    }));

    const newRequest: QueueItem = {
      id: `q-host-lib-${Date.now()}`,
      singer: queueSingerName.trim(),
      songTitle: selectedLibSongForQueue.title,
      artist: selectedLibSongForQueue.artist,
      timeRequested: new Date().toLocaleTimeString("en-US", { hour: 'numeric', minute: '2-digit' }),
      position: queue.length + 1,
      likes: 0
    };

    setQueue([...queue, newRequest]);

    // SUPABASE DATA SYNC
    if (isSupabaseConfigured && supabase) {
      try {
        await supabase.from("queue_items").insert(mapQueueToDb(newRequest));
        if (chosenSong) {
          await supabase.from("library_songs").update({ times_requested: chosenSong.timesRequested }).eq("id", chosenSong.id);
        }
      } catch (err) {
        console.error("Error adding library song to queue in Supabase:", err);
      }
    }

    setQueueSingerName("");
    setSelectedLibSongForQueue(null);
  };

  // Query Gemini API server-side endpoint for intelligent mood selection / singer cues
  const handleFetchAiSuggestions = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!aiPrompt.trim()) return;

    setAiLoading(true);
    try {
      const response = await fetch("/api/gemini/suggest", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ prompt: aiPrompt })
      });
      const data = await response.json();
      if (data.success) {
        setAiSuggestions(data.suggestions || []);
      } else {
        console.error(data.message);
        setAiSuggestions(data.suggestions || []);
      }
    } catch (err) {
      console.error("AI Suggestion request failed", err);
    } finally {
      setAiLoading(false);
    }
  };

  // Filter songs array for user dropdown lookup
  const filteredCatalog = librarySongs.filter(s => 
    s.title.toLowerCase().includes(songSearch.toLowerCase()) ||
    s.artist.toLowerCase().includes(songSearch.toLowerCase())
  );

  // Music timing math conversion
  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  // Quick preset helper styles
  const getLightingBackgroundClass = () => {
    switch (lightingPreset) {
      case "pulse":
        return "from-surface via-[#1a120c] to-black";
      case "chill":
        return "from-surface via-[#121212] to-black";
      case "electric":
        return "from-surface via-[#2c1505] to-[#0A0A0A]";
      case "solo":
        return "from-surface via-[#14151a] to-black";
    }
  };

  return (
    <div className={`relative min-h-screen bg-gradient-to-b ${getLightingBackgroundClass()} text-on-background transition-all duration-700 overflow-x-hidden pb-16 md:pb-0`}>
      
      {/* 1. Global Switching Action Bar for AI Studio Interface */}
      <div className="bg-surface-container-lowest/90 backdrop-blur-md border-b border-white/5 py-2 px-4 sticky top-0 z-50 flex items-center justify-between shadow-md">
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-primary animate-pulse shadow-[0_0_8px_#ffb3b5]"></span>
          <span className="font-mono text-[11px] font-bold tracking-widest text-primary uppercase">Workspace Mode Toggles:</span>
        </div>
        
        {/* Toggle Pills */}
        <div className="flex bg-surface-container rounded-full p-1 border border-white/10">
          <button 
            id="btn-switch-client"
            onClick={() => setActiveTab("client")}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold tracking-tight transition-all uppercase ${
              activeTab === "client" 
                ? "bg-gradient-to-r from-tertiary to-primary text-on-primary shadow-sm" 
                : "text-on-surface-variant hover:text-white"
            }`}
          >
            <span>📱</span> Customer Mobile app
          </button>
          <button 
            id="btn-switch-host"
            onClick={() => setActiveTab("host")}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold tracking-tight transition-all uppercase ${
              activeTab === "host" 
                ? "bg-gradient-to-r from-tertiary to-primary text-on-primary shadow-sm animate-pulse" 
                : "text-on-surface-variant hover:text-white"
            }`}
          >
            <span>🖥️</span> Host Command Dashboard
          </button>
        </div>

        {/* Sync Indicator */}
        <div className="hidden sm:flex items-center gap-1.5 bg-surface-container-high px-3 py-1 rounded-full border border-white/5">
          {isSupabaseConfigured ? (
            <>
              <span className="w-2 h-2 rounded-full bg-secondary animate-pulse"></span>
              <span className="font-mono text-[10px] text-secondary font-bold uppercase">Supabase Live Sync</span>
            </>
          ) : (
            <>
              <span className="w-2 h-2 rounded-full bg-[#fca34d]"></span>
              <span className="font-mono text-[10px] text-[#fca34d] font-bold uppercase">Standalone Mode (Off-grid)</span>
            </>
          )}
        </div>
      </div>

      {/* Emergency Overlay Notification Box */}
      {emergencyActive && (
        <div className="fixed inset-0 bg-black/95 z-[9999] flex flex-col items-center justify-center p-6 text-center">
          <div className="w-20 h-20 rounded-full bg-error-container text-error flex items-center justify-center mb-6 animate-bounce">
            <AlertOctagon className="w-12 h-12" />
          </div>
          <h1 className="font-headline text-display-lg text-error mb-2 tracking-tighter">EMERGENCY STOPPED</h1>
          <p className="max-w-md text-on-surface-variant text-body-md mb-8">
            The karaoke room master has halted execution and muted all audio transducers. Please consult the lounge host.
          </p>
          <button 
            id="btn-reset-lounge"
            onClick={() => {
              setEmergencyActive(false);
              setIsPlaying(true);
            }}
            className="px-8 py-3 rounded-full bg-primary text-on-primary font-bold shadow-md hover:scale-105 active:scale-95 transition-all text-sm uppercase"
          >
            Revive Lounge Audio
          </button>
        </div>
      )}

      {/* 2. Visual Ambient Atmospheric Glow Orbs & Large Bold Typography hero-title behind content */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden z-[1]">
        <div className="absolute top-[20%] -left-[10%] w-[60%] h-[40%] bg-primary/5 rounded-full blur-[140px] transition-all duration-1000"></div>
        <div className="absolute bottom-[20%] -right-[10%] w-[50%] h-[35%] bg-tertiary/5 rounded-full blur-[120px] transition-all duration-1000"></div>
        
        {/* Massive Bold Design Theme Typography Watermark */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center select-none opacity-[0.03] transition-all duration-700">
          <h1 className="text-[160px] md:text-[280px] font-black tracking-[-10px] leading-none uppercase text-white font-sora">
            PULSE
          </h1>
        </div>
      </div>

      {/* ==================== SCREEN A: CLIENT MOBILE VIEW ==================== */}
      {activeTab === "client" && (
        <div className="relative max-w-lg mx-auto px-4 pt-6 pb-24 z-10 transition-opacity duration-300">
          
          {/* Mobile Header Bar */}
          <header className="flex justify-between items-center mb-6 border-b border-white/10 pb-4">
            <div className="flex items-center gap-2">
              <span className="p-1 rounded bg-gradient-to-tr from-primary to-tertiary">
                <Music className="w-5 h-5 text-on-primary" />
              </span>
              <h1 className="font-headline text-headline-sm font-bold tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-tertiary to-primary">
                KARAOKE PULSE
              </h1>
            </div>
            <div className="flex gap-3">
              <button className="relative p-2 rounded-full glass-card hover:bg-white/10 transition-all text-primary active:scale-90">
                <Bell className="w-4 h-4" />
                <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-error rounded-full animate-ping"></span>
              </button>
              <button 
                onClick={() => setClientSubTab(clientSubTab === "profile" ? "songs" : "profile")}
                className="p-2 rounded-full glass-card text-primary active:scale-90"
              >
                <User className="w-4 h-4" />
              </button>
            </div>
          </header>

          {/* Sub Tab Panel Selector */}
          <div className="flex gap-2 mb-6">
            <button
              onClick={() => setClientSubTab("songs")}
              className={`flex-1 py-1.5 rounded-full text-xs font-semibold uppercase tracking-wider transition-all border ${
                clientSubTab === "songs"
                  ? "bg-primary/25 border-primary text-primary"
                  : "bg-surface-container-low border-white/5 text-on-surface-variant hover:text-white"
              }`}
            >
              🎤 Reservar
            </button>
            <button
              onClick={() => setClientSubTab("queue")}
              className={`flex-1 py-1.5 rounded-full text-xs font-semibold uppercase tracking-wider transition-all border ${
                clientSubTab === "queue"
                  ? "bg-primary/25 border-primary text-primary"
                  : "bg-surface-container-low border-white/5 text-on-surface-variant hover:text-white"
              }`}
            >
              📋 Ver Fila ({queue.length})
            </button>
            <button
              onClick={() => setClientSubTab("profile")}
              className={`flex-1 py-1.5 rounded-full text-xs font-semibold uppercase tracking-wider transition-all border ${
                clientSubTab === "profile"
                  ? "bg-primary/25 border-primary text-primary"
                  : "bg-surface-container-low border-white/5 text-on-surface-variant hover:text-white"
              }`}
            >
              👤 Perfil
            </button>
          </div>

          {/* Tab Content 1: RESERVAR MICROFONE FORM */}
          {clientSubTab === "songs" && (
            <div className="space-y-6">
              
              {/* CONDITION A: Editing active request */}
              {userQueueItem && isEditingRequest ? (
                <section className="space-y-3 animate-fade-in">
                  <div className="flex items-center gap-2.5">
                    <span className="w-2 h-5 bg-secondary rounded-full shadow-[0_0_12px_rgba(56,189,248,0.5)]"></span>
                    <h2 className="font-headline text-headline-sm text-on-surface font-semibold">Alterar Minha Reserva</h2>
                  </div>

                  <form onSubmit={handleClientEditQueue} className="glass-card p-5 rounded-2xl space-y-5 border border-secondary/20 bg-secondary/5">
                    <div className="space-y-4">
                      
                      {/* Input 1: Singer Name */}
                      <div className="relative">
                        <label className="font-mono text-[11px] font-bold tracking-widest text-[#e6bcbd] uppercase block mb-1.5">Seu Nome</label>
                        <input 
                          type="text"
                          value={userName}
                          onChange={(e) => setUserName(e.target.value)}
                          placeholder="Como quer ser chamado?"
                          className="w-full bg-surface-container-low border-b border-[#5d3f40] focus:border-secondary focus:ring-0 focus:border-b-2 text-on-surface py-2.5 px-3 transition-all outline-none text-sm rounded-t font-semibold"
                          required
                        />
                      </div>

                      {/* Input 2: Dynamic Searchable Song Input */}
                      <div className="relative">
                        <div className="flex justify-between items-center mb-1.5">
                          <label className="font-mono text-[11px] font-bold tracking-widest text-[#e6bcbd] uppercase block">Música</label>
                          <button
                            type="button"
                            onClick={() => {
                              setAiSuggestions([]);
                              setAiPrompt("");
                              setShowAiModal(true);
                            }}
                            className="flex items-center gap-1 text-[10px] text-primary hover:text-white transition-all underline font-bold"
                          >
                            <Sparkle className="w-3 h-3 text-secondary" /> AI Sugerir Música
                          </button>
                        </div>

                        <div className="relative">
                          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant w-[18px] h-[18px]" />
                          <input 
                            type="text"
                            value={songSearch}
                            onChange={(e) => {
                              setSongSearch(e.target.value);
                              setSearchDropdownOpen(true);
                              setSelectedSong(null);
                            }}
                            onFocus={() => setSearchDropdownOpen(true)}
                            placeholder="Procure por música ou artista"
                            className="w-full bg-surface-container-low border-b border-[#5d3f40] focus:border-secondary focus:ring-0 focus:border-b-2 text-on-surface py-2.5 pl-9 pr-3 transition-all outline-none text-sm rounded-t"
                            required
                          />
                          {selectedSong && (
                            <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1.5 text-xs text-secondary bg-surface-container-highest px-2 py-0.5 rounded border border-white/10 animate-fade-in">
                              <span className="w-1.5 h-1.5 bg-secondary rounded-full"></span> Selecionado
                            </div>
                          )}
                        </div>

                        {/* Search Dropdown Suggestion List */}
                        {searchDropdownOpen && songSearch.length > 0 && (
                          <div className="absolute top-full left-0 right-0 max-h-56 overflow-y-auto bg-[#230f2d] border border-white/10 rounded-b-xl z-20 shadow-2xl divide-y divide-white/5 custom-scrollbar">
                            {filteredCatalog.length > 0 ? (
                              filteredCatalog.map((song, idx) => (
                                <button
                                  key={idx}
                                  type="button"
                                  onClick={() => {
                                    setSelectedSong(song);
                                    setSongSearch(`${song.title} — ${song.artist}`);
                                    setSearchDropdownOpen(false);
                                  }}
                                  className="w-full text-left py-2.5 px-4 text-xs font-medium hover:bg-white/5 flex justify-between items-center transition-all bg-opacity-30 group"
                                >
                                  <div>
                                    <p className="text-primary font-bold">{song.title}</p>
                                    <p className="text-on-surface-variant text-[10px]">{song.artist}</p>
                                  </div>
                                  <ChevronRight className="w-3.5 h-3.5 text-on-surface-variant/40 group-hover:text-primary transition-colors" />
                                </button>
                              ))
                            ) : (
                              <div className="py-4 px-4 text-center">
                                <p className="text-xs text-on-surface-variant">Nenhuma música encontrada no catálogo local.</p>
                                <p className="text-[10px] text-primary underline cursor-pointer mt-1 font-bold" onClick={() => {
                                  setSelectedSong({ title: songSearch, artist: "A definir" });
                                  setSearchDropdownOpen(false);
                                }}>
                                  Usar &quot;{songSearch}&quot; mesmo assim
                                </p>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex gap-3 pt-2">
                      <button 
                        type="button"
                        onClick={() => {
                          setIsEditingRequest(false);
                          setSongSearch("");
                          setSelectedSong(null);
                        }}
                        className="flex-1 py-3 px-4 rounded-full border border-white/10 text-on-surface font-semibold text-xs active:scale-95 transition-all cursor-pointer hover:bg-white/5"
                      >
                        NÃO ALTERAR
                      </button>
                      <button 
                        type="submit"
                        className="flex-1 py-3 px-4 rounded-full bg-gradient-to-r from-secondary to-primary text-on-primary font-bold text-xs tracking-wide shadow-[0_0_15px_rgba(255,179,181,0.3)] active:scale-95 transition-all uppercase cursor-pointer"
                      >
                        SALVAR ALTERAÇÃO
                      </button>
                    </div>
                  </form>
                </section>
              ) : userQueueItem ? (
                /* CONDITION B: Active reservation summary card with options to edit or cancel */
                <section className="space-y-4 animate-fade-in">
                  <div className="flex items-center gap-2.5">
                    <span className="w-2 h-5 bg-gradient-to-b from-primary to-secondary rounded-full shadow-[0_0_12px_#ffb3b5]"></span>
                    <h2 className="font-headline text-headline-sm text-on-surface font-semibold">Sua Reserva Ativa</h2>
                  </div>

                  <div className="glass-card p-5 rounded-2xl relative overflow-hidden border border-primary/20 bg-primary/5">
                    <div className="absolute -top-10 -right-10 w-32 h-32 bg-primary/10 rounded-full blur-3xl"></div>
                    
                    <div className="space-y-5">
                      {/* Song specifics */}
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="font-mono text-[9px] font-extrabold tracking-wider text-[#e6bcbd] uppercase">MÚSICA RESERVADA</p>
                          <h3 className="font-headline text-lg font-bold text-white truncate mt-1">
                            {userQueueItem.songTitle}
                          </h3>
                          <p className="text-xs text-on-surface-variant truncate font-body">
                            {userQueueItem.artist}
                          </p>
                        </div>
                        <div className="bg-primary/25 text-primary border border-primary/30 py-2 px-3 rounded-xl text-center font-mono shrink-0">
                          <p className="text-[9px] uppercase font-bold text-primary/80 tracking-wider">FILA</p>
                          <p className="text-xl font-black">#{userQueueItem.position.toString().padStart(2, '0')}</p>
                        </div>
                      </div>

                      {/* Wait time and progress bar */}
                      <div className="p-3 bg-white/5 rounded-xl border border-white/5 space-y-2">
                        <div className="flex justify-between font-mono text-[10px] text-on-surface-variant">
                          <span>TEMPO ESTIMADO ATÉ SUA VEZ</span>
                          <span className="text-primary font-bold">~{userQueueItem.position * 3} MIN</span>
                        </div>
                        <div className="h-1.5 w-full bg-surface-container-high rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-gradient-to-r from-tertiary to-primary rounded-full shadow-[0_0_8px_#d1bcff] transition-all duration-1000"
                            style={{ width: `${Math.max(10, 100 - (userQueueItem.position * 15))}%` }}
                          ></div>
                        </div>
                      </div>

                      {/* Action buttons allowing client to edit or cancel standard reservation */}
                      {showCancelConfirm ? (
                        <div className="bg-error/10 border border-error/30 p-4 rounded-xl space-y-3 animate-fade-in">
                          <p className="text-xs text-error font-bold text-center">
                            Deseja realmente cancelar seu pedido e sair da fila do Karaokê?
                          </p>
                          <div className="grid grid-cols-2 gap-3">
                            <button
                              type="button"
                              onClick={() => {
                                handleCancelRequest(userQueueItem.id);
                                setIsEditingRequest(false);
                                setShowCancelConfirm(false);
                              }}
                              className="py-2 px-3 rounded-lg bg-error text-white text-xs font-bold transition-all text-center cursor-pointer active:scale-95 hover:bg-opacity-90"
                            >
                              Sim, cancelar
                            </button>
                            <button
                              type="button"
                              onClick={() => setShowCancelConfirm(false)}
                              className="py-2 px-3 rounded-lg bg-surface-container-high border border-white/10 text-on-surface text-xs font-bold transition-all text-center cursor-pointer active:scale-95 hover:bg-white/5"
                            >
                              Não, voltar
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="grid grid-cols-2 gap-3 pt-1">
                          <button
                            type="button"
                            onClick={() => {
                              const cleanName = userQueueItem.singer.replace(" (Você)", "");
                              setUserName(cleanName);
                              setSongSearch(`${userQueueItem.songTitle} — ${userQueueItem.artist}`);
                              setSelectedSong({ title: userQueueItem.songTitle, artist: userQueueItem.artist });
                              setIsEditingRequest(true);
                            }}
                            className="py-3 px-2 rounded-xl border border-white/10 hover:border-primary/50 text-on-surface hover:text-primary text-xs font-bold transition-all flex items-center justify-center gap-1.5 bg-surface-container-high/35 cursor-pointer active:scale-95"
                          >
                            <Layers className="w-3.5 h-3.5 text-primary" />
                            <span>Alterar Pedido</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => {
                              setShowCancelConfirm(true);
                            }}
                            className="py-3 px-2 rounded-xl border border-error/20 hover:border-error text-error hover:bg-error/10 text-xs font-bold transition-all flex items-center justify-center gap-1.5 bg-error/5 cursor-pointer active:scale-95"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span>Cancelar Cantor</span>
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </section>
              ) : (
                /* CONDITION C: No active reservation, show standard booking form */
                <section className="space-y-3">
                  <div className="flex items-center gap-2.5">
                    <span className="w-2 h-5 bg-primary rounded-full shadow-[0_0_12px_#ffb3b5]"></span>
                    <h2 className="font-headline text-headline-sm text-on-surface font-medium">Reservar Microfone</h2>
                  </div>

                  <form onSubmit={handleClientSubmitQueue} className="glass-card p-5 rounded-2xl space-y-5">
                    <div className="space-y-4">
                      
                      {/* Input 1: Singer Name */}
                      <div className="relative">
                        <label className="font-mono text-[11px] font-bold tracking-widest text-[#e6bcbd] uppercase block mb-1.5">Seu Nome</label>
                        <input 
                          type="text"
                          value={userName}
                          onChange={(e) => setUserName(e.target.value)}
                          placeholder="Como quer ser chamado?"
                          className="w-full bg-surface-container-low border-b border-[#5d3f40] focus:border-primary focus:ring-0 focus:border-b-2 text-on-surface py-2.5 px-3 transition-all outline-none text-sm rounded-t"
                          required
                        />
                      </div>

                      {/* Input 2: Dynamic Searchable Song Input */}
                      <div className="relative">
                        <div className="flex justify-between items-center mb-1.5">
                          <label className="font-mono text-[11px] font-bold tracking-widest text-[#e6bcbd] uppercase block">Música</label>
                          <button
                            type="button"
                            onClick={() => {
                              setAiSuggestions([]);
                              setAiPrompt("");
                              setShowAiModal(true);
                            }}
                            className="flex items-center gap-1 text-[10px] text-primary hover:text-white transition-all underline font-bold"
                          >
                            <Sparkle className="w-3 h-3 text-secondary" /> AI Sugerir Música
                          </button>
                        </div>

                        <div className="relative">
                          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant w-[18px] h-[18px]" />
                          <input 
                            type="text"
                            value={songSearch}
                            onChange={(e) => {
                              setSongSearch(e.target.value);
                              setSearchDropdownOpen(true);
                              setSelectedSong(null);
                            }}
                            onFocus={() => setSearchDropdownOpen(true)}
                            placeholder="Procure por música ou artista"
                            className="w-full bg-surface-container-low border-b border-[#5d3f40] focus:border-primary focus:ring-0 focus:border-b-2 text-on-surface py-2.5 pl-9 pr-3 transition-all outline-none text-sm rounded-t"
                            required
                          />
                          {selectedSong && (
                            <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1.5 text-xs text-secondary bg-surface-container-highest px-2 py-0.5 rounded border border-white/10 animate-fade-in">
                              <span className="w-1.5 h-1.5 bg-secondary rounded-full"></span> Selecionado
                            </div>
                          )}
                        </div>

                        {/* Search Dropdown Suggestion List */}
                        {searchDropdownOpen && songSearch.length > 0 && (
                          <div className="absolute top-full left-0 right-0 max-h-56 overflow-y-auto bg-[#230f2d] border border-white/10 rounded-b-xl z-20 shadow-2xl divide-y divide-white/5 custom-scrollbar">
                            {filteredCatalog.length > 0 ? (
                              filteredCatalog.map((song, idx) => (
                                <button
                                  key={idx}
                                  type="button"
                                  onClick={() => {
                                    setSelectedSong(song);
                                    setSongSearch(`${song.title} — ${song.artist}`);
                                    setSearchDropdownOpen(false);
                                  }}
                                  className="w-full text-left py-2.5 px-4 text-xs font-medium hover:bg-white/5 flex justify-between items-center transition-all bg-opacity-30 group"
                                >
                                  <div>
                                    <p className="text-primary font-bold">{song.title}</p>
                                    <p className="text-on-surface-variant text-[10px]">{song.artist}</p>
                                  </div>
                                  <ChevronRight className="w-3.5 h-3.5 text-on-surface-variant/40 group-hover:text-primary transition-colors" />
                                </button>
                              ))
                            ) : (
                              <div className="py-4 px-4 text-center">
                                <p className="text-xs text-on-surface-variant">Nenhuma música encontrada no catálogo local.</p>
                                <p className="text-[10px] text-primary underline cursor-pointer mt-1 font-bold" onClick={() => {
                                  setSelectedSong({ title: songSearch, artist: "A definir" });
                                  setSearchDropdownOpen(false);
                                }}>
                                  Usar &quot;{songSearch}&quot; mesmo assim
                                </p>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>

                    <button 
                      type="submit"
                      className="w-full py-4 rounded-full bg-gradient-to-r from-tertiary to-primary text-on-primary font-bold text-sm tracking-wide shadow-[0_0_20px_rgba(255,179,181,0.4)] active:scale-95 hover:scale-[1.01] transition-all uppercase cursor-pointer"
                    >
                      ENTRAR NA FILA
                    </button>
                  </form>
                </section>
              )}

              {/* General Queue View (Standard visual matching image) */}
              <section className="space-y-3">
                <div className="flex justify-between items-end">
                  <h2 className="font-headline text-headline-sm font-semibold text-on-surface">Próximas Músicas</h2>
                  <span className="font-mono text-[9px] font-bold text-tertiary border border-tertiary/30 px-2.5 py-1 rounded tracking-wider bg-tertiary/5 uppercase">
                    LIVE NOW
                  </span>
                </div>

                <div className="space-y-2.5">
                  {/* Item 1: Paloma S. (Cantando) */}
                  {queue.length > 0 ? (
                    queue[0] && (
                      <div className="glass-card p-4 rounded-xl border border-primary/30 flex items-center gap-4 relative">
                        <div className="relative shrink-0">
                          <img 
                            className="w-11 h-11 rounded-full object-cover border-2 border-primary" 
                            alt="Cantando" 
                            src="https://lh3.googleusercontent.com/aida-public/AB6AXuDX7NG2y7GEiLys3hxRL_hP-UQrbEr2fmfO9oQStfQLQ0VZH0Cnrn8Xtmo4kUn7RCROVwzaMyaWn_BleYh-C6l-hX2-pPvbV82SpYoGTxRcdZEKE0UP1YUvyH_GGq6Vola9cXJEIjDErNk8iAuWqIddeJp49VUMoFO3QDjKncFG1a-Olzlpk3o9cNurfAgWOcYmyjbE9IVGQw2CFRNz-ZWEEGmzimA4rpZqD9xOWFoh-gpHHQRyrMl_vZwRT2dUbWF0RrJyeS-VWmc" 
                            onError={(e)=>{
                              e.currentTarget.src = "https://picsum.photos/seed/sing/100/100";
                            }}
                          />
                          <div className="absolute -bottom-1 -right-1 bg-primary w-4.5 h-4.5 rounded-full flex items-center justify-center animate-pulse">
                            <Mic className="text-on-primary w-2.5 h-2.5" />
                          </div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-headline text-sm font-semibold text-primary truncate">
                            {queue[0].singer === userName + " (Você)" ? "Você" : queue[0].singer}
                          </h4>
                          <p className="text-xs text-on-surface-variant truncate font-body">
                            {queue[0].songTitle} — {queue[0].artist}
                          </p>
                        </div>
                        <div className="text-right shrink-0">
                          <span className="font-mono text-[9px] tracking-widest text-primary font-extrabold uppercase bg-primary/10 px-2 py-0.5 rounded border border-primary/20">
                            CANTANDO
                          </span>
                        </div>
                      </div>
                    )
                  ) : (
                    <div className="py-6 text-center border border-dashed border-white/10 rounded-xl">
                      <p className="text-xs text-on-surface-variant">Fila vazia! Seja o primeiro a pedir!</p>
                    </div>
                  )}

                  {/* Rest of queue listing */}
                  {queue.slice(1, 3).map((item) => (
                    <div key={item.id} className="glass-card p-4 rounded-xl flex items-center gap-4 hover:bg-white/5 transition-all">
                      <div className="w-11 h-11 rounded-full bg-surface-container-highest flex items-center justify-center font-headline text-sm text-on-surface-variant font-bold shrink-0">
                        {item.position.toString().padStart(2, '0')}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-headline text-sm font-semibold text-on-surface truncate">{item.singer}</h4>
                        <p className="text-xs text-on-surface-variant truncate font-body">{item.songTitle} — {item.artist}</p>
                      </div>
                      <button 
                        onClick={async () => {
                          const updatedLikes = item.likes + 1;
                          setQueue(prev => prev.map(q => q.id === item.id ? { ...q, likes: updatedLikes } : q));
                          
                          // SUPABASE DATA SYNC
                          if (isSupabaseConfigured && supabase) {
                            try {
                              await supabase.from("queue_items").update({ likes: updatedLikes }).eq("id", item.id);
                            } catch (err) {
                              console.error("Error updating likes in Supabase:", err);
                            }
                          }
                        }}
                        className="text-on-surface-variant hover:text-primary transition-colors flex items-center gap-1 text-xs active:scale-90 shrink-0"
                      >
                        <Heart className="w-4 h-4 fill-transparent hover:fill-primary" />
                        <span className="font-mono text-[10px]">{item.likes > 0 && item.likes}</span>
                      </button>
                    </div>
                  ))}

                  {/* Visual Break indicator (Exactly as image style) */}
                  <div className="py-2.5 flex items-center justify-center gap-4">
                    <div className="h-[1px] flex-1 bg-gradient-to-r from-transparent to-primary/20"></div>
                    <span className="font-mono text-[9px] tracking-widest text-[#e6bcbd] font-medium uppercase font-bold">SUA VEZ ESTÁ PRÓXIMA</span>
                    <div className="h-[1px] flex-1 bg-gradient-to-l from-transparent to-primary/20"></div>
                  </div>

                  {/* User Queue Item */}
                  {userQueueItem && userQueueItem.position > 1 ? (
                    <div className="glass-card p-4 rounded-xl border-tertiary/50 bg-tertiary/5 flex items-center gap-4 shadow-[0_0_15px_rgba(209,188,255,0.15)] animate-fade-in">
                      <div className="w-11 h-11 rounded-full bg-tertiary/20 flex items-center justify-center font-headline text-sm text-tertiary font-bold shrink-0">
                        {userQueueItem.position.toString().padStart(2, '0')}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-headline text-sm font-semibold text-tertiary truncate">Você</h4>
                        <p className="text-xs text-on-surface-variant truncate font-body">{userQueueItem.songTitle} — {userQueueItem.artist}</p>
                      </div>
                      <Hourglass className="w-4 h-4 text-tertiary animate-pulse shrink-0" />
                    </div>
                  ) : !userQueueItem ? (
                    <div className="glass-card p-4 rounded-xl opacity-70 border border-dashed border-white/5 flex items-center gap-4">
                      <div className="w-11 h-11 rounded-full bg-tertiary/10 flex items-center justify-center font-headline text-sm text-on-surface-variant shrink-0">
                        04
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-headline text-sm font-semibold text-on-surface-variant truncate">Você</h4>
                        <p className="text-xs text-on-surface-variant/55 truncate font-body font-mono">Waiting for selection...</p>
                      </div>
                      <Hourglass className="w-4 h-4 text-on-surface-variant/40 shrink-0" />
                    </div>
                  ) : null}
                </div>
              </section>
            </div>
          )}

          {/* Tab Content 2: COMPLETE QUEUE VIEW TAB */}
          {clientSubTab === "queue" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-white/5 pb-2">
                <h3 className="font-headline text-headline-sm font-semibold">Fila do Karaokê ({queue.length})</h3>
                <span className="text-xs font-mono text-primary font-bold">{isPlaying ? "ROLANDO" : "PAUSADA"}</span>
              </div>

              <div className="space-y-2">
                {queue.map((item, idx) => (
                  <div 
                    key={item.id} 
                    className={`glass-card p-4 rounded-xl flex items-center gap-3 relative ${
                      idx === 0 
                        ? "border border-primary/45 bg-primary/5" 
                        : item.isUser 
                          ? "border border-tertiary bg-tertiary/5" 
                          : ""
                    }`}
                  >
                    <div className={`w-9 h-9 rounded-full font-bold flex items-center justify-center text-xs shrink-0 ${
                      idx === 0 
                        ? "bg-primary text-on-primary" 
                        : item.isUser 
                          ? "bg-tertiary text-on-tertiary" 
                          : "bg-surface-container-highest"
                    }`}>
                      {item.isUser ? "VC" : item.position.toString().padStart(2, '0')}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <h4 className="text-sm font-semibold truncate leading-tight">{item.singer}</h4>
                        {idx === 0 && <span className="text-[9px] font-mono text-primary bg-primary/10 px-1 py-0.2 rounded font-bold">CANTANDO</span>}
                        {item.isUser && <span className="text-[9px] font-mono text-tertiary bg-tertiary/10 px-1 py-0.2 rounded font-bold">VOCÊ</span>}
                      </div>
                      <p className="text-xs text-on-surface-variant truncate mt-0.5">{item.songTitle} — {item.artist}</p>
                    </div>

                    <div className="text-right shrink-0 flex items-center gap-2">
                      <span className="text-[10px] font-mono text-on-surface-variant/75 block pt-1">{item.timeRequested}</span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Estimated completion time */}
              <div className="bg-[#2a1738] rounded-xl p-4 border border-white/5 text-center">
                <p className="text-xs text-on-surface-variant leading-relaxed">
                  Tempo estimado restante para zerar a fila: <strong className="text-primary font-mono text-sm">~{queue.length * 4} minutos</strong>
                </p>
                <p className="text-[10px] text-on-surface-variant/60 mt-1 uppercase font-mono">Lounge Principal • Karaokê Pulse</p>
              </div>
            </div>
          )}

          {/* Tab Content 3: PORTUGUESE COMPREHENSIVE PROFILE TAB */}
          {clientSubTab === "profile" && (
            <div className="space-y-6">
              <div className="text-center py-6 glass-card rounded-2xl relative overflow-hidden">
                <div className="w-20 h-20 bg-gradient-to-tr from-[#ffb3b5] to-[#d1bcff] rounded-full mx-auto flex items-center justify-center font-bold text-headline-sm text-on-primary shrink-0 relative mb-3">
                  {userName ? userName.slice(0, 2).toUpperCase() : "KP"}
                  <span className="absolute bottom-0 right-0 w-4 h-4 rounded-full bg-secondary border-2 border-background"></span>
                </div>
                <h3 className="font-headline text-headline-sm font-bold text-on-surface">{userName || "Cantor Convidado"}</h3>
                <p className="text-xs text-on-surface-variant font-mono uppercase tracking-widest mt-1">Nível Amador • 0 canções gravadas</p>
              </div>

              <div className="glass-card rounded-2xl p-5 space-y-4">
                <h4 className="font-headline text-sm font-semibold border-b border-white/5 pb-2">Suas Configurações Rápidas</h4>
                
                <div className="space-y-3 Divide-y divide-white/5">
                  <div className="flex justify-between items-center py-1">
                    <div>
                      <p className="text-xs font-semibold">Tonalidade Preferida</p>
                      <p className="text-[10px] text-on-surface-variant">Configure sua transposição de tom vocal default</p>
                    </div>
                    <span className="text-xs bg-surface-container px-2 py-1 rounded font-mono font-bold text-primary">Natural</span>
                  </div>

                  <div className="flex justify-between items-center pt-2">
                    <div>
                      <p className="text-xs font-semibold">Idioma da Letra</p>
                      <p className="text-[10px] text-on-surface-variant">Preferência de busca para catalogação</p>
                    </div>
                    <span className="text-xs bg-surface-container px-2 py-1 rounded font-mono font-bold text-primary">PT-BR / EN</span>
                  </div>
                </div>
              </div>

              {userQueueItem ? (
                <div className="p-4 bg-tertiary/10 border border-tertiary/30 rounded-xl relative overflow-hidden">
                  <div className="flex items-center gap-3">
                    <Music className="w-5 h-5 text-tertiary shrink-0 animate-bounce" />
                    <div>
                      <p className="text-xs font-semibold text-tertiary">Seu pedido está agendado!</p>
                      <p className="text-[11px] font-body text-on-surface-variant truncate max-w-[260px]">
                        &quot;{userQueueItem.songTitle}&quot; em posição #{userQueueItem.position}
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="p-4 bg-surface-container-low border border-dashed border-white/10 rounded-xl text-center">
                  <p className="text-xs text-on-surface-variant">Você ainda não agendou nenhuma música nesta sessão.</p>
                  <button 
                    onClick={() => setClientSubTab("songs")}
                    className="text-primary text-xs font-semibold underline mt-2 uppercase tracking-wide block mx-auto"
                  >
                    Pedir uma música agora!
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Bottom Docked Simulated Navigation (Matching aesthetic details) */}
          <nav className="fixed bottom-0 left-0 w-full z-40 bg-surface/90 backdrop-blur-2xl border-t border-white/15 shadow-[0_-8px_32px_rgba(0,0,0,0.5)] rounded-t-xl py-3 flex justify-around items-center">
            <button 
              onClick={() => {
                setClientSubTab("songs");
              }}
              className={`flex flex-col items-center justify-center transition-all ${
                clientSubTab === "songs" 
                  ? "text-primary drop-shadow-[0_0_8px_rgba(255,179,181,0.6)] scale-105" 
                  : "text-on-surface-variant hover:text-tertiary"
              }`}
            >
              <Search className="w-[18px] h-[18px] stroke-[2.5]" />
              <span className="font-mono text-[9px] font-bold tracking-wider mt-1 block">Songs</span>
            </button>
            <button 
              onClick={() => {
                setClientSubTab("queue");
              }}
              className={`flex flex-col items-center justify-center transition-all relative ${
                clientSubTab === "queue" 
                  ? "text-primary drop-shadow-[0_0_8px_rgba(255,179,181,0.6)] scale-105" 
                  : "text-on-surface-variant hover:text-tertiary"
              }`}
            >
              <Layers className="w-[18px] h-[18px] stroke-[2.5]" />
              <span className="font-mono text-[9px] font-bold tracking-wider mt-1 block">My Queue</span>
              {queue.length > 0 && (
                <span className="absolute -top-1 -right-2 bg-primary text-on-primary w-[14px] h-[14px] rounded-full text-[9px] font-bold flex items-center justify-center">
                  {queue.length}
                </span>
              )}
            </button>
            <button 
              onClick={() => {
                setClientSubTab("profile");
              }}
              className={`flex flex-col items-center justify-center transition-all ${
                clientSubTab === "profile" 
                  ? "text-primary drop-shadow-[0_0_8px_rgba(255,179,181,0.6)] scale-105" 
                  : "text-on-surface-variant hover:text-tertiary"
              }`}
            >
              <User className="w-[18px] h-[18px] stroke-[2.5]" />
              <span className="font-mono text-[9px] font-bold tracking-wider mt-1 block">Profile</span>
            </button>
          </nav>

        </div>
      )}

      {/* ==================== SCREEN B: HOST COMMAND VIEW ==================== */}
      {activeTab === "host" && (
        <div className="flex h-[calc(100vh-45px)] overflow-hidden transition-opacity duration-300">
          
          {/* Host Sidebar Control (Navigation column, exactly matching) */}
          <aside className="w-64 bg-surface-container-lowest border-r border-outline-variant/30 flex flex-col py-6 select-none shrink-0 hidden md:flex">
            <div className="px-6 mb-8 shrink-0">
              <h2 className="font-headline text-headline-sm font-extrabold text-tertiary uppercase tracking-wider mb-0.5">
                HOST COMMAND
              </h2>
              <p className="text-on-surface-variant font-mono text-[10px] tracking-wider uppercase">Main Lounge Dashboard</p>
            </div>

            <nav className="flex-1 space-y-1">
              <button 
                onClick={() => setHostTab("queue")}
                className={`w-full text-left py-3 px-6 flex items-center gap-4 transition-all ${
                  hostTab === "queue"
                    ? "bg-primary/10 text-primary border-r-4 border-primary font-bold"
                    : "text-on-surface-variant hover:bg-surface-variant/20 hover:text-primary font-semibold"
                }`}
              >
                <Layers className="w-4 h-4 shrink-0" />
                <span className="text-sm">Live Queue</span>
              </button>
              
              <button 
                onClick={() => setHostTab("library")}
                className={`w-full text-left py-3 px-6 flex items-center gap-4 transition-all ${
                  hostTab === "library"
                    ? "bg-primary/10 text-primary border-r-4 border-primary font-bold"
                    : "text-on-surface-variant hover:bg-surface-variant/20 hover:text-primary font-semibold"
                }`}
              >
                <Search className="w-4 h-4 shrink-0" />
                <span className="text-sm">Library</span>
              </button>

              <button 
                onClick={() => playSynthesizedSound("magic")}
                className="w-full text-left text-on-surface-variant py-3 px-6 flex items-center gap-4 hover:bg-surface-variant/20 transition-all hover:text-primary"
              >
                <Sparkle className="w-4 h-4 shrink-0" />
                <span className="font-semibold text-sm">Soundboard FX</span>
              </button>

              <button 
                onClick={() => alert("Room Controls are reactive on the right-hand panel!")}
                className="w-full text-left text-on-surface-variant py-3 px-6 flex items-center gap-4 hover:bg-surface-variant/20 transition-all hover:text-primary"
              >
                <Sliders className="w-4 h-4 shrink-0" />
                <span className="font-semibold text-sm">Room Controls</span>
              </button>

              <button 
                onClick={() => alert("History is loaded and preserved on the bottom right panel!")}
                className="w-full text-left text-on-surface-variant py-3 px-6 flex items-center gap-4 hover:bg-surface-variant/20 transition-all hover:text-primary"
              >
                <HistoryIcon className="w-4 h-4 shrink-0" />
                <span className="font-semibold text-sm">History Log</span>
              </button>
            </nav>

            {/* Network Status Widget */}
            <div className="px-6 mt-auto shrink-0">
              <div className="glass-card rounded-xl p-4 border-primary/25">
                <p className="text-on-surface-variant text-[9px] font-mono tracking-widest mb-1.5 uppercase">NETWORK STATUS</p>
                <div className="flex items-center gap-2">
                  <Wifi className="w-4 h-4 text-secondary" />
                  <span className="text-secondary text-xs font-black uppercase font-mono tracking-tight">Stable (12ms)</span>
                </div>
              </div>
            </div>
          </aside>

          {/* Main Host Area (Desktop viewport space) */}
          <main className="flex-1 flex flex-col overflow-hidden min-w-0">
            
            {/* Top Bar inside host */}
            <header className="bg-surface-container-low/60 border-b border-white/5 h-16 shrink-0 flex items-center justify-between px-6">
              <div className="flex items-center gap-2">
                <span className="font-headline text-lg font-bold tracking-tight text-white uppercase">KARAOKE HOST PANEL</span>
                <span className="text-[10px] bg-primary/10 text-primary border border-primary/30 py-0.5 px-2.5 rounded-full font-bold font-mono uppercase animate-pulse">
                  ● Main Lounge Live
                </span>
              </div>
              <div className="flex items-center gap-4">
                <button className="text-on-surface-variant hover:text-primary hover:scale-105 transition-all">
                  <Bell className="w-4 h-4" />
                </button>
                <button 
                  onClick={() => alert("Mic Mixer calibration is automatically set via Room Controls inside the right panel.")}
                  className="text-on-surface-variant hover:text-primary shrink-0 relative flex items-center gap-1 text-xs"
                >
                  <em className="font-mono not-italic bg-surface-container-high px-2 py-0.5 rounded text-primary border border-primary/20">Mic Input #1</em>
                </button>
              </div>
            </header>

            {/* Main Interactive Host Dashboard View */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">

              {/* SECTION 1: NOW PLAYING HERO CONTAINER (Matching style layout) */}
              <section className="relative overflow-hidden rounded-2xl h-64 glass-card border-tertiary/30">
                {/* Visual Stage Simulating background */}
                <div className="absolute inset-0 opacity-20 mix-blend-overlay">
                  <img 
                    alt="Karaoke Stage" 
                    className="w-full h-full object-cover shrink-0"
                    src="https://lh3.googleusercontent.com/aida-public/AB6AXuBMNRKrsYRqWNvG1oc4BjWc07-0-7n-tuSQjvmjdIKpZWt_O1ddIO0cI6_HpfpWF9zI3nYBEmoWOICbCAuP6OAZZQDpSv1yA6YDhzhQ9vZZ8iMiMnw5duiCIZQGz3_f6aTfQmCHNpn_jtewKjeoYqX0XQMfQWOVeaUE3PHXxW96WshHp0J8NtW7ohemWvCKsRY0C37nv9RMbTkbt15WEZ7gAc0d9ATi_8OoQeLesyiTQ71WZo4WGOb_OJ0MrL99URIOz11VF7BgnKM" 
                    onError={(e)=>{
                      e.currentTarget.src = "https://picsum.photos/seed/stage/800/250";
                    }}
                  />
                </div>
                {/* Ambient dynamic gradient colors according to preset */}
                <div className="absolute inset-0 bg-gradient-to-r from-[#0A0A0A] via-[#0A0A0A]/85 to-transparent"></div>

                <div className="relative h-full flex flex-col justify-center px-10 gap-3.5 z-10">
                  <div className="flex items-center gap-2">
                    <span className="bg-primary text-on-primary px-3 py-1 rounded font-mono text-[9px] uppercase tracking-widest font-black leading-none">
                      Agora Cantando
                    </span>
                    <span className="text-secondary font-mono text-[9px] uppercase tracking-widest leading-none font-bold">
                      Live Session #402
                    </span>
                  </div>

                  <div>
                    <h2 className="font-headline text-3xl font-extrabold text-white truncate max-w-lg drop-shadow-[0_0_15px_rgba(242,125,38,0.5)]">
                      {queue.length > 0 ? queue[0].songTitle : "Nenhuma música agendada"}
                    </h2>
                    <p className="text-tertiary text-lg font-medium">
                      Singer:{" "}
                      <span className="text-white font-bold">
                        {queue.length > 0 ? queue[0].singer : "Estande Vago"}
                      </span>
                    </p>
                  </div>

                  {/* Seek Bar progress timeline */}
                  <div className="w-full max-w-xl">
                    <div className="flex justify-between text-[11px] font-mono text-on-surface-variant font-bold mb-1.5 uppercase">
                      <span>{formatTime(nowPlayingTime)}</span>
                      <span>{formatTime(totalDuration)}</span>
                    </div>

                    <div className="h-2 w-full bg-surface-container rounded-full overflow-hidden border border-white/5 relative">
                      <div 
                        className="h-full bg-gradient-to-r from-tertiary to-primary transition-all duration-300 relative"
                        style={{ width: `${nowPlayingProgress}%` }}
                      >
                        <div className="absolute right-0 top-0 bottom-0 w-1 bg-white shadow-[0_0_10px_#fff]"></div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Back Player action playback circle controls */}
                <div className="absolute right-10 top-1/2 -translate-y-1/2 hidden lg:flex items-center gap-4 z-20 select-none">
                  <button 
                    onClick={() => {
                      setNowPlayingTime(prev => Math.max(0, prev - 10));
                    }}
                    title="Rewind 10s"
                    className="w-12 h-12 rounded-full bg-surface-container border border-white/10 flex items-center justify-center text-primary hover:bg-primary hover:text-on-primary transition-all cursor-pointer"
                  >
                    <RotateCcw className="w-5 h-5" />
                  </button>

                  <button 
                    onClick={() => setIsPlaying(!isPlaying)}
                    title={isPlaying ? "Pause Progress" : "Play Progress"}
                    className="w-14 h-14 rounded-full bg-primary text-on-primary flex items-center justify-center shadow-lg shadow-primary/20 active:scale-95 transition-all cursor-pointer"
                  >
                    {isPlaying ? <Pause className="w-6 h-6 fill-on-primary" /> : <Play className="w-6 h-6 fill-on-primary ml-1" />}
                  </button>

                  <button 
                    onClick={() => {
                      advanceQueue();
                    }}
                    title="Skip Performer"
                    className="w-12 h-12 rounded-full bg-surface-container border border-white/10 flex items-center justify-center text-primary hover:bg-primary hover:text-on-primary transition-all cursor-pointer"
                  >
                    <SkipForward className="w-5 h-5" />
                  </button>
                </div>
              </section>

              {/* SECTION 2: HOST DESKTOP LIVE QUEUE & CONTROLS GRID */}
              <div className="grid grid-cols-12 gap-6 min-h-0">
                
                {hostTab === "queue" ? (
                  /* Live Queue list controls (8 cols) */
                  <div className="col-span-12 lg:col-span-8 flex flex-col min-h-0 animate-fade-in text-white">
                    <div className="flex justify-between items-end mb-4 shrink-0">
                      <h3 className="font-headline text-lg font-bold text-on-surface">
                        Queue Integrada <span className="text-on-surface-variant font-normal text-sm">({queue.length} cantores agendados)</span>
                      </h3>
                      <div className="flex gap-2">
                        <button 
                          onClick={handleShuffleQueue}
                          className="px-3.5 py-1.5 rounded-lg glass-card text-on-surface text-xs font-semibold flex items-center gap-2 hover:bg-white/10 transition-all cursor-pointer"
                        >
                          <Shuffle className="w-3.5 h-3.5 text-primary" /> Aleatorizar (Shuffle)
                        </button>
                        <button 
                          onClick={() => {
                            setHostNewRequestOpen(true);
                          }}
                          className="px-3.5 py-1.5 rounded-lg bg-tertiary text-on-tertiary text-xs font-bold flex items-center gap-1.5 hover:opacity-90 transition-all cursor-pointer shadow-sm"
                        >
                          <ListPlus className="w-3.5 h-3.5" /> Adicionar à Fila
                        </button>
                      </div>
                    </div>

                    {/* Grid Table content */}
                    <div className="flex-1 overflow-x-auto glass-card rounded-2xl border-white/5 backdrop-blur-md">
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="font-mono text-[10px] tracking-widest text-[#e6bcbd] border-b border-white/10 bg-surface-container">
                            <th className="py-4.5 px-6 font-bold uppercase">Singer</th>
                            <th className="py-4.5 px-6 font-bold uppercase">Song Title</th>
                            <th className="py-4.5 px-6 font-bold uppercase">Requested</th>
                            <th className="py-4.5 px-6 font-bold uppercase text-right">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                          {queue.map((item, index) => (
                            <tr key={item.id} className="hover:bg-white/5 transition-colors group">
                              
                              {/* Col 1: Name Badge */}
                              <td className="py-4.5 px-6">
                                <div className="flex items-center gap-3">
                                  {item.isUser ? (
                                    <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-[#be0036] to-[#ffb3b5] flex items-center justify-center text-[10px] font-black text-white shadow-[0_0_8px_#ffb3b5]">
                                      VC
                                    </div>
                                  ) : (
                                    <div className="w-8 h-8 rounded-full bg-surface-container-highest border border-white/10 flex items-center justify-center text-[10px] font-bold text-on-surface">
                                      {item.singer.slice(0, 2).toUpperCase()}
                                    </div>
                                  )}
                                  <span className="font-semibold text-sm text-on-surface">{item.singer}</span>
                                </div>
                              </td>

                              {/* Col 2: Track Details */}
                              <td className="py-4.5 px-6">
                                <div>
                                  <p className="font-bold text-sm text-primary">{item.songTitle}</p>
                                  <p className="text-xs text-on-surface-variant font-medium">{item.artist}</p>
                                </div>
                              </td>

                              {/* Col 3: Time requested */}
                              <td className="py-4.5 px-6 text-on-surface-variant text-xs font-mono">
                                {item.timeRequested}
                              </td>

                              {/* Col 4: Row actions */}
                              <td className="py-4.5 px-6">
                                <div className="flex justify-end gap-1.5 opacity-60 group-hover:opacity-100 transition-opacity">
                                  <button
                                    onClick={() => handleMoveUp(item.id)}
                                    disabled={index === 0 || index === 1}
                                    title="Subir na Fila (Aumentar prioridade)"
                                    className={`p-2 rounded-lg bg-surface-container border border-white/10 flex items-center justify-center text-secondary transition-all ${
                                      index <= 1 ? "opacity-30 cursor-not-allowed" : "hover:bg-secondary/25"
                                    }`}
                                  >
                                    <ArrowUp className="w-3.5 h-3.5" />
                                  </button>
                                  <button
                                    onClick={() => handleSkipToThis(item.id)}
                                    disabled={index === 0}
                                    title="Pular cantor (Colocar para cantar agora)"
                                    className={`p-2 rounded-lg bg-surface-container border border-white/10 flex items-center justify-center text-tertiary transition-all ${
                                      index === 0 ? "opacity-30 cursor-not-allowed" : "hover:bg-tertiary/25"
                                    }`}
                                  >
                                    <Mic className="w-3.5 h-3.5" />
                                  </button>
                                  <button
                                    onClick={() => handleCancelRequest(item.id)}
                                    title="Remover cantor da fila"
                                    className="p-2 rounded-lg bg-surface-container border border-white/10 flex items-center justify-center text-error hover:bg-error/25 transition-all"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </td>

                            </tr>
                          ))}
                          {queue.length === 0 && (
                            <tr>
                              <td colSpan={4} className="py-8 text-center text-xs text-on-surface-variant italic">
                                Sem cantores na fila neste momento. Utilize &quot;Adicionar à Fila&quot; ou conecte na visualização do aplicativo para solicitar músicas!
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                ) : (
                  /* Dynamic Karaoke Library & Song Catalog (8 cols) */
                  <div className="col-span-12 lg:col-span-8 flex flex-col min-h-0 animate-fade-in text-white">
                    
                    {/* Library Header */}
                    <div className="flex flex-col sm:flex-row justify-between sm:items-end gap-3 mb-4 shrink-0">
                      <div>
                        <h3 className="font-headline text-lg font-bold text-on-surface uppercase tracking-wide">
                          Catálogo de Músicas da Biblioteca
                        </h3>
                        <p className="text-on-surface-variant text-xs font-mono font-bold mt-0.5 uppercase tracking-wider">
                          {librarySongs.length} faixas disponíveis • {librarySongs.filter(s => s.timesRequested > 0).length} cantadas nesta sessão
                        </p>
                      </div>

                      <div className="flex gap-2">
                        <button 
                          onClick={() => setShowAddLibForm(!showAddLibForm)}
                          className={`px-3.5 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-sm ${
                            showAddLibForm 
                              ? "bg-surface-container-high border border-white/25 text-white" 
                              : "bg-primary text-on-primary hover:opacity-90"
                          }`}
                        >
                          <ListPlus className="w-3.5 h-3.5" /> 
                          {showAddLibForm ? "Fechar Form" : "Adicionar Nova Música"}
                        </button>
                      </div>
                    </div>

                    {/* Expandable form to register custom track */}
                    {showAddLibForm && (
                      <form 
                        onSubmit={handleAddSongToLibrary}
                        className="mb-5 p-5 rounded-2xl bg-surface-container border border-primary/20 space-y-4 animate-fade-in"
                      >
                        <h4 className="text-xs font-bold font-mono tracking-wider text-primary uppercase">
                          Registrar Nova Música no Karaokê
                        </h4>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div className="space-y-1">
                            <label className="text-[10px] font-mono font-bold text-on-surface-variant uppercase">Título da Música</label>
                            <input 
                              type="text"
                              value={newLibTitle}
                              onChange={(e) => setNewLibTitle(e.target.value)}
                              placeholder="ex: Shallow"
                              className="w-full bg-surface-container-low border border-white/10 rounded-lg p-2 text-xs text-white outline-none focus:border-primary"
                              required
                            />
                          </div>

                          <div className="space-y-1">
                            <label className="text-[10px] font-mono font-bold text-on-surface-variant uppercase">Cantor / Banda / Artista</label>
                            <input 
                              type="text"
                              value={newLibArtist}
                              onChange={(e) => setNewLibArtist(e.target.value)}
                              placeholder="ex: Lady Gaga & Bradley Cooper"
                              className="w-full bg-surface-container-low border border-white/10 rounded-lg p-2 text-xs text-white outline-none focus:border-primary"
                              required
                            />
                          </div>

                          <div className="space-y-1">
                            <label className="text-[10px] font-mono font-bold text-on-surface-variant uppercase">Gênero / Categoria</label>
                            <select
                              value={newLibCategory}
                              onChange={(e) => setNewLibCategory(e.target.value)}
                              className="w-full bg-surface-container-low border border-white/10 rounded-lg p-2 text-xs text-white outline-none focus:border-primary cursor-pointer text-on-surface"
                            >
                              <option value="Pop/Hits" className="bg-surface-container-lowest">Pop / Hits</option>
                              <option value="Rock/Classic" className="bg-surface-container-lowest">Rock / Clássicos</option>
                              <option value="Nacionais" className="bg-surface-container-lowest">Nacionais (Brasil)</option>
                              <option value="Sugestões" className="bg-surface-container-lowest">Sugestões / Outras</option>
                            </select>
                          </div>
                        </div>

                        <div className="flex justify-end gap-2 pt-1">
                          <button
                            type="button"
                            onClick={() => setShowAddLibForm(false)}
                            className="px-3.5 py-1.5 rounded-lg border border-white/10 text-xs text-on-surface-variant hover:text-white transition-all cursor-pointer"
                          >
                            Cancelar
                          </button>
                          <button
                            type="submit"
                            className="px-4 py-1.5 rounded-lg bg-primary text-on-primary font-bold text-xs hover:opacity-90 transition-all cursor-pointer"
                          >
                            Salvar na Biblioteca
                          </button>
                        </div>
                      </form>
                    )}

                    {/* Inline queue assignment popover/banner */}
                    {selectedLibSongForQueue && (
                      <form
                        onSubmit={handleAddLibrarySongToQueue}
                        className="mb-5 p-4 rounded-2xl bg-primary/10 border-2 border-primary/30 flex flex-col md:flex-row md:items-center justify-between gap-4 animate-fade-in"
                      >
                        <div className="min-w-0">
                          <p className="text-xs font-mono font-bold text-primary uppercase tracking-wider mb-1">
                            Agendar cantor na Live Queue:
                          </p>
                          <p className="text-sm font-bold text-white truncate">
                            &quot;{selectedLibSongForQueue.title}&quot; — <span className="text-secondary font-medium">{selectedLibSongForQueue.artist}</span>
                          </p>
                        </div>

                        <div className="flex items-center gap-2">
                          <input 
                            type="text"
                            value={queueSingerName}
                            onChange={(e) => setQueueSingerName(e.target.value)}
                            placeholder="Quem vai cantar?"
                            className="bg-surface-container hover:border-primary/50 border border-primary/40 rounded-lg py-2 px-3 text-xs text-white outline-none focus:border-primary w-48 font-semibold"
                            autoFocus
                            required
                          />
                          <button
                            type="submit"
                            title="Agendar cantor na fila"
                            className="p-2.5 rounded-lg bg-primary text-on-primary flex items-center justify-center hover:opacity-95 transition-all select-none cursor-pointer"
                          >
                            <Check className="w-4 h-4 stroke-[3]" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setSelectedLibSongForQueue(null)}
                            title="Cancelar agendamento"
                            className="p-2.5 rounded-lg bg-surface-container border border-white/10 text-on-surface-variant hover:text-white transition-all cursor-pointer"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      </form>
                    )}

                    {/* Filter bar controls */}
                    <div className="mb-4 grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
                      {/* Search */}
                      <div className="md:col-span-5 relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant w-4 h-4" />
                        <input 
                          type="text"
                          value={hostLibrarySearch}
                          onChange={(e) => setHostLibrarySearch(e.target.value)}
                          placeholder="Buscar por música ou artista..."
                          className="w-full bg-surface-container border border-white/10 rounded-xl py-2 pl-9 pr-3 text-xs text-white outline-none focus:border-primary"
                        />
                        {hostLibrarySearch && (
                          <button
                            onClick={() => setHostLibrarySearch("")}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant hover:text-white"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>

                      {/* Categories tab toggle list */}
                      <div className="md:col-span-7 flex gap-1.5 overflow-x-auto py-0.5 custom-scrollbar select-none">
                        {["Todas", "Pop/Hits", "Rock/Classic", "Nacionais", "Sugestões"].map((cat) => (
                          <button
                            key={cat}
                            onClick={() => setHostLibraryCategory(cat)}
                            className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider border transition-all shrink-0 cursor-pointer ${
                              hostLibraryCategory === cat
                                ? "bg-primary/20 border-primary text-primary"
                                : "bg-surface-container border-white/5 text-on-surface-variant hover:border-white/10 hover:text-white"
                            }`}
                          >
                            {cat}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* List Table Content */}
                    <div className="flex-1 overflow-x-auto glass-card rounded-2xl border-white/5 backdrop-blur-md">
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="font-mono text-[10px] tracking-widest text-[#e6bcbd] border-b border-white/10 bg-surface-container">
                            <th className="py-4.5 px-6 font-bold uppercase">Título / Banda / Artista</th>
                            <th className="py-4.5 px-6 font-bold uppercase">Categoria / Gênero</th>
                            <th className="py-4.5 px-6 font-bold uppercase text-center">Hits</th>
                            <th className="py-4.5 px-6 font-bold uppercase text-right">Ação</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                          {librarySongs
                            .filter(s => {
                              const matchesSearch = s.title.toLowerCase().includes(hostLibrarySearch.toLowerCase()) || 
                                                    s.artist.toLowerCase().includes(hostLibrarySearch.toLowerCase());
                              const matchesCategory = hostLibraryCategory === "Todas" || s.category === hostLibraryCategory;
                              return matchesSearch && matchesCategory;
                            })
                            .map((song) => (
                              <tr key={song.id} className="hover:bg-white/5 transition-colors group">
                                <td className="py-4 px-6">
                                  <div>
                                    <p className="font-bold text-sm text-white group-hover:text-primary transition-colors">{song.title}</p>
                                    <p className="text-xs text-on-surface-variant font-medium mt-0.5">{song.artist}</p>
                                  </div>
                                </td>

                                <td className="py-4 px-6 font-mono text-[11px] font-bold text-tertiary">
                                  <span className="bg-surface-container px-2 py-0.5 rounded border border-white/5 uppercase">
                                    {song.category}
                                  </span>
                                </td>

                                <td className="py-4 px-6 text-center">
                                  <span className="font-mono text-xs font-semibold text-secondary">
                                    🔥 {song.timesRequested} pedido(s)
                                  </span>
                                </td>

                                <td className="py-4 px-6 text-right">
                                  <button
                                    onClick={() => {
                                      setSelectedLibSongForQueue({ title: song.title, artist: song.artist });
                                      setQueueSingerName("");
                                    }}
                                    className="px-3 py-1.5 rounded-lg bg-surface-container border border-white/10 text-xs font-semibold hover:bg-primary hover:text-on-primary hover:border-primary transition-all inline-flex items-center gap-1.5 cursor-pointer"
                                  >
                                    <Mic className="w-3.5 h-3.5" /> 
                                    <span>Agendar</span>
                                  </button>
                                </td>
                              </tr>
                            ))
                          }

                          {librarySongs.filter(s => {
                            const matchesSearch = s.title.toLowerCase().includes(hostLibrarySearch.toLowerCase()) || 
                                                  s.artist.toLowerCase().includes(hostLibrarySearch.toLowerCase());
                            const matchesCategory = hostLibraryCategory === "Todas" || s.category === hostLibraryCategory;
                            return matchesSearch && matchesCategory;
                          }).length === 0 && (
                            <tr>
                              <td colSpan={4} className="py-12 text-center text-xs text-on-surface-variant italic">
                                Nenhuma música encontrada com estes filtros. Adicione acima para registrá-la na biblioteca!
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* Sidebar Controls Widgets Panel (4 cols) */}
                <div className="col-span-12 lg:col-span-4 space-y-6">
                  
                  {/* Widget 1: Room Mixer Volume controls */}
                  <div className="glass-card rounded-2xl p-6 border-white/10 flex flex-col justify-between">
                    <div>
                      <h4 className="font-headline text-sm font-semibold text-white uppercase tracking-wider mb-5 flex items-center gap-1.5">
                        <Sliders className="w-4 h-4 text-primary" /> Calibration Audio
                      </h4>

                      <div className="space-y-5">
                        {/* Control 1: Master volume slider */}
                        <div className="space-y-1.5">
                          <div className="flex justify-between items-center text-xs">
                            <span className="font-mono text-[#e6bcbd] uppercase tracking-wider">Master Out Volume:</span>
                            <span className="text-secondary font-black font-mono">{masterVolume}%</span>
                          </div>
                          <div className="relative flex items-center">
                            <input 
                              type="range"
                              min="0"
                              max="100"
                              value={masterVolume}
                              onChange={(e) => setMasterVolume(Number(e.target.value))}
                              className="w-full accent-secondary h-1.5 bg-surface-container-highest rounded-lg cursor-pointer appearance-none shrink-0"
                            />
                          </div>
                        </div>

                        {/* Control 2: Mic Gain mix slider */}
                        <div className="space-y-1.5">
                          <div className="flex justify-between items-center text-xs">
                            <span className="font-mono text-[#e6bcbd] uppercase tracking-wider">Transducer Gain:</span>
                            <span className="text-primary font-black font-mono">{micGain}%</span>
                          </div>
                          <div className="relative flex items-center">
                            <input 
                              type="range"
                              min="0"
                              max="100"
                              value={micGain}
                              onChange={(e) => setMicGain(Number(e.target.value))}
                              className="w-full accent-primary h-1.5 bg-surface-container-highest rounded-lg cursor-pointer appearance-none shrink-0"
                            />
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Lighting Preset selection (Alters entire UI vibe) */}
                    <div className="pt-6 border-t border-white/5 mt-5">
                      <span className="font-mono text-[9px] font-bold tracking-widest text-[#e6bcbd] uppercase block mb-3">Lighting Presets:</span>
                      <div className="grid grid-cols-2 gap-2">
                        {(["pulse", "chill", "electric", "solo"] as const).map((preset) => (
                          <button
                            key={preset}
                            onClick={() => setLightingPreset(preset)}
                            className={`py-2 rounded-xl text-[10px] font-bold uppercase transition-all flex items-center justify-center gap-1.5 tracking-wider border ${
                              lightingPreset === preset
                                ? "bg-primary/10 border-primary text-primary shadow-sm"
                                : "bg-surface-container-low border-white/10 text-on-surface-variant hover:border-tertiary"
                            }`}
                          >
                            {preset === "pulse" && <span className="w-1.5 h-1.5 bg-primary rounded-full animate-ping"></span>}
                            {preset}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Widget 2: Synced Soundboard triggers (Includes visual and synth feedback!) */}
                  <div className="glass-card rounded-2xl p-6 border-white/10 relative overflow-hidden">
                    <h4 className="font-headline text-sm font-semibold text-white uppercase tracking-wider mb-5 flex items-center gap-1.5">
                      <Sparkles className="w-4 h-4 text-tertiary" /> Soundboard FX
                    </h4>

                    {triggeredEffect && (
                      <div className="absolute top-2 right-4 text-[10px] font-mono font-bold text-secondary bg-secondary/15 border border-secondary/35 px-1.5 py-0.2 rounded uppercase animate-bounce uppercase">
                        🔈 {triggeredEffect} active
                      </div>
                    )}

                    <div className="grid grid-cols-3 gap-2.5">
                      {[
                        { label: "APPLAUSE", type: "applause" },
                        { label: "AIRHORN", type: "airhorn" },
                        { label: "HYPE", type: "hype" },
                        { label: "MAGIC", type: "magic" },
                        { label: "LAUGH", type: "laugh" },
                        { label: "DRUMROLL", type: "drumroll" }
                      ].map((item) => (
                        <button
                          key={item.type}
                          onClick={() => playSynthesizedSound(item.type)}
                          className={`aspect-square rounded-xl glass-card flex flex-col items-center justify-center gap-1.5 transition-all outline-none relative group hover:scale-[1.03] active:scale-95 cursor-pointer ${
                            triggeredEffect === item.type 
                              ? "bg-tertiary border-tertiary shadow-[0_0_15px_#d1bcff] text-on-tertiary" 
                              : "border-white/5 hover:bg-white/10"
                          }`}
                        >
                          <span className="text-xs group-hover:scale-110 transition-transform">🔊</span>
                          <span className={`text-[9px] font-mono font-black font-extrabold tracking-tight ${
                            triggeredEffect === item.type ? "text-on-tertiary" : "text-on-surface-variant"
                          }`}>
                            {item.label}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Widget 3: History of sung songs (exactly matching layout) */}
                  <div className="glass-card rounded-2xl p-6 border-white/10 flex-1">
                    <h4 className="font-headline text-sm font-semibold text-white uppercase tracking-wider mb-4 flex items-center gap-1.5">
                      <HistoryIcon className="w-4 h-4 text-secondary animate-spin-slow" /> Recent Sung Log
                    </h4>

                    <div className="space-y-3.5 divide-y divide-white/5">
                      {history.map((hist, idx) => (
                        <div key={idx} className={`flex items-center gap-3.5 ${idx > 0 ? "pt-3.5" : ""}`}>
                          <div className="w-9 h-9 rounded-lg bg-surface-container flex items-center justify-center shrink-0 border border-white/5 text-secondary">
                            <Clock className="w-4 h-4" />
                          </div>
                          <div className="overflow-hidden min-w-0">
                            <p className="text-xs font-semibold truncate leading-none text-[#ffdada]">{hist.title}</p>
                            <p className="text-[10px] text-on-surface-variant truncate mt-1">
                              {hist.artist} • Sung by <strong className="text-secondary">{hist.singer}</strong>
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                </div>

              </div>

            </div>

            {/* Float emergency action halt button for desktop command */}
            <button 
              id="btn-emergency-stop"
              onClick={handleHostEmergencyStop}
              className="fixed bottom-6 right-6 w-14 h-14 bg-error text-on-error rounded-full shadow-[0_0_30px_rgba(255,180,171,0.5)] flex items-center justify-center z-[90] hover:scale-110 active:scale-95 transition-all border-4 border-background group cursor-pointer"
            >
              <AlertOctagon className="w-6 h-6 group-hover:animate-pulse" />
            </button>

          </main>

        </div>
      )}

      {/* ==================== SCREEN MODAL C: AI SUGGESION DRAWER (Interactive Gemini AI helper) ==================== */}
      {showAiModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[9999] flex items-center justify-center p-4">
          <div className="max-w-md w-full glass-card bg-[#1d0b28] border-primary/30 rounded-2xl overflow-hidden p-6 relative">
            
            {/* Close button */}
            <button 
              onClick={() => {
                setShowAiModal(false);
                setAiPrompt("");
                setAiSuggestions([]);
              }}
              className="absolute top-4 right-4 p-1.5 rounded-full hover:bg-white/10 text-on-surface-variant transition-colors"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-2 mb-4">
              <span className="p-1 rounded bg-gradient-to-tr from-secondary to-tertiary">
                <Sparkles className="w-5 h-5 text-on-tertiary" />
              </span>
              <div>
                <h3 className="text-sm font-extrabold uppercase tracking-wide">Gemini Karaoke Suggest</h3>
                <p className="text-[10px] text-on-surface-variant uppercase">Interactive server-side recommendation</p>
              </div>
            </div>

            <form onSubmit={handleFetchAiSuggestions} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-[11px] font-mono text-on-surface-variant uppercase tracking-wider block">Qual o estilo ou o clima que você quer cantar hoje?</label>
                <input 
                  type="text"
                  value={aiPrompt}
                  onChange={(e) => setAiPrompt(e.target.value)}
                  placeholder="Ex: Pop chiclete dos anos 90, pagode romântico..."
                  className="w-full bg-[#180622] border-b border-[#5d3f40] focus:border-primary text-on-surface py-2 px-3 text-xs rounded transition-all outline-none"
                />
              </div>

              <button 
                type="submit"
                disabled={aiLoading}
                className="w-full py-2 px-4 bg-gradient-to-r from-tertiary to-primary text-on-primary font-bold text-xs rounded-full hover:opacity-90 active:scale-95 transition-all flex items-center justify-center gap-2 uppercase tracking-wide"
              >
                {aiLoading ? (
                  <>
                    <Activity className="w-3.5 h-3.5 animate-spin" /> Consultando Inteligência...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-3.5 h-3.5" /> Recomendar Músicas
                  </>
                )}
              </button>
            </form>

            {/* List of returned recommendations from model */}
            {aiSuggestions.length > 0 && (
              <div className="mt-5 space-y-2 animate-fade-in text-left">
                <span className="text-[10px] font-mono text-[#e6bcbd] uppercase tracking-wider block mb-2 font-bold">Suggestions provided by Gemini:</span>
                <div className="grid grid-cols-1 gap-2">
                  {aiSuggestions.map((song, idx) => (
                    <button
                      key={idx}
                      onClick={() => {
                        setSelectedSong({ title: song.title, artist: song.artist });
                        setSongSearch(`${song.title} — ${song.artist}`);
                        setShowAiModal(false);
                      }}
                      className="text-left w-full py-2 px-3.5 rounded-xl bg-surface-container-high border border-white/5 hover:border-primary font-medium hover:bg-white/5 transition-all text-xs flex justify-between items-center group"
                    >
                      <div className="min-w-0">
                        <p className="font-extrabold text-[#ffdada] truncate leading-tight group-hover:text-primary transition-colors">{song.title}</p>
                        <p className="text-[10px] text-on-surface-variant truncate mt-0.5">{song.artist}</p>
                      </div>
                      <span className="text-[10px] text-primary underline opacity-0 group-hover:opacity-100 transition-opacity uppercase font-bold text-[9px] tracking-wider">Selecionar</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="mt-4 text-[9px] text-on-surface-variant/60 leading-relaxed text-center font-mono">
              Recomendação baseada em IA e processamento com Gemini 3.5.
            </div>

          </div>
        </div>
      )}

      {/* ==================== SCREEN MODAL D: HOST MANUAL NEW REQUEST OVERLAY ==================== */}
      {hostNewRequestOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[9999] flex items-center justify-center p-4">
          <div className="max-w-md w-full glass-card bg-[#1d0b28] border-primary/30 rounded-2xl p-6 relative">
            
            <button 
              onClick={() => setHostNewRequestOpen(false)}
              className="absolute top-4 right-4 p-1.5 rounded-full hover:bg-white/10 text-on-surface-variant transition-colors"
            >
              <X className="w-4 h-4" />
            </button>

            <h3 className="font-headline text-headline-sm font-bold text-white uppercase tracking-wider mb-4 border-b border-white/5 pb-2">
              Adicionar Novo Cantor à Fila
            </h3>

            <form onSubmit={handleHostNewRequest} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-[11px] font-mono text-[#e6bcbd] uppercase tracking-wider block">Nome do Cantor (Singer)</label>
                <input 
                  type="text"
                  required
                  value={hostNewName}
                  onChange={(e) => setHostNewName(e.target.value)}
                  placeholder="Ex: Isabella Martins"
                  className="w-full bg-[#180622] border-b border-[#5d3f40] focus:border-primary text-on-surface py-2 px-3 text-xs rounded transition-all outline-none"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] font-mono text-[#e6bcbd] uppercase tracking-wider block">Nome da Música (Song Title)</label>
                <input 
                  type="text"
                  required
                  value={hostNewSong}
                  onChange={(e) => setHostNewSong(e.target.value)}
                  placeholder="Ex: Dancing Queen"
                  className="w-full bg-[#180622] border-b border-[#5d3f40] focus:border-primary text-on-surface py-2 px-3 text-xs rounded transition-all outline-none"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] font-mono text-[#e6bcbd] uppercase tracking-wider block">Artista ou Banda (Artist)</label>
                <input 
                  type="text"
                  value={hostNewArtist}
                  onChange={(e) => setHostNewArtist(e.target.value)}
                  placeholder="Ex: ABBA"
                  className="w-full bg-[#180622] border-b border-[#5d3f40] focus:border-primary text-on-surface py-2 px-3 text-xs rounded transition-all outline-none"
                />
              </div>

              <button 
                type="submit"
                className="w-full py-2.5 bg-gradient-to-r from-tertiary to-primary text-on-primary font-bold text-xs rounded-full hover:opacity-90 active:scale-95 transition-all uppercase tracking-wider"
              >
                Registrar na Fila
              </button>
            </form>

          </div>
        </div>
      )}

    </div>
  );
}
