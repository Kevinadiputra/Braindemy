# 🧠 Braindemy — Peta Belajar Personal Berbasis AI

**Braindemy** adalah platform edukasi pintar (EdTech) berbasis web yang dirancang untuk membantu pengguna memetakan dan menguasai materi apa pun secara personal. Dengan memanfaatkan **Gemini 3.5 Flash API**, Braindemy menghasilkan peta belajar (*roadmap*) terstruktur, materi interaktif, dan kuis latih-tanding otomatis yang disesuaikan secara khusus dengan kelompok usia pengguna.

---

## ✨ Fitur Utama

### 👥 1. Mode Belajar Ganda (Dual-Mode UI)
* **Kids Mode (SD)**: UI yang penuh warna, ilustrasi mascot ceria (kucing & robot), efek suara game retro, penjelasan beranalogi sederhana, dan hadiah bintang/lencana digital.
* **Scholar Mode (Mahasiswa)**: Desain *cyberpunk-dark* yang bersih, berfokus pada efisiensi riset, visualisasi core akademik, penjelasan materi mendalam, serta metrik performa formal.

### 🗺️ 2. Generator Roadmap Instan
* Pengguna cukup memasukkan topik belajar apa saja (contoh: *Tata Surya*, *Struktur Data*, *Machine Learning*).
* AI secara dinamis merakit kurikulum terstruktur (4 - 6 subtopik/nodes) dari konsep dasar hingga lanjut dalam format JSON.

### 📝 3. Materi & Kuis Interaktif
* Penulisan materi belajar instan dengan poin-poin kunci terarah untuk mempermudah pemahaman.
* 3 kuis pilihan ganda per subtopik dengan kalkulasi XP dan penjelasan kunci jawaban yang mendalam.

### 🎮 4. Gamifikasi & Statistik
* **Sistem Level & XP**: Dapatkan poin pengalaman setiap kali menyelesaikan kuis.
* **Daily Streak Tracker**: Melatih disiplin belajar harian dengan pelacakan beruntun.
* **Lencana Prestasi (Badges)**: Klaim *achievements* setelah menyelesaikan misi pembelajaran tertentu.

---

## 🛠️ Tech Stack

* **Frontend Framework**: Next.js 16 (App Router) & React 19
* **Styling**: Tailwind CSS v4 & Lucide React Icons
* **Database & Auth**: Supabase (JS Client SDK)
* **AI Core**: Google Gemini 3.5 Flash (via API)
* **Language**: TypeScript

---

## 📁 Struktur Direktori

```text
├── public/                 # Aset gambar, audio, dan favicon
├── src/
│   ├── app/                # Halaman Next.js (App Router)
│   │   ├── dashboard/      # Panel utama & input topik belajar
│   │   ├── roadmap/        # Tampilan pohon belajar / node kurikulum
│   │   ├── material/       # Tempat membaca materi & menjawab kuis
│   │   ├── login/          # Autentikasi Supabase
│   │   └── onboarding/     # Setup profil awal & pemilihan mode (SD/Mahasiswa)
│   ├── components/         # Komponen UI modular (Mascot, Confetti, Header, dll)
│   └── lib/
│       ├── gemini.ts       # Integrasi & parsing schema JSON dari Gemini API
│       └── supabase.ts     # Konfigurasi Supabase Client
├── schema.sql              # Struktur database (DDL) untuk Supabase SQL Editor
└── next.config.ts          # Konfigurasi proyek Next.js
```

---

## 🗄️ Arsitektur Database (Supabase)

Proyek ini menggunakan tabel-tabel berikut yang saling terhubung:
1. `profiles`: Menyimpan data profil user, role/mode belajar (`SD` atau `Mahasiswa`), serta metadata dari roadmap aktif yang sedang dipelajari.
2. `progress`: Melacak status penyelesaian node pembelajaran (`locked`, `active`, `completed`).
3. `xp`: Mengelola level pengguna, akumulasi total XP, serta status *daily streak*.
4. `achievements`: Menyimpan koleksi lencana dan pencapaian yang telah dibuka oleh pengguna.

*Skema SQL lengkap dapat Anda lihat di file [schema.sql](./schema.sql).*

---

## 🚀 Panduan Instalasi & Penggunaan Lokal

### Prasyarat
* Node.js v18 atau v20 ke atas.
* Akun [Supabase](https://supabase.com) (Gratis).
* Google AI Studio Gemini API Key (Bisa didapatkan di [Google AI Studio](https://aistudio.google.com/)).

### Langkah 1: Kloning Repository
```bash
git clone https://github.com/USERNAME_ANDA/braindemy.git
cd braindemy
```

### Langkah 2: Instalasi Dependensi
```bash
npm install
```

### Langkah 3: Konfigurasi Environment Variables (`.env.local`)
Buat file bernama `.env.local` di direktori utama proyek, lalu isi nilai berikut:
```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
NEXT_PUBLIC_GEMINI_API_KEY=your-gemini-api-key
```

### Langkah 4: Setup Database Supabase
Salin seluruh kode dari file `schema.sql` dan jalankan di panel **SQL Editor** pada Dashboard proyek Supabase Anda. Ini akan secara otomatis membuat tabel-tabel yang diperlukan, mengaktifkan RLS (Row Level Security), dan memasang trigger untuk pembuatan profil otomatis saat registrasi.

### Langkah 5: Jalankan Server Lokal
```bash
npm run dev
```
Buka [http://localhost:3000](http://localhost:3000) di browser Anda untuk menjalankan aplikasi.

---

## 🤝 Kontribusi
Kontribusi, perbaikan *bug*, atau penambahan fitur baru selalu kami sambut dengan hangat! Silakan buat *pull request* atau buat *issue* baru untuk berdiskusi.
