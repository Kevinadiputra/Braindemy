// lib/gemini.ts

export interface RoadmapNode {
  id: string;
  title: string;
  shortDesc: string;
  iconType: 'rocket' | 'brain' | 'lightbulb' | 'code' | 'book' | 'star' | 'compass' | 'microscope';
}

export interface RoadmapData {
  title: string;
  description: string;
  difficulty: string;
  duration: string;
  nodes: RoadmapNode[];
}

export interface QuizQuestion {
  question: string;
  options: string[];
  correctAnswerIndex: number;
  explanation: string;
  hint: string;
}

export interface StudyMaterial {
  content: string;
  keyPoints: string[];
  quiz: QuizQuestion[];
}

// Helper to get Gemini API Key
export function getApiKey(): string {
  if (typeof window !== 'undefined') {
    const localKey = localStorage.getItem('braindemy_gemini_api_key');
    if (localKey) return localKey;
  }
  return process.env.NEXT_PUBLIC_GEMINI_API_KEY || '';
}

// Helper to make fetch calls to Gemini
async function callGemini(systemPrompt: string, userPrompt: string): Promise<string> {
  const apiKey = getApiKey();
  if (!apiKey) {
    throw new Error('API Key Gemini tidak ditemukan. Silakan atur API Key di Pengaturan.');
  }

  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash:generateContent?key=${apiKey}`;

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      contents: [
        {
          role: 'user',
          parts: [{ text: userPrompt }]
        }
      ],
      systemInstruction: {
        parts: [{ text: systemPrompt }]
      },
      generationConfig: {
        responseMimeType: 'application/json',
        temperature: 0.7,
      }
    })
  });

  if (!response.ok) {
    const errData = await response.json().catch(() => ({}));
    const message = errData?.error?.message || `HTTP error! status: ${response.status}`;
    throw new Error(`Gemini API Error: ${message}`);
  }

  const data = await response.json();
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) {
    throw new Error('Format respon Gemini kosong.');
  }

  return text;
}

// Generate Roadmap
export async function generateRoadmap(topic: string, isKidMode: boolean): Promise<RoadmapData> {
  const modeText = isKidMode ? 'Anak SD (Sekolah Dasar) yang berumur 7-12 tahun' : 'Mahasiswa (Perguruan Tinggi) yang membutuhkan materi mendalam';
  
  const systemPrompt = `Anda adalah kurator edukasi pintar bernama Braindemy. Tugas Anda adalah membuat kurikulum / roadmap belajar terstruktur dalam format JSON.
Tingkat audiens: ${modeText}.
Gunakan Bahasa Indonesia yang ramah, informatif, dan relevan dengan audiens (banyak emoji untuk anak SD, lebih akademis dan rapi untuk mahasiswa).

Anda HARUS mengembalikan data dalam format JSON murni dengan skema berikut:
{
  "title": "Judul Roadmap (misal: Mengenal Tata Surya atau Struktur Data Dasar)",
  "description": "Deskripsi singkat dan menarik tentang apa yang akan dipelajari",
  "difficulty": "Tingkat Kesulitan (Mudah / Menengah / Sulit)",
  "duration": "Estimasi waktu belajar (misal: 2 Minggu atau 5 Hari)",
  "nodes": [
    {
      "id": "node-1",
      "title": "Nama Subtopik Langkah Pertama",
      "shortDesc": "Deskripsi super singkat (maksimal 10 kata)",
      "iconType": "Pilih salah satu dari: rocket, brain, lightbulb, code, book, star, compass, microscope"
    }
  ]
}

Ketentuan:
- Jumlah nodes: 4 - 6 langkah.
- Urutan nodes harus logis dari dasar ke tingkat lanjut.
- Jangan berikan teks pembuka atau penutup, kembalikan hanya string JSON murni.`;

  const userPrompt = `Buatlah roadmap belajar untuk topik: "${topic}"`;
  
  const jsonText = await callGemini(systemPrompt, userPrompt);
  return JSON.parse(jsonText) as RoadmapData;
}

// Generate Content and Quiz for a selected Node
export async function generateMaterial(
  topic: string,
  nodeTitle: string,
  nodeDesc: string,
  isKidMode: boolean
): Promise<StudyMaterial> {
  const modeText = isKidMode ? 'Anak SD (Sekolah Dasar)' : 'Mahasiswa Perguruan Tinggi';
  
  const systemPrompt = `Anda adalah ahli edukasi pintar di Braindemy. Tugas Anda adalah membuat materi pembelajaran lengkap dan 3 soal latihan terkait subtopik "${nodeTitle}" dari topik utama "${topic}".
Tingkat audiens: ${modeText}.

Persyaratan Kebersihan & Kerapian Output (WAJIB):
- Gunakan spasi kosong ganda (dua kali enter / \n\n) di antara setiap paragraf, daftar poin, dan sub-heading agar tampilan tidak padat/menumpuk.
- JANGAN gunakan heading level 1 (#) atau level 2 (##). Gunakan heading level 3 (###) untuk sub-judul agar ukuran teks seimbang dan tidak merusak layout.
- Pastikan kalimat memiliki panjang yang nyaman (maksimal 3 kalimat per paragraf untuk anak SD, maksimal 5 kalimat untuk mahasiswa).
- JANGAN menyisipkan nomor urut atau huruf pilihan (misal: "A.", "1.") di dalam string array "options". Opsi jawaban harus berisi teks murni saja.
- Tulis penjelasan jawaban (explanation) dengan ramah, menjelaskan mengapa opsi tersebut benar secara singkat dan padat.

Persyaratan Konten:
1. Jika Anak SD (Kid Mode):
   - Gunakan bahasa Indonesia yang super ceria, hangat, penuh visualisasi imajinatif (e.g. bayangkan jika air itu seperti...).
   - Banyak emoji, penjelasan yang sangat ringkas, dan konsep-konsep abstrak dianalogikan ke kehidupan sehari-hari anak.
   - Panjang materi: sekitar 200-250 kata.
   - Berikan 3 soal latihan pilihan ganda yang seru, ramah anak, dan mudah dipahami.
2. Jika Mahasiswa (Scholar Mode):
   - Gunakan bahasa akademik yang jelas, ringkas, profesional, dan mendalam.
   - Sediakan terperinci: konsep kunci, cara kerja, contoh kasus nyata, dan rumus/sintaks jika relevan.
   - Panjang materi: sekitar 450-600 kata menggunakan struktur markdown yang rapi (headings, bullet points, code block, dll).
   - Berikan 3 soal latihan pilihan ganda tingkat analitis / kritis dengan penjelasan akademis terperinci.

Anda HARUS mengembalikan data dalam format JSON murni dengan skema berikut:
{
  "content": "Materi lengkap dalam format Markdown (gunakan h3 / ###, strong, blockquote, bullet points, code blocks jika relevan)",
  "keyPoints": [
    "Poin penting 1 (maksimal 15 kata)",
    "Poin penting 2 (maksimal 15 kata)",
    "Poin penting 3 (maksimal 15 kata)"
  ],
  "quiz": [
    {
      "question": "Pertanyaan kuis pertama?",
      "options": ["Teks Opsi Pertama", "Teks Opsi Kedua", "Teks Opsi Ketiga", "Teks Opsi Keempat"],
      "correctAnswerIndex": 0,
      "explanation": "Penjelasan singkat mengapa opsi tersebut benar.",
      "hint": "Petunjuk singkat berupa satu kalimat untuk membantu memandu cara berpikir siswa (jangan berikan jawabannya)."
    }
  ]
}

Ketentuan:
- Jumlah soal quiz HARUS tepat 3 soal.
- Pilihan jawaban (options) HARUS tepat 4 opsi.
- correctAnswerIndex dimulai dari 0 sampai 3.
- Jangan berikan teks pembuka atau penutup di luar JSON.`;

  const userPrompt = `Buatkan materi belajar dan 3 latihan soal untuk subtopik: "${nodeTitle}" (Deskripsi: ${nodeDesc}) dari topik utama: "${topic}"`;
  
  const jsonText = await callGemini(systemPrompt, userPrompt);
  return JSON.parse(jsonText) as StudyMaterial;
}
