"use client";

import { useState } from "react";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useRouter } from "next/navigation";

export default function NewSongPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    hymnNumber: "",
    titleMarathi: "",
    titleEnglish: "",
    category: "Salvation",
    lyrics: "",
  });
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setIsSubmitting(true);

    const id = formData.hymnNumber.trim();
    if (!id) {
      setError("Hymn number is required");
      setIsSubmitting(false);
      return;
    }

    try {
      const docRef = doc(db, "songs", id);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        setError(`Song #${id} already exists.`);
        setIsSubmitting(false);
        return;
      }

      await setDoc(docRef, {
        hymnNumber: Number(id),
        titleMarathi: formData.titleMarathi,
        titleEnglish: formData.titleEnglish,
        category: formData.category,
        lyrics: formData.lyrics,
        verified: false,
        lastEditedAt: new Date(),
        engRef: "",
        tuneRef: ""
      });

      router.push(`/admin/songs/${id}`);
    } catch (err) {
      console.error(err);
      setError("Failed to create song.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="p-8 max-w-2xl mx-auto">
      <div className="mb-6">
        <button onClick={() => router.push("/admin/songs")} className="text-gray-500 hover:text-blue-600 text-sm mb-2">← Cancel</button>
        <h1 className="text-3xl font-bold text-gray-900">Add New Song</h1>
      </div>

      <form onSubmit={handleSubmit} className="bg-white p-8 rounded-xl border border-gray-200 shadow-sm space-y-5">
        {error && <div className="p-3 bg-red-50 text-red-700 border border-red-200 rounded text-sm">{error}</div>}

        <div>
          <label className="block text-sm font-bold text-gray-900 mb-1">Hymn Number</label>
          <input
            required
            type="number"
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            value={formData.hymnNumber}
            onChange={e => setFormData({...formData, hymnNumber: e.target.value})}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Marathi Title</label>
            <input
              required
              type="text"
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              value={formData.titleMarathi}
              onChange={e => setFormData({...formData, titleMarathi: e.target.value})}
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">English Title</label>
            <input
              type="text"
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              value={formData.titleEnglish}
              onChange={e => setFormData({...formData, titleEnglish: e.target.value})}
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1">Category</label>
          <input
            type="text"
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            value={formData.category}
            onChange={e => setFormData({...formData, category: e.target.value})}
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1">Lyrics</label>
          <textarea
            required
            className="w-full p-3 border border-gray-300 rounded-lg h-40 font-mono text-sm focus:ring-2 focus:ring-blue-500"
            value={formData.lyrics}
            onChange={e => setFormData({...formData, lyrics: e.target.value})}
          />
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full py-3 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-700 disabled:bg-gray-400"
        >
          {isSubmitting ? "Creating..." : "Create Song"}
        </button>
      </form>
    </main>
  );
}