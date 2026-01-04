# TSA Songbook Editor 🎵

![Project Status](https://img.shields.io/badge/Status-Active-success)
![Next.js](https://img.shields.io/badge/Next.js-14-black)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue)
![Firebase](https://img.shields.io/badge/Firebase-Firestore-orange)

### Why this project?

The original songbook data existed in PDFs and legacy font encodings, making it difficult to correct, verify, and reuse reliably.  
This editor was built to clean the data once, verify it properly, and generate a stable JSON source of truth for a mobile application.

This project is an internal tool built for a specific organization and workflow.  
It is not intended as a public SaaS or open-source contribution project.

<img width="1092" height="1355" alt="editor 1" src="https://github.com/user-attachments/assets/2330290c-f380-43a5-8e5e-bcbbdde2ce1b" />

## ✨ Key Features

### 1. Dashboard & Song Management
A centralized dashboard to view database statistics and manage the song list.
* **Search & Filter:** Instantly filter songs by Hymn Number, Marathi Title, or Category.
* **Quick Stats:** View total song count and verification progress at a glance.

<img width="1092" height="643" alt="editor 2" src="https://github.com/user-attachments/assets/5e4cf542-7da1-4eac-920c-2e2863ca117b" />

### 2. Powerful Song Editor
A dedicated interface for editing song metadata and lyrics.
* **Metadata:** Edit Hymn Number, Marathi/English Titles, and Categories.
* **Lyrics Editor:** A clean text area for formatting song lyrics.
* **Smart ID Management:** Changing a Hymn Number automatically migrates the song to a new Database ID and cleans up the old record.

<img width="1092" height="767" alt="editor 3" src="https://github.com/user-attachments/assets/dae410fd-a846-479d-a4c9-6e6e77491f45" />


### 3. Verification System 🔒
To prevent accidental data loss or unwanted edits on finished songs, the system includes a verification lock.
* **Locking:** Mark a song as "Verified" to disable all edit fields.
* **Unlocking:** Admin privileges allow unlocking a song for necessary revisions.

### 4. Add New Content
Easily create new entries in the songbook with automatic duplicate ID detection to ensure data integrity.

<img width="1092" height="826" alt="editor 4" src="https://github.com/user-attachments/assets/c0121729-47d7-48e4-a400-8ce5739f5ed2" />


### 5. Data Import & Export
Seamlessly sync data between this editor and the Android application.
* **Export:** Generates an Android-compatible JSON file containing the entire songbook.
* **Import:** Bulk upload functionality to replace the database (with safety warnings).

| Export Data | Import Data |
| :---: | :---: |
| <img width="1092" height="753" alt="editor 6" src="https://github.com/user-attachments/assets/de328802-6b7c-46cb-8495-f6a7d5e389f0" />
 | <img width="1092" height="795" alt="editor 5" src="https://github.com/user-attachments/assets/37aa23df-9759-4502-9d3d-360a77e41129" />
 |

---

## 🛠️ Tech Stack

* **Framework:** [Next.js 14](https://nextjs.org/) (App Router)
* **Language:** [TypeScript](https://www.typescriptlang.org/)
* **Styling:** [Tailwind CSS](https://tailwindcss.com/)
* **Database:** [Firebase Firestore](https://firebase.google.com/)
* **Deployment:** Vercel

---

## 🚀 Getting Started

To run this project locally, follow these steps:

### 1. Clone the repository
```bash
git clone https://github.com/Stavan1234/tsa-songbook-editor.git
cd tsa-songbook-editor

```

### 2. Install Dependencies

```bash
npm install

```

### 3. Configure Firebase

Create a `.env.local` file in the root directory and add your Firebase configuration:

```env
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project_id.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id

```

### 4. Run the Development Server

```bash
npm run dev

```

Open [http://localhost:3000](https://www.google.com/search?q=http://localhost:3000) with your browser to see the result.

---

## 📂 Project Structure

```bash
app/
├── admin/
│   ├── export/      # JSON Export logic
│   ├── import/      # JSON Import logic
│   ├── songs/       # Song List & Create New Song
│   └── layout.tsx   # Admin Sidebar Layout
├── components/      # Reusable UI components
├── lib/             # Firebase configuration
└── page.tsx         # Landing Page

```

---

## 🛡️ License

This project is an internal tool for the **The Salvation Army** (Marathi) and is not intended for public distribution.

```
