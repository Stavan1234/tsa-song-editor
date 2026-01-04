"use client";

import { useEffect, useState } from "react";
import { doc, getDoc, updateDoc, deleteDoc, setDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useParams, useRouter } from "next/navigation";

type Song = {
  hymnNumber: number;
  titleMarathi: string;
  titleEnglish: string;
  category: string;
  lyrics: string;
  verified: boolean;
  engRef?: string;
  tuneRef?: string;
};

export default function SongEditorPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  const [originalSong, setOriginalSong] = useState<Song | null>(null);
  const [formData, setFormData] = useState({
    hymnNumber: "",
    titleMarathi: "",
    titleEnglish: "",
    category: "",
    lyrics: "",
  });

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
          setStatus({ type: "error", message: "Song not found" });
          setTimeout(() => router.push("/admin/songs"), 2000);
          return;
        }

        const data = snap.data() as Song;
        setOriginalSong(data);
        setFormData({
          hymnNumber: data.hymnNumber.toString(),
          titleMarathi: data.titleMarathi || "",
          titleEnglish: data.titleEnglish || "",
          category: data.category || "",
          lyrics: data.lyrics || "",
        });
      } catch (error) {
        setStatus({ type: "error", message: "Failed to load song" });
      } finally {
        setLoading(false);
      }
    }

    loadSong();
  }, [id, router]);

  async function save() {
    if (originalSong?.verified) {
      setStatus({ type: "error", message: "Verified songs cannot be edited." });
      return;
    }

    setSaving(true);
    setStatus({ type: null, message: "" });

    try {
      const newHymnNumber = Number(formData.hymnNumber);
      const oldHymnNumber = Number(id);

      const dataToSave = {
        hymnNumber: newHymnNumber,
        titleMarathi: formData.titleMarathi,
        titleEnglish: formData.titleEnglish,
        category: formData.category,
        lyrics: formData.lyrics,
        lastEditedAt: new Date(),
        verified: originalSong?.verified || false,
        engRef: originalSong?.engRef || "",
        tuneRef: originalSong?.tuneRef || "",
      };

      // Case 1: ID Change (Move song)
      if (newHymnNumber !== oldHymnNumber) {
        const newDocRef = doc(db, "songs", formData.hymnNumber);
        const newDocSnap = await getDoc(newDocRef);

        if (newDocSnap.exists()) {
          setStatus({ type: "error", message: `Song #${newHymnNumber} already exists!` });
          setSaving(false);
          return;
        }

        await setDoc(newDocRef, dataToSave);
        await deleteDoc(doc(db, "songs", id));
        
        setStatus({ type: "success", message: "Song moved to new number..." });
        setTimeout(() => router.push(`/admin/songs/${newHymnNumber}`), 1500);
      } 
      // Case 2: Update existing
      else {
        await updateDoc(doc(db, "songs", id), dataToSave);
        setOriginalSong({ ...originalSong!, ...dataToSave });
        setStatus({ type: "success", message: "Changes saved successfully" });
      }

    } catch (error) {
      console.error(error);
      setStatus({ type: "error", message: "Failed to save changes." });
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!confirm(`Are you sure you want to DELETE Song #${id}? This cannot be undone.`)) return;

    setSaving(true);
    try {
      await deleteDoc(doc(db, "songs", id));
      router.push("/admin/songs");
    } catch (error) {
      setStatus({ type: "error", message: "Failed to delete song" });
      setSaving(false);
    }
  }

  if (loading) return <div className="p-10 text-center">Loading...</div>;
  if (!originalSong) return null;

  return (
    <main className="p-8 max-w-6xl mx-auto pb-24">
      {/* Back Button & Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
        <div>
           <button
            onClick={() => router.push("/admin/songs")}
            className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 mb-2"
          >
            ← Back to Songs
          </button>
          <h1 className="text-2xl font-bold text-gray-900">
            Edit Song #{id}
          </h1>
        </div>
        
        {!originalSong.verified && (
          <button
            onClick={handleDelete}
            className="px-4 py-2 bg-red-50 text-red-600 border border-red-200 rounded-lg text-sm font-medium hover:bg-red-100"
          >
            Delete Song
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Metadata Column */}
        <div className="lg:col-span-1 space-y-4">
          <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm space-y-4">
            <h2 className="font-semibold text-gray-900 border-b border-gray-100 pb-2">Song Metadata</h2>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Hymn Number</label>
              <input
                type="number"
                value={formData.hymnNumber}
                onChange={(e) => setFormData({...formData, hymnNumber: e.target.value})}
                disabled={originalSong.verified}
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Marathi Title</label>
              <input
                type="text"
                value={formData.titleMarathi}
                onChange={(e) => setFormData({...formData, titleMarathi: e.target.value})}
                disabled={originalSong.verified}
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">English Title</label>
              <input
                type="text"
                value={formData.titleEnglish}
                onChange={(e) => setFormData({...formData, titleEnglish: e.target.value})}
                disabled={originalSong.verified}
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
              <input
                type="text"
                value={formData.category}
                onChange={(e) => setFormData({...formData, category: e.target.value})}
                disabled={originalSong.verified}
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {originalSong.verified && (
              <div className="bg-yellow-50 text-yellow-800 p-3 rounded text-xs border border-yellow-200">
                Locked: Verified song
              </div>
            )}
          </div>
        </div>

        {/* Lyrics Column */}
        <div className="lg:col-span-2">
          <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm h-full flex flex-col">
            <h2 className="font-semibold text-gray-900 mb-4">Lyrics</h2>
            <textarea
              value={formData.lyrics}
              onChange={(e) => setFormData({...formData, lyrics: e.target.value})}
              disabled={originalSong.verified}
              className="flex-1 w-full min-h-[400px] p-4 border border-gray-300 rounded-lg font-mono text-base focus:ring-2 focus:ring-blue-500 resize-y"
            />
          </div>
        </div>
      </div>

      {/* Floating Save Bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4 shadow-lg z-50">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div>
            {status.message && (
              <span className={`text-sm font-medium ${status.type === 'error' ? 'text-red-600' : 'text-green-600'}`}>
                {status.message}
              </span>
            )}
          </div>
          <button
            onClick={save}
            disabled={saving || originalSong.verified}
            className={`px-6 py-2.5 rounded-lg font-semibold text-white shadow-md transition-all
              ${saving || originalSong.verified ? "bg-gray-400 cursor-not-allowed" : "bg-blue-600 hover:bg-blue-700"}
            `}
          >
            {saving ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </div>
    </main>
  );
}