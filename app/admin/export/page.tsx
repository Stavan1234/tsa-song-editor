"use client";

import { collection, getDocs, orderBy, query } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useState } from "react";

type ExportSong = {
  id: string;
  title_marathi: string;
  title_english: string;
  category: string;
  eng_ref: string;
  tune_ref: string;
  lyrics: string;
};

export default function ExportPage() {
  const [isExporting, setIsExporting] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const [statusType, setStatusType] = useState<"success" | "error" | null>(null);

  async function exportJson() {
    setIsExporting(true);
    setStatus(null);
    setStatusType(null);

    try {
      const q = query(
        collection(db, "songs"),
        orderBy("hymnNumber")
      );

      const snapshot = await getDocs(q);

      const songs: ExportSong[] = snapshot.docs.map((doc) => {
        const data = doc.data();

        return {
          id: doc.id,
          title_marathi: data.titleMarathi,
          title_english: data.titleEnglish || "",
          category: data.category,
          eng_ref: data.engRef || "",
          tune_ref: data.tuneRef || "",
          lyrics: data.lyrics,
        };
      });

      const json = JSON.stringify(songs, null, 2);
      downloadFile(json, "tsa_songbook.json");

      setStatus(`Successfully exported ${songs.length} songs`);
      setStatusType("success");
    } catch (err) {
      console.error(err);
      setStatus("Export failed. Please try again.");
      setStatusType("error");
    } finally {
      setIsExporting(false);
    }
  }

  function downloadFile(content: string, filename: string) {
    const blob = new Blob([content], {
      type: "application/json;charset=utf-8;",
    });
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();

    URL.revokeObjectURL(url);
  }

  return (
    <main className="p-8 max-w-4xl">
      {/* Header Section */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Export Songbook
        </h1>
        <p className="text-base text-gray-600">
          Download the complete songbook in Android-compatible JSON format
        </p>
      </div>

      {/* Information Card */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-8 shadow-sm">
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0 mt-0.5">
            <svg
              className="w-6 h-6 text-blue-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
          <div className="flex-1">
            <h3 className="text-sm font-semibold text-blue-900 mb-1">
              Export Information
            </h3>
            <ul className="text-sm text-blue-800 space-y-1.5">
              <li className="flex items-center gap-2">
                <span className="text-blue-600">•</span>
                <span>All songs will be exported in JSON format</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="text-blue-600">•</span>
                <span>File is compatible with Android applications</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="text-blue-600">•</span>
                <span>Data includes all song metadata and lyrics</span>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Export Action Card */}
      <div className="bg-white border border-gray-200 rounded-lg p-8 shadow-sm">
        <div className="flex flex-col items-center justify-center py-6">
          <div className="mb-6">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mb-4 mx-auto">
              <svg
                className="w-10 h-10 text-green-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
            </div>
            <h2 className="text-xl font-semibold text-gray-900 text-center mb-2">
              Ready to Export
            </h2>
            <p className="text-sm text-gray-500 text-center max-w-md">
              Click the button below to download your songbook as a JSON file
            </p>
          </div>

          <button
            onClick={exportJson}
            disabled={isExporting}
            className={`
              relative px-8 py-4 rounded-lg text-white font-semibold text-base
              transition-all duration-200 transform
              disabled:cursor-not-allowed disabled:transform-none
              ${
                isExporting
                  ? "bg-gray-400 cursor-not-allowed"
                  : "bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 hover:shadow-lg hover:scale-105 active:scale-100 shadow-md"
              }
            `}
          >
            {isExporting ? (
              <span className="flex items-center gap-2">
                <svg
                  className="animate-spin h-5 w-5 text-white"
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
                Exporting...
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
                    d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                  />
                </svg>
                Download JSON File
              </span>
            )}
          </button>
        </div>

        {/* Status Message */}
        {status && (
          <div
            className={`mt-6 p-4 rounded-lg border ${
              statusType === "success"
                ? "bg-green-50 border-green-200"
                : "bg-red-50 border-red-200"
            }`}
          >
            <div className="flex items-center gap-3">
              {statusType === "success" ? (
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
                  statusType === "success" ? "text-green-800" : "text-red-800"
                }`}
              >
                {status}
              </p>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
