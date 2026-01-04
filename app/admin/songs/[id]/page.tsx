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
  const { id } = useParams<{ id: string }>(); // This is the current ID (hymn number)
  const router = useRouter();

  const [originalSong, setOriginalSong] = useState<Song | null>(null);
  const [formData, setFormData] = useState({
    hymnNumber: "", // Keep as string for input handling
    titleMarathi: "",
    titleEnglish: "",
    category: "",
    lyrics: "",
  });
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState<{ type: "success" | "error" | null; message: string }>({ type: null, message: "" });

  useEffect(() => {
    async function loadSong() {
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
        console.error(error);
        setStatus({ type: "error", message: "Failed to load song" });
      } finally {
        setLoading(false);
      }
    }

    loadSong();
  }, [id, router]);

  async function save() {
    if (originalSong?.verified) {
      alert("Verified songs cannot be edited.");
      return;
    }

    setSaving(true);
    setStatus({ type: null, message: "" });

    try {
      const newHymnNumber = Number(formData.hymnNumber);
      const oldHymnNumber = Number(id);

      // Common data to save
      const dataToSave = {
        titleMarathi: formData.titleMarathi,
        titleEnglish: formData.titleEnglish,
        category: formData.category,
        lyrics: formData.lyrics,
        hymnNumber: newHymnNumber,
        lastEditedAt: new Date(),
        // Preserve existing fields that aren't in the form
        verified: originalSong?.verified || false,
        engRef: originalSong?.engRef || "",
        tuneRef: originalSong?.tuneRef || "",
      };

      // CASE 1: Hymn Number Changed (Migration required)
      if (newHymnNumber !== oldHymnNumber) {
        const newDocRef = doc(db, "songs", formData.hymnNumber);
        const newDocSnap = await getDoc(newDocRef);

        if (newDocSnap.exists()) {
          setStatus({ type: "error", message: `Song #${newHymnNumber} already exists! Choose a different number.` });
          setSaving(false);
          return;
        }

        // 1. Create new document
        await setDoc(newDocRef, dataToSave);
        // 2. Delete old document
        await deleteDoc(doc(db, "songs", id));
        
        setStatus({ type: "success", message: "Song moved to new number. Redirecting..." });
        setTimeout(() => router.push(`/admin/songs/${newHymnNumber}`), 1500);
      } 
      // CASE 2: Same Hymn Number (Simple Update)
      else {
        await updateDoc(doc(db, "songs", id), dataToSave);
        setOriginalSong({ ...originalSong!, ...dataToSave }); // Update local state
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
    if (!confirm(`Are you sure you want to PERMANENTLY delete Song #${id}?`)) return;

    setSaving(true);
    try {
      await deleteDoc(doc(db, "songs", id));
      router.push("/admin/songs");
    } catch (error) {
      setStatus({ type: "error", message: "Failed to delete song" });
      setSaving(false);
    }
  }

  if (loading) return <div className="p-10 text-center text-gray-500">Loading song editor...</div>;
  if (!originalSong) return null;

  return (
    <main className="p-6 md:p-8 max-w-6xl mx-auto pb-20">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <button onClick={() => router.push("/admin/songs")} className="text-sm text-gray-500 hover:text-blue-600 mb-2 flex items-center gap-1">
            ← Back to List
          </button>
          <h1 className="text-2xl font-bold text-gray-900">
            Edit Song #{id}
          </h1>
        </div>
        
        {!originalSong.verified && (
          <button
            onClick={handleDelete}
            className="px-4 py-2 text-red-600 bg-red-50 border border-red-200 rounded-lg hover:bg-red-100 transition-colors text-sm font-medium"
          >
            Delete Song
          </button>
        )}
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column: Metadata Inputs */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm space-y-4">
            <h2 className="font-semibold text-gray-900 mb-4">Song Details</h2>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Hymn Number</label>
              <input
                type="number"
                value={formData.hymnNumber}
                onChange={(e) => setFormData({ ...formData, hymnNumber: e.target.value })}
                disabled={originalSong.verified}
                className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
              <p className="text-xs text-gray-500 mt-1">Changing this moves the song to a new ID.</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Marathi Title</label>
              <input
                type="text"
                value={formData.titleMarathi}
                onChange={(e) => setFormData({ ...formData, titleMarathi: e.target.value })}
                disabled={originalSong.verified}
                className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">English Title</label>
              <input
                type="text"
                value={formData.titleEnglish}
                onChange={(e) => setFormData({ ...formData, titleEnglish: e.target.value })}
                disabled={originalSong.verified}
                className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
              <input
                type="text"
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                disabled={originalSong.verified}
                className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {originalSong.verified && (
              <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg text-xs text-yellow-800">
                🔒 This song is verified. Unverify it to edit details.
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Lyrics Editor */}
        <div className="lg:col-span-2">
          <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm h-full flex flex-col">
            <h2 className="font-semibold text-gray-900 mb-4">Lyrics</h2>
            <textarea
              value={formData.lyrics}
              onChange={(e) => setFormData({ ...formData, lyrics: e.target.value })}
              disabled={originalSong.verified}
              placeholder="Enter lyrics here..."
              className="flex-1 w-full min-h-[400px] p-4 border border-gray-300 rounded-lg font-mono text-base leading-relaxed focus:ring-2 focus:ring-blue-500 resize-y"
            />
          </div>
        </div>
      </div>

      {/* Floating Action Bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] z-40">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
             {status.message && (
                <span className={`text-sm font-medium px-3 py-1 rounded-full ${
                  status.type === 'error' ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'
                }`}>
                  {status.message}
                </span>
             )}
          </div>
          <button
            onClick={save}
            disabled={saving || originalSong.verified}
            className={`
              px-6 py-2.5 rounded-lg font-semibold text-white transition-all
              ${saving || originalSong.verified 
                ? "bg-gray-400 cursor-not-allowed" 
                : "bg-blue-600 hover:bg-blue-700 hover:shadow-lg transform hover:-translate-y-0.5"}
            `}
          >
            {saving ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </div>
    </main>
  );
}