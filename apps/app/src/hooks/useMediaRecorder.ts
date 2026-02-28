"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import {
  getSupportedMimeType,
  getFileExtension,
  chunksToFile,
} from "@/lib/recorder-utils";

export type RecorderState = "idle" | "requesting" | "recording" | "stopped";

const MAX_RECORDING_SEC = 300;
const SAMPLE_RATE_HINT = 16000;
const FREQUENCY_BIN_COUNT = 128;
const DATA_INTERVAL_MS = 100;

export interface UseMediaRecorderReturn {
  recorderState: RecorderState;
  startRecording: () => Promise<void>;
  stopRecording: () => void;
  recordedFile: File | null;
  elapsedSec: number;
  frequencyData: Uint8Array;
  error: string | null;
}

export function useMediaRecorder(): UseMediaRecorderReturn {
  const [recorderState, setRecorderState] = useState<RecorderState>("idle");
  const [recordedFile, setRecordedFile] = useState<File | null>(null);
  const [elapsedSec, setElapsedSec] = useState(0);
  const [frequencyData, setFrequencyData] = useState<Uint8Array>(
    new Uint8Array(FREQUENCY_BIN_COUNT),
  );
  const [error, setError] = useState<string | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const autoStopRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const animFrameRef = useRef<number | null>(null);

  // Stable cleanup helper — stops all resources without changing state
  const cleanupResources = useCallback(() => {
    if (timerRef.current !== null) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    if (autoStopRef.current !== null) {
      clearTimeout(autoStopRef.current);
      autoStopRef.current = null;
    }
    if (animFrameRef.current !== null) {
      cancelAnimationFrame(animFrameRef.current);
      animFrameRef.current = null;
    }
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    audioContextRef.current?.close();
    audioContextRef.current = null;
    analyserRef.current = null;
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      cleanupResources();
    };
  }, [cleanupResources]);

  const startRecording = useCallback(async () => {
    if (recorderState !== "idle" && recorderState !== "stopped") return;

    setError(null);
    setRecordedFile(null);
    setElapsedSec(0);
    chunksRef.current = [];
    setRecorderState("requesting");

    let stream: MediaStream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({
        audio: { sampleRate: SAMPLE_RATE_HINT },
      });
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "마이크 권한을 허용해 주세요.",
      );
      setRecorderState("idle");
      return;
    }

    streamRef.current = stream;

    // Set up Web Audio analyser for waveform visualisation
    const audioContext = new AudioContext();
    // Resume context if suspended due to browser autoplay policy
    if (audioContext.state === "suspended") {
      await audioContext.resume();
    }
    audioContextRef.current = audioContext;
    const source = audioContext.createMediaStreamSource(stream);
    const analyser = audioContext.createAnalyser();
    analyser.fftSize = FREQUENCY_BIN_COUNT * 2;
    source.connect(analyser);
    analyserRef.current = analyser;

    const mimeType = getSupportedMimeType();
    const extension = getFileExtension(mimeType);

    const recorder = new MediaRecorder(stream, mimeType ? { mimeType } : {});
    mediaRecorderRef.current = recorder;

    recorder.ondataavailable = (event) => {
      if (event.data.size > 0) {
        chunksRef.current.push(event.data);
      }
    };

    recorder.onstop = () => {
      const timestamp = Date.now();
      const fileName = `recording-${timestamp}.${extension}`;
      const file = chunksToFile(
        chunksRef.current,
        mimeType || "audio/webm",
        fileName,
      );
      setRecordedFile(file);
      cleanupResources();
      setRecorderState("stopped");
    };

    recorder.start(DATA_INTERVAL_MS);
    setRecorderState("recording");

    // Elapsed-second timer
    timerRef.current = setInterval(() => {
      setElapsedSec((prev) => prev + 1);
    }, 1000);

    // Auto-stop at 5 minutes
    autoStopRef.current = setTimeout(() => {
      if (
        mediaRecorderRef.current &&
        mediaRecorderRef.current.state === "recording"
      ) {
        mediaRecorderRef.current.stop();
      }
    }, MAX_RECORDING_SEC * 1000);

    // Waveform visualisation loop
    const updateFrequency = () => {
      if (!analyserRef.current) return;
      const buffer = new Uint8Array(analyserRef.current.frequencyBinCount);
      analyserRef.current.getByteFrequencyData(buffer);
      setFrequencyData(buffer);
      animFrameRef.current = requestAnimationFrame(updateFrequency);
    };
    animFrameRef.current = requestAnimationFrame(updateFrequency);
  }, [recorderState, cleanupResources]);

  const stopRecording = useCallback(() => {
    if (!mediaRecorderRef.current || recorderState !== "recording") return;
    if (mediaRecorderRef.current.state === "recording") {
      mediaRecorderRef.current.stop();
    }
  }, [recorderState]);

  return {
    recorderState,
    startRecording,
    stopRecording,
    recordedFile,
    elapsedSec,
    frequencyData,
    error,
  };
}
