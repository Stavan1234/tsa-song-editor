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
      // 1. Check if ID exists
      const docRef = doc(db, "songs", id);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        setError(`Song #${id} already exists. Please delete it first or choose another number.`);
        setIsSubmitting(false);
        return;
      }

      // 2. Create Song
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

      // 3. Redirect
      router.push(`/admin/songs/${id}`);
    } catch (err) {
      console.error(err);
      setError("Failed to create song. Please check your connection.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="p-8 max-w-2xl mx-auto">
      <div className="mb-8">
        <button onClick={() => router.push("/admin/songs")} className="text-gray-500 hover:text-blue-600 text-sm mb-2">← Cancel</button>
        <h1 className="text-3xl font-bold text-gray-900">Add New Song</h1>
        <p className="text-gray-600">Create a new entry in the songbook</p>
      </div>

      <form onSubmit={handleSubmit} className="bg-white p-8 rounded-xl border border-gray-200 shadow-sm space-y-6">
        
        {error && (
          <div className="p-4 bg-red-50 text-red-700 border border-red-200 rounded-lg text-sm font-medium">
            {error}
          </div>
        )}

        <div>
          <label className="block text-sm font-bold text-gray-900 mb-1">Hymn Number <span className="text-red-500">*</span></label>
          <input
            required
            type="number"
            placeholder="e.g. 105"
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
            value={formData.hymnNumber}
            onChange={e => setFormData({...formData, hymnNumber: e.target.value})}
          />
          <p className="text-xs text-gray-500 mt-1">This will be used as the unique ID.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Marathi Title</label>
            <input
              required
              type="text"
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              value={formData.titleMarathi}
              onChange={e => setFormData({...formData, titleMarathi: e.target.value})}
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">English Title</label>
            <input
              type="text"
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              value={formData.titleEnglish}
              onChange={e => setFormData({...formData, titleEnglish: e.target.value})}
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1">Category</label>
          <input
            type="text"
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
            value={formData.category}
            onChange={e => setFormData({...formData, category: e.target.value})}
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1">Lyrics</label>
          <textarea
            required
            className="w-full p-3 border border-gray-300 rounded-lg h-40 font-mono text-sm focus:ring-2 focus:ring-blue-500 outline-none"
            placeholder="Enter song lyrics..."
            value={formData.lyrics}
            onChange={e => setFormData({...formData, lyrics: e.target.value})}
          />
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className={`w-full py-4 rounded-lg font-bold text-white text-lg transition-all
            ${isSubmitting 
              ? "bg-gray-400 cursor-wait" 
              : "bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 shadow-md hover:shadow-lg hover:-translate-y-0.5"}
          `}
        >
          {isSubmitting ? "Creating..." : "Create Song"}
        </button>
      </form>
    </main>
  );
}