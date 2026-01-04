"use client";

import { useState } from "react";
import {
  collection,
  doc,
  getDocs,
  writeBatch,
} from "firebase/firestore";
import { db } from "@/lib/firebase";

/* ---------------- TYPES ---------------- */

type ValidationResult = {
  valid: boolean;
  error?: string;
  summary?: {
    totalSongs: number;
    categories: string[];
    missingEnglishTitles: number;
  };
};

type RawSong = {
  id: string;
  title_marathi: string;
  title_english?: string;
  category: string;
  lyrics: string;
  eng_ref?: string;
  tune_ref?: string;
};

/* ---------------- COMPONENT ---------------- */

export default function ImportPage() {
  const [fileName, setFileName] = useState<string | null>(null);
  const [fileText, setFileText] = useState<string | null>(null);
  const [validation, setValidation] = useState<ValidationResult | null>(null);
  const [confirmChecked, setConfirmChecked] = useState(false);
  const [confirmText, setConfirmText] = useState("");
  const [isImporting, setIsImporting] = useState(false);
  const [importStatus, setImportStatus] = useState<{
    type: "success" | "error" | null;
    message: string;
  }>({ type: null, message: "" });

  /* ---------------- VALIDATION ---------------- */

  function validateJson(text: string): ValidationResult {
    try {
      const data: unknown = JSON.parse(text);

      if (!Array.isArray(data)) {
        return { valid: false, error: "Root JSON must be an array." };
      }

      const categories = new Set<string>();
      let missingEnglish = 0;

      for (const item of data) {
        const song = item as RawSong;

        if (
          !song.id ||
          !song.title_marathi ||
          !song.category ||
          !song.lyrics
        ) {
          return {
            valid: false,
            error: "One or more songs are missing required fields.",
          };
        }

        categories.add(song.category);

        if (!song.title_english || song.title_english.trim() === "") {
          missingEnglish++;
        }
      }

      return {
        valid: true,
        summary: {
          totalSongs: data.length,
          categories: Array.from(categories),
          missingEnglishTitles: missingEnglish,
        },
      };
    } catch (e) {
      if (e instanceof Error) {
        return { valid: false, error: e.message };
      }
      return { valid: false, error: "Unknown JSON parsing error" };
    }
  }

  /* ---------------- FILE UPLOAD ---------------- */

  async function handleFileUpload(file: File) {
    setFileName(file.name);
    setValidation(null);
    setConfirmChecked(false);
    setConfirmText("");

    const text = await file.text();
    setFileText(text);

    const result = validateJson(text);
    setValidation(result);
  }

  /* ---------------- IMPORT LOGIC ---------------- */

  async function runImport() {
    if (!validation?.valid || !fileText) return;

    setIsImporting(true);
    setImportStatus({ type: null, message: "" });

    try {
      const songs: RawSong[] = JSON.parse(fileText);

      const batch = writeBatch(db);
      const songsRef = collection(db, "songs");

      // 1️⃣ Delete all existing songs
      const existing = await getDocs(songsRef);
      existing.forEach((docSnap) => {
        batch.delete(doc(db, "songs", docSnap.id));
      });

      // 2️⃣ Insert new songs
      for (const song of songs) {
        batch.set(doc(db, "songs", song.id.toString()), {
          hymnNumber: Number(song.id),
          titleMarathi: song.title_marathi,
          titleEnglish: song.title_english ?? "",
          category: song.category,
          lyrics: song.lyrics,
          engRef: song.eng_ref ?? "",
          tuneRef: song.tune_ref ?? "",
          verified: false,
          lastEditedAt: new Date(),
        });
      }

      await batch.commit();
      setImportStatus({
        type: "success",
        message: `Successfully imported ${songs.length} songs`,
      });
      // Reset form after successful import
      setFileName(null);
      setFileText(null);
      setValidation(null);
      setConfirmChecked(false);
      setConfirmText("");
    } catch (err) {
      console.error(err);
      setImportStatus({
        type: "error",
        message: "Import failed. No data was changed.",
      });
    } finally {
      setIsImporting(false);
    }
  }

  /* ---------------- STATE ---------------- */

  const canImport =
    validation?.valid &&
    confirmChecked &&
    confirmText === "IMPORT" &&
    !isImporting;

  /* ---------------- UI ---------------- */

  return (
    <main className="p-8 max-w-4xl">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Import Songbook
        </h1>
        <p className="text-base text-gray-600">
          Upload a JSON file to replace all existing songs in the database
        </p>
      </div>

      {/* Warning Banner */}
      <div className="mb-8 border-2 border-red-400 bg-gradient-to-r from-red-50 to-orange-50 rounded-lg p-6 shadow-md">
        <div className="flex items-start gap-4">
          <div className="flex-shrink-0">
            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
              <svg
                className="w-6 h-6 text-red-600"
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
            </div>
          </div>
          <div className="flex-1">
            <h2 className="text-xl font-bold text-red-900 mb-2">
              ⚠️ Dangerous Operation
            </h2>
            <p className="text-sm text-red-800 leading-relaxed">
              Uploading a JSON file will <strong>permanently delete</strong> all
              existing songs and replace them with the contents of the uploaded
              file. This action cannot be undone.
            </p>
          </div>
        </div>
      </div>

      {/* Upload Section */}
      <div className="bg-white border border-gray-200 rounded-lg p-6 mb-6 shadow-sm">
        <label className="block text-sm font-semibold text-gray-700 mb-3">
          Upload Songbook JSON File
        </label>
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-blue-400 hover:bg-blue-50 transition-colors duration-200">
          <input
            type="file"
            accept=".json"
            onChange={(e) => {
              if (e.target.files?.[0]) {
                handleFileUpload(e.target.files[0]);
              }
            }}
            className="hidden"
            id="file-upload"
          />
          <label
            htmlFor="file-upload"
            className="cursor-pointer flex flex-col items-center"
          >
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
              <svg
                className="w-8 h-8 text-gray-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                />
              </svg>
            </div>
            <span className="text-sm font-medium text-gray-700 mb-1">
              Click to upload or drag and drop
            </span>
            <span className="text-xs text-gray-500">
              JSON files only
            </span>
          </label>
        </div>
        {fileName && (
          <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-center gap-2">
              <svg
                className="w-5 h-5 text-blue-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
              <span className="text-sm font-medium text-blue-900">
                Selected: <span className="font-normal">{fileName}</span>
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Validation Result */}
      {validation && (
        <div className="mb-6">
          {validation.valid ? (
            <div className="border-2 border-green-400 bg-green-50 rounded-lg p-6 shadow-sm">
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0">
                  <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                    <svg
                      className="w-6 h-6 text-green-600"
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
                  </div>
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-bold text-green-900 mb-3">
                    ✅ JSON File is Valid
                  </h3>
                  <div className="bg-white rounded-lg p-4 border border-green-200">
                    <ul className="space-y-2 text-sm text-green-800">
                      <li className="flex items-center justify-between py-1 border-b border-green-100 last:border-0">
                        <span className="font-medium">Total Songs:</span>
                        <span className="font-bold text-green-900">
                          {validation.summary?.totalSongs}
                        </span>
                      </li>
                      <li className="flex items-start justify-between py-1 border-b border-green-100 last:border-0">
                        <span className="font-medium">Categories:</span>
                        <span className="text-right max-w-xs">
                          {validation.summary?.categories.join(", ")}
                        </span>
                      </li>
                      <li className="flex items-center justify-between py-1">
                        <span className="font-medium">Missing English Titles:</span>
                        <span
                          className={`font-bold ${
                            validation.summary &&
                            validation.summary.missingEnglishTitles > 0
                              ? "text-orange-600"
                              : "text-green-900"
                          }`}
                        >
                          {validation.summary?.missingEnglishTitles}
                        </span>
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="border-2 border-red-400 bg-red-50 rounded-lg p-6 shadow-sm">
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0">
                  <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                    <svg
                      className="w-6 h-6 text-red-600"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M6 18L18 6M6 6l12 12"
                      />
                    </svg>
                  </div>
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-bold text-red-900 mb-2">
                    ❌ Invalid JSON File
                  </h3>
                  <p className="text-sm text-red-800 bg-white rounded p-3 border border-red-200">
                    {validation.error}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Confirmation Section */}
      {validation?.valid && (
        <div className="bg-yellow-50 border-2 border-yellow-300 rounded-lg p-6 mb-6 shadow-sm">
          <h3 className="text-lg font-bold text-yellow-900 mb-4">
            Final Confirmation Required
          </h3>

          <div className="space-y-4">
            <label className="flex items-start gap-3 p-4 bg-white rounded-lg border border-yellow-200 cursor-pointer hover:bg-yellow-100 transition-colors">
              <input
                type="checkbox"
                checked={confirmChecked}
                onChange={(e) => setConfirmChecked(e.target.checked)}
                className="mt-1 w-5 h-5 text-yellow-600 border-yellow-300 rounded focus:ring-yellow-500 focus:ring-2"
              />
              <span className="text-sm text-yellow-900 flex-1">
                I understand that <strong className="text-red-700">ALL existing songs</strong> will be
                permanently deleted and cannot be recovered.
              </span>
            </label>

            <div>
              <label className="block text-sm font-semibold text-yellow-900 mb-2">
                Type <strong className="text-red-700 font-mono">IMPORT</strong> to confirm this action:
              </label>
              <input
                type="text"
                value={confirmText}
                onChange={(e) => setConfirmText(e.target.value)}
                placeholder="Type IMPORT here"
                className="w-full max-w-xs border-2 border-yellow-300 rounded-lg px-4 py-3 text-base font-mono focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 bg-white"
              />
              {confirmText && confirmText !== "IMPORT" && (
                <p className="mt-2 text-xs text-red-600">
                  Text must match exactly: <strong>IMPORT</strong>
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Action Button */}
      <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
        <button
          disabled={!canImport}
          onClick={runImport}
          className={`
            w-full px-8 py-4 rounded-lg font-bold text-base
            transition-all duration-200 transform
            disabled:cursor-not-allowed disabled:transform-none
            ${
              canImport
                ? "bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 hover:shadow-lg hover:scale-[1.02] active:scale-100 text-white shadow-md"
                : "bg-gray-300 text-gray-500 cursor-not-allowed"
            }
          `}
        >
          {isImporting ? (
            <span className="flex items-center justify-center gap-2">
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
              Importing Songbook...
            </span>
          ) : (
            <span className="flex items-center justify-center gap-2">
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
                  d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"
                />
              </svg>
              Replace Songbook
            </span>
          )}
        </button>

        {/* Import Status */}
        {importStatus.type && (
          <div
            className={`mt-4 p-4 rounded-lg border ${
              importStatus.type === "success"
                ? "bg-green-50 border-green-200"
                : "bg-red-50 border-red-200"
            }`}
          >
            <div className="flex items-center gap-3">
              {importStatus.type === "success" ? (
                <svg
                  className="w-5 h-5 text-green-600 flex-shrink-0"
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
                  className="w-5 h-5 text-red-600 flex-shrink-0"
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
              <p
                className={`text-sm font-medium ${
                  importStatus.type === "success"
                    ? "text-green-800"
                    : "text-red-800"
                }`}
              >
                {importStatus.message}
              </p>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
