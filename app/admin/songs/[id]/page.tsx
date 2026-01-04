"use client";

import { useEffect, useState } from "react";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useParams, useRouter } from "next/navigation";

type Song = {
  hymnNumber: number;
  titleMarathi: string;
  titleEnglish: string;
  category: string;
  lyrics: string;
  verified: boolean;
};

export default function SongEditorPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  const [song, setSong] = useState<Song | null>(null);
  const [lyrics, setLyrics] = useState("");
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState<{
    type: "success" | "error" | "info" | null;
    message: string;
  }>({ type: null, message: "" });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadSong() {
      setLoading(true);
      try {
        const ref = doc(db, "songs", id);
        const snap = await getDoc(ref);

        if (!snap.exists()) {
          setStatus({
            type: "error",
            message: "Song not found",
          });
          setTimeout(() => router.push("/admin/songs"), 2000);
          return;
        }

        const data = snap.data() as Song;
        setSong(data);
        setLyrics(data.lyrics);
      } catch (error) {
        setStatus({
          type: "error",
          message: "Failed to load song",
        });
      } finally {
        setLoading(false);
      }
    }

    loadSong();
  }, [id, router]);

  async function save() {
    if (song?.verified) {
      setStatus({
        type: "error",
        message: "This song is verified and cannot be edited.",
      });
      setTimeout(() => setStatus({ type: null, message: "" }), 3000);
      return;
    }

    setSaving(true);
    setStatus({ type: null, message: "" });

    try {
      await updateDoc(doc(db, "songs", id), {
        lyrics,
        lastEditedAt: new Date(),
      });

      setStatus({
        type: "success",
        message: "Changes saved successfully",
      });
    } catch (error) {
      setStatus({
        type: "error",
        message: "Failed to save changes. Please try again.",
      });
    } finally {
      setSaving(false);
    }
  }

  async function toggleVerification() {
    if (!song) return;

    const msg = song.verified
      ? "Unverify this song? Editing will be enabled."
      : "Mark this song as VERIFIED? Editing will be locked.";

    if (!confirm(msg)) return;

    try {
      await updateDoc(doc(db, "songs", id), {
        verified: !song.verified,
        lastEditedAt: new Date(),
      });

      setSong({ ...song, verified: !song.verified });
      setStatus({
        type: "success",
        message: song.verified
          ? "Song unverified successfully"
          : "Song marked as verified",
      });
      setTimeout(() => setStatus({ type: null, message: "" }), 3000);
    } catch (error) {
      setStatus({
        type: "error",
        message: "Failed to update verification status",
      });
    }
  }

  const characterCount = lyrics.length;
  const wordCount = lyrics.trim() ? lyrics.trim().split(/\s+/).length : 0;
  const hasChanges = song && lyrics !== song.lyrics;

  if (loading) {
    return (
      <main className="p-8 max-w-5xl">
        <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-12 text-center">
          <svg
            className="animate-spin h-8 w-8 text-blue-600 mx-auto mb-4"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            ></circle>
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            ></path>
          </svg>
          <p className="text-gray-600">Loading song...</p>
        </div>
      </main>
    );
  }

  if (!song) {
    return (
      <main className="p-8 max-w-5xl">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          <p className="text-red-800">{status.message || "Song not found"}</p>
        </div>
      </main>
    );
  }

  return (
    <main className="p-8 max-w-5xl">
      {/* Back Button */}
      <button
        onClick={() => router.push("/admin/songs")}
        className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 mb-6 transition-colors"
      >
        <svg
          className="w-4 h-4"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M15 19l-7-7 7-7"
          />
        </svg>
        Back to Songs List
      </button>

      {/* Header Card */}
      <div className="bg-white border border-gray-200 rounded-lg p-6 mb-6 shadow-sm">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-14 h-14 bg-blue-100 rounded-lg flex items-center justify-center">
                <span className="text-blue-700 font-bold text-xl">
                  {song.hymnNumber}
                </span>
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  {song.titleMarathi}
                </h1>
                {song.titleEnglish && (
                  <p className="text-sm text-gray-600 mt-1">
                    {song.titleEnglish}
                  </p>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2 mt-3">
              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                {song.category}
              </span>
              {song.verified && (
                <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 border border-green-200">
                  <svg
                    className="w-3 h-3"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                      clipRule="evenodd"
                    />
                  </svg>
                  Verified & Locked
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Verification Controls */}
        <div className="border-t border-gray-200 pt-4 mt-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold text-gray-700 mb-1">
                Verification Status
              </h3>
              <p className="text-xs text-gray-500">
                {song.verified
                  ? "This song is verified and locked from editing"
                  : "This song is not verified and can be edited"}
              </p>
            </div>
            <button
              onClick={toggleVerification}
              className={`px-5 py-2.5 rounded-lg text-white font-medium transition-all duration-200 ${
                song.verified
                  ? "bg-gradient-to-r from-orange-600 to-orange-700 hover:from-orange-700 hover:to-orange-800 shadow-md hover:shadow-lg"
                  : "bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 shadow-md hover:shadow-lg"
              }`}
            >
              {song.verified ? (
                <span className="flex items-center gap-2">
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M8 11V7a4 4 0 118 0m-4 8v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2z"
                    />
                  </svg>
                  Unverify (Unlock)
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                    />
                  </svg>
                  Mark as Verified
                </span>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Lyrics Editor Card */}
      <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Lyrics</h2>
          {song.verified && (
            <div className="flex items-center gap-2 px-3 py-1 bg-yellow-50 border border-yellow-200 rounded-lg">
              <svg
                className="w-4 h-4 text-yellow-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                />
              </svg>
              <span className="text-xs font-medium text-yellow-800">
                Editing Locked
              </span>
            </div>
          )}
        </div>

        <textarea
          value={lyrics}
          onChange={(e) => setLyrics(e.target.value)}
          disabled={song.verified}
          placeholder="Enter song lyrics here..."
          className={`w-full h-[500px] border-2 rounded-lg p-4 font-mono text-base leading-relaxed resize-none focus:outline-none focus:ring-2 transition-all ${
            song.verified
              ? "bg-gray-50 border-gray-200 cursor-not-allowed text-gray-900"
              : "bg-white border-gray-300 focus:border-blue-500 focus:ring-blue-200 text-gray-900"
          }`}
        />

        <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-200">
          <div className="flex items-center gap-4 text-xs text-gray-500">
            <span>
              <strong className="text-gray-700">{characterCount}</strong> characters
            </span>
            <span>
              <strong className="text-gray-700">{wordCount}</strong> words
            </span>
          </div>
          {hasChanges && !song.verified && (
            <span className="text-xs text-orange-600 font-medium flex items-center gap-1">
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
              Unsaved changes
            </span>
          )}
        </div>
      </div>

      {/* Action Bar */}
      <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={save}
              disabled={saving || song.verified || !hasChanges}
              className={`
                px-6 py-3 rounded-lg font-semibold text-base
                transition-all duration-200 transform
                disabled:cursor-not-allowed disabled:transform-none
                ${
                  saving || song.verified || !hasChanges
                    ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                    : "bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white shadow-md hover:shadow-lg hover:scale-105 active:scale-100"
                }
              `}
            >
              {saving ? (
                <span className="flex items-center gap-2">
                  <svg
                    className="animate-spin h-5 w-5"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  Saving...
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                  Save Changes
                </span>
              )}
            </button>
          </div>

          {/* Status Message */}
          {status.type && (
            <div
              className={`flex items-center gap-2 px-4 py-2 rounded-lg ${
                status.type === "success"
                  ? "bg-green-50 text-green-800 border border-green-200"
                  : status.type === "error"
                  ? "bg-red-50 text-red-800 border border-red-200"
                  : "bg-blue-50 text-blue-800 border border-blue-200"
              }`}
            >
              {status.type === "success" ? (
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              ) : (
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              )}
              <span className="text-sm font-medium">{status.message}</span>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
