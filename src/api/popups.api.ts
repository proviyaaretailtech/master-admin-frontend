import axios from "axios";
import { getAccessToken } from "../lib/session";

/**
 * Marketing pop-ups for the One Local customer app (specs/marketing-popups/plan.md).
 * These live on the One Local server (its /api/admin/popups), not on the Master backend: the One Local server owns
 * ol_popups and checks that the caller is a platform super admin with the same sign-in token Master already holds.
 */
const ONE_LOCAL_API = import.meta.env.VITE_ONELOCAL_API_URL || "http://localhost:8081/api";

const ol = axios.create({ baseURL: `${ONE_LOCAL_API}/admin`, headers: { "Content-Type": "application/json" } });
ol.interceptors.request.use((config) => {
  const token = getAccessToken();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export type PopupStatus = "draft" | "submitted" | "approved" | "live" | "ended";
export type PopupFormat = "letter" | "popup_center" | "popup_sheet" | "strip";
export type FrameStyle = "royal_gold" | "festive_red" | "plain";
export interface PopupMedia {
  type: "photo" | "video";
  key: string;
  poster_key?: string;
  width: number;
  height: number;
  seconds?: number;
  bytes?: number;
}
export interface PopupText {
  greeting?: string;
  title: string;
  body?: string;
  cta_label?: string;
  cta_route?: string;
}
export interface PopupDraft {
  city_id: string;
  format: PopupFormat;
  content: { en: PopupText; hi?: Partial<PopupText>; mr?: Partial<PopupText> };
  media?: PopupMedia | null;
  frame?: { style: FrameStyle; seal?: string };
  trigger: "app_open" | "screen_view" | "after_seconds" | "first_sign_in";
  trigger_value?: number | null;
  screens: string[];
  targeting: { segments?: string[]; signup_within_days?: number; languages?: string[] };
  frequency: "once" | "daily" | "session" | "every_hours" | "every_nth_open";
  frequency_value?: number | null;
  max_shows?: number | null;
  priority: number;
  is_sponsored: boolean;
  starts_at: string;
  ends_at: string;
}
export interface Popup extends PopupDraft {
  id: string;
  status: PopupStatus;
  created_by?: string;
  approved_by?: string;
  approved_at?: string;
  submitted_at?: string;
  ended_at?: string;
  created_at: string;
  history?: Array<{ action: string; actor?: string; at: string; detail?: { note?: string } }>;
}
export interface PopupResults {
  total: { impression: number; tap: number; close: number };
  people: number;
  days: Array<{ day: string; impression: number; tap: number; close: number }>;
}

/** The One Local server's own message (detail) when it refuses, so the page can show it as is. */
export function popupError(e: unknown): string {
  if (axios.isAxiosError(e)) {
    const d = e.response?.data as { detail?: string } | undefined;
    if (d?.detail) return d.detail;
    if (!e.response) return "The One Local server cannot be reached.";
  }
  return e instanceof Error ? e.message : "Something went wrong.";
}

export const popupApi = {
  list: async (status?: string) => (await ol.get<Popup[]>("/popups", { params: status ? { status } : {} })).data,
  get: async (id: string) => (await ol.get<Popup>(`/popups/${id}`)).data,
  create: async (draft: PopupDraft) => (await ol.post<Popup>("/popups", draft)).data,
  update: async (id: string, draft: PopupDraft) => (await ol.put<Popup>(`/popups/${id}`, draft)).data,
  act: async (id: string, action: "submit" | "return" | "approve" | "end", note?: string) =>
    (await ol.post<Popup>(`/popups/${id}/status`, { action, note })).data,
  results: async (id: string) => (await ol.get<PopupResults>(`/popups/${id}/results`)).data,

  /** Upload a photo or MP4 into the pop-ups folder; returns its public address. */
  async upload(file: Blob, filename: string): Promise<string> {
    const { data } = await ol.post<{ upload_url: string; public_url: string; headers: Record<string, string> }>("/media/upload-url", {
      folder: "popups",
      content_type: file.type,
      filename,
      size: file.size,
    });
    const put = await fetch(data.upload_url, { method: "PUT", headers: data.headers, body: file });
    if (!put.ok) throw new Error(`The upload failed (${put.status}).`);
    return data.public_url;
  },
};

/** Allowed shapes: 4:5 (1080 x 1350) or square (1080 x 1080), within 1%. */
export const shapeOk = (w: number, h: number) => Math.abs(w / h - 0.8) <= 0.008 || Math.abs(w / h - 1) <= 0.01;
export const PHOTO_MAX_BYTES = 2 * 1024 * 1024;
export const VIDEO_MAX_BYTES = 15 * 1024 * 1024;
export const VIDEO_MAX_SECONDS = 30;

/** Reads a file's real size (and length for a video) in the browser, and for a video makes a JPEG of its first frame. */
export async function inspectCreative(file: File): Promise<{ type: "photo" | "video"; width: number; height: number; seconds?: number; poster?: Blob }> {
  const url = URL.createObjectURL(file);
  try {
    if (file.type.startsWith("image/")) {
      const img = new Image();
      await new Promise<void>((ok, fail) => { img.onload = () => ok(); img.onerror = () => fail(new Error("This photo cannot be read.")); img.src = url; });
      return { type: "photo", width: img.naturalWidth, height: img.naturalHeight };
    }
    const video = document.createElement("video");
    video.muted = true; video.preload = "auto"; video.src = url;
    await new Promise<void>((ok, fail) => { video.onloadeddata = () => ok(); video.onerror = () => fail(new Error("This video cannot be read. Use an MP4 (H.264).")); });
    video.currentTime = Math.min(0.5, video.duration / 2);
    await new Promise<void>((ok) => { video.onseeked = () => ok(); });
    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth; canvas.height = video.videoHeight;
    canvas.getContext("2d")?.drawImage(video, 0, 0);
    const poster = await new Promise<Blob | undefined>((ok) => canvas.toBlob((b) => ok(b ?? undefined), "image/jpeg", 0.82));
    return { type: "video", width: video.videoWidth, height: video.videoHeight, seconds: Math.round(video.duration * 10) / 10, poster };
  } finally {
    URL.revokeObjectURL(url);
  }
}
