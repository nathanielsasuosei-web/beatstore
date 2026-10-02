"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";

export type Track = {
  slug: string;
  title: string;
  coverImage: string | null;
  previewFile: string | null;
  bpm: number | null;
  musicalKey: string | null;
  genre: string | null;
  producer?: string;
};

type PlayerContextValue = {
  current: Track | null;
  queue: Track[];
  playing: boolean;
  progress: number;
  duration: number;
  volume: number;
  play: (track: Track, queue?: Track[]) => void;
  toggle: (track: Track, queue?: Track[]) => void;
  pause: () => void;
  resume: () => void;
  stop: () => void;
  next: () => void;
  previous: () => void;
  seek: (seconds: number) => void;
  setVolume: (value: number) => void;
  isCurrent: (slug: string) => boolean;
};

const PlayerContext = createContext<PlayerContextValue | null>(null);

export function PlayerProvider({ children }: { children: React.ReactNode }) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [current, setCurrent] = useState<Track | null>(null);
  const [queue, setQueue] = useState<Track[]>([]);
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolumeState] = useState(0.85);
  const countedRef = useRef<Set<string>>(new Set());

  // One <audio> element for the whole app so playback survives navigation.
  useEffect(() => {
    const audio = new Audio();
    audio.preload = "metadata";
    audio.volume = 0.85;
    audioRef.current = audio;

    const onTime = () => setProgress(audio.currentTime);
    const onMeta = () => setDuration(audio.duration || 0);
    const onEnd = () => setPlaying(false);
    const onPlay = () => setPlaying(true);
    const onPause = () => setPlaying(false);

    audio.addEventListener("timeupdate", onTime);
    audio.addEventListener("loadedmetadata", onMeta);
    audio.addEventListener("ended", onEnd);
    audio.addEventListener("play", onPlay);
    audio.addEventListener("pause", onPause);

    return () => {
      audio.pause();
      audio.removeEventListener("timeupdate", onTime);
      audio.removeEventListener("loadedmetadata", onMeta);
      audio.removeEventListener("ended", onEnd);
      audio.removeEventListener("play", onPlay);
      audio.removeEventListener("pause", onPause);
      audioRef.current = null;
    };
  }, []);

  const start = useCallback((track: Track) => {
    const audio = audioRef.current;
    if (!audio || !track.previewFile) return;
    if (audio.src !== new URL(track.previewFile, window.location.origin).href) {
      audio.src = track.previewFile;
      audio.load();
    }
    void audio.play().catch(() => setPlaying(false));

    // Count the play once per session per beat.
    if (!countedRef.current.has(track.slug)) {
      countedRef.current.add(track.slug);
      void fetch(`/api/beats/${track.slug}/play`, { method: "POST" }).catch(() => {});
    }
  }, []);

  const play = useCallback(
    (track: Track, nextQueue?: Track[]) => {
      setCurrent(track);
      if (nextQueue?.length) setQueue(nextQueue);
      setProgress(0);
      start(track);
    },
    [start]
  );

  const toggle = useCallback(
    (track: Track, nextQueue?: Track[]) => {
      if (current?.slug === track.slug && playing) {
        audioRef.current?.pause();
        return;
      }
      if (current?.slug === track.slug && !playing) {
        void audioRef.current?.play();
        return;
      }
      play(track, nextQueue);
    },
    [current, playing, play]
  );

  const pause = useCallback(() => audioRef.current?.pause(), []);

  const resume = useCallback(() => {
    if (current) void audioRef.current?.play();
  }, [current]);

  const stop = useCallback(() => {
    audioRef.current?.pause();
    if (audioRef.current) audioRef.current.currentTime = 0;
    setPlaying(false);
    setCurrent(null);
  }, []);

  const next = useCallback(() => {
    if (!current || queue.length === 0) return;
    const index = queue.findIndex((t) => t.slug === current.slug);
    const nextTrack = queue[(index + 1) % queue.length];
    if (nextTrack) play(nextTrack, queue);
  }, [current, queue, play]);

  const previous = useCallback(() => {
    if (!current || queue.length === 0) return;
    const index = queue.findIndex((t) => t.slug === current.slug);
    const prev = queue[(index - 1 + queue.length) % queue.length];
    if (prev) play(prev, queue);
  }, [current, queue, play]);

  const seek = useCallback((seconds: number) => {
    if (!audioRef.current) return;
    audioRef.current.currentTime = seconds;
    setProgress(seconds);
  }, []);

  const setVolume = useCallback((value: number) => {
    setVolumeState(value);
    if (audioRef.current) audioRef.current.volume = value;
  }, []);

  const value = useMemo<PlayerContextValue>(
    () => ({
      current,
      queue,
      playing,
      progress,
      duration,
      volume,
      play,
      toggle,
      pause,
      resume,
      stop,
      next,
      previous,
      seek,
      setVolume,
      isCurrent: (slug: string) => current?.slug === slug,
    }),
    [current, queue, playing, progress, duration, volume, play, toggle, pause, resume, stop, next, previous, seek, setVolume]
  );

  return <PlayerContext.Provider value={value}>{children}</PlayerContext.Provider>;
}

export function usePlayer() {
  const ctx = useContext(PlayerContext);
  if (!ctx) throw new Error("usePlayer must be used inside <PlayerProvider>");
  return ctx;
}

export function formatClock(seconds: number) {
  if (!Number.isFinite(seconds) || seconds < 0) return "0:00";
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}
