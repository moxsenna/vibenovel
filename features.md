# Daftar Fitur & Penjelasan Teknis VibeNovel v2

Dokumen ini berisi daftar lengkap fitur yang telah diimplementasikan dalam **VibeNovel v2**, lengkap dengan penjelasan fungsional dan detail arsitektur teknisnya.

---

## 🧭 1. Story Compass (Fase Brainstorm)
Fitur untuk membantu penulis merancang fondasi cerita secara kokoh sebelum menulis outline maupun naskah prose.

*   **5 Elemen Utama Cerita**:
    *   *Premise*: Dasar premis cerita yang disepakati.
    *   *Protagonist*: Profil protagonis utama beserta *Voice DNA*.
    *   *Antagonist*: Profil antagonis atau konflik eksternal cerita.
    *   *Target Ending*: Tujuan akhir cerita sebagai jangkar penulisan.
    *   *Mystery Layer*: Lapisan misteri aktif beserta petunjuk (*breadcrumbs*) yang tersebar.
*   **Segmented Progress Bar & Gap Detector**:
    *   Menggunakan visual tracker 5 langkah yang interaktif di panel sisi (*Context Panel*).
    *   *Gap Detector* secara dinamis mendeteksi elemen mana yang belum diisi dan memberikan petunjuk visual berkedip (*pulsating gap indicator*) bertuliskan *"Yuk isi ini dulu!"*.
*   **Co-Author AI Chat**:
    *   Asisten AI interaktif menggunakan Gemini API untuk memandu brainstorming.
    *   **Anti-Melantur Guard**: Menghitung percakapan di luar topik penulisan. Jika mendeteksi percakapan melantur 3 kali berturut-turut, AI akan secara paksa merumuskan draf ringkasan untuk memfokuskan kembali alur.
*   **Approval Card System**:
    *   Rancangan entitas baru (karakter, item, world rule, ending, atau mystery) dari obrolan AI dikirimkan dalam format terstruktur XML `<DRAFT_DATA>`.
    *   Aplikasi merender kartu persetujuan (*Approval Card*). Jika disetujui, entitas tersebut akan langsung disimpan secara optimistik ke Zustand store dan disinkronkan ke database Supabase.

---

## 🗺️ 2. Season Architect & Outline Engine (Fase Outline)
Mesin pembuat outline bab yang terstruktur dan mematuhi kaidah penulisan drama KBM (KBM Retention Engine).

*   **Outline Generation Loop (Safeguarded)**:
    *   Mencegah pembuatan outline jika Story Compass belum lengkap (kecuali pengguna menggunakan bypass).
    *   **Sequential Await**: Outline dibuat bab-demi-bab secara sequensial di mana AI mengirimkan rangkuman bab sebelumnya ke bab berikutnya untuk mencegah AI mengalami amnesia plot.
    *   Mendukung penentuan jangkauan bab dinamis (*custom start/end generation*).
    *   **Emergency Stop**: Tombol pembatalan asinkron yang memanfaatkan `AbortSignal` untuk menghentikan proses pembuatan batch outline yang sedang berjalan.
*   **KBM Pacing & Pacing Validator**:
    *   Melakukan validasi otomatis pasca-pembuatan outline terhadap ritme cerita (*Emotional Rollercoaster*).
    *   Memberikan peringatan visual (*warning-only*) jika terdapat nada emosi yang monoton (misal: 3 bab berturut-turut tegang tanpa jeda nafas) atau cliffhanger yang kurang bervariasi.
*   **Deep Outline Mode**:
    *   Memanfaatkan model reasoning canggih (Gemini 2.0/3.0 dengan thinking budget) untuk menganalisis dan menempatkan petunjuk misteri secara logis, memilih transisi sub-arc cerita secara optimal, dan menghindari pemecahan konflik yang terlalu dini (*false resolution placement*).
*   **Outline Card Management**:
    *   Visualisasi outline bab menggunakan kartu expandable dari Framer Motion.
    *   Menampilkan status outline (✅ *generated*, 🔄 *current*, ⬜ *pending*), tone emosi, jenis cliffhanger, dan daftar adegan rinci.
    *   Fitur edit manual, penguncian outline (*Lock Outline*), regenerasi per bab, serta penghapusan bab.

---

## ✍️ 3. Prose Editor & Write Mode (Fase Write)
Kanvas menulis premium yang dirancang agar penulis bisa fokus menghasilkan tulisan berkualitas tinggi dengan bantuan AI yang terarah.

*   **Beat-by-Beat Prose Writer**:
    *   Penulisan prosa dipandu oleh adegan (*beat*) yang dipecah 1:1 dari `key_events` outline bab.
    *   Menyediakan editor teks interaktif per beat dengan integrasi *Notion-style SelectionToolbar*.
    *   Proses penulisan dibantu oleh streaming AI berbasis Server-Sent Events (SSE) yang memunculkan kata demi kata secara real-time.
*   **Free Write Mode**:
    *   Menyediakan kanvas kosong tanpa batasan beat atau panduan ketat bagi penulis yang ingin berekspresi secara bebas.
    *   **Sync Reindexing Watcher**: Saat beralih kembali dari Free Write ke Strict Mode, background watcher akan mendeteksi naskah yang belum terindeks oleh memori AI dan memunculkan panel Reindex Modal untuk melakukan sinkronisasi sekuensial.
*   **Offline Draft Fallback & Auto-Sync**:
    *   Menggunakan hook `useOfflineDraft` yang memantau status jaringan browser.
    *   Jika koneksi terputus saat menulis, draf prosa secara otomatis disimpan secara lokal di `localStorage` dengan penanda waktu.
    *   Saat browser terhubung kembali ke internet, sistem secara otomatis mensinkronisasi semua draf lokal ke Supabase dan membersihkan cache lokal setelah sukses disimpan.

---

## 🧠 4. AI Core Architecture & Memory System
Mesin utama di balik kecerdasan buatan VibeNovel v2 yang dirancang efisien dan aman.

*   **Gemini Multi-Key Pool**:
    *   Mengelola rotasi round-robin beberapa kunci API Gemini gratisan milik pengguna.
    *   Dilengkapi manajemen cooldown rate-limit (429) otomatis dan **BYOK (Bring Your Own Key) Guard** yang melarang keras pencatatan bagian mana pun dari kunci API di log konsol untuk menjaga keamanan.
*   **OpenRouter Unified Adapter**:
    *   Adapter yang menyatukan pemanggilan model premium dari OpenRouter (seperti Claude 3.5 Sonnet atau Deepseek) dengan struktur masukan-luaran yang sama dengan Gemini.
*   **Dynamic Task-Specialized Multi-Model Auto-Pilot Router**:
    *   Mengelola pemilihan model secara cerdas dan otomatis berdasarkan kompleksitas tugas.
    *   Memisahkan API key OpenRouter menjadi dua tingkat: *OpenRouter Free Key* (untuk model bebas hambatan seperti Nemotron / Llama / Gemini Free) dan *OpenRouter Paid Key* (untuk model kreatif premium seperti Claude 3.5 Sonnet / Deepseek Paid) untuk mencegah terkurasnya kredit berbayar untuk tugas otomatis.
    *   **Two-way Cross-provider Fallback**:
        - Jika Gemini Key Pool habis/rate-limit (429), sistem otomatis dialihkan ke OpenRouter Free model untuk menjaga kesinambungan background task atau outline.
        - Jika OpenRouter mengalami kegagalan API, sistem otomatis melakukan fallback kembali ke Gemini Pool gratisan.
    *   Menghadirkan opsi model prosa `'auto'` ("Rekomendasi Auto-Pilot") sebagai pilihan teratas Prose Model Choice dan kontrol Master Toggle Auto-Pilot di Settings Modal.
*   **Deep Think Mode (Streaming Reasoning)**:
    *   Menyediakan dua fase streaming yang memberikan ruang berpikir bagi model AI sebelum menghasilkan prosa naskah final.
    *   Thought tokens (hasil pemikiran AI) dirender secara langsung di antarmuka pengguna dalam panel collapsible terpisah, dan disaring secara ketat agar tidak ikut tersimpan ke dalam naskah bab.
*   **4-Layer Memory System**:
    *   *Layer 1 (Static Lorebook)*: Konstitusi narasi dan aturan cerita yang dipangkas kata kuncinya agar menghemat token.
    *   *Layer 2 (Dynamic State)*: Pelacakan kondisi 10-field karakter (Lokasi, Emosi, Fisik, Barang bawaan, Relasi, Rahasia, Tujuan aktif) secara dinamis dari bab sebelumnya.
    *   *Layer 3 (RAG Long-Term)*: Pencarian semantik ringkasan bab-bab sebelumnya menggunakan Supabase `pgvector` dan embedding `text-embedding-004`.
    *   *Layer 4 (Sliding Window)*: Penyertaan 500 kata terakhir bab sebelumnya untuk kesinambungan nada tulisan langsung.

---

## 🔍 5. Review Panel & Background AI Pipeline (Fase Review)
Fase pengecekan kualitas naskah dan ekstraksi informasi otomatis demi menjaga konsistensi cerita yang minim lubang plot (*plot hole*).

*   **Background AI Pipeline (Promise.allSettled)**:
    *   Ketika bab selesai ditulis dan beralih ke status `DRAFT`, sistem menjalankan empat tugas latar belakang secara paralel:
        1.  *State Snapshot Extraction*: Mengekstrak status karakter 10-field baru.
        2.  *Plot QA Radar*: Memindai adanya pelanggaran plot naskah.
        3.  *Lore Extraction*: Mendeteksi karakter atau item baru yang muncul di prosa.
        4.  *Chapter Summary & Embedding*: Membuat rangkuman naskah bab untuk memori jangka panjang (RAG).
*   **Plot Radar QA Scan**:
    *   Menilai naskah berdasarkan 4 kriteria QA kritis: *Plot Hole*, *Emotional Impact* (mendeteksi tulisan yang datar/membosankan), *Chekhov's Gun Tracker* (memantau benda/misteri yang belum diselesaikan), dan *Log Persistence*.
    *   Menampilkan hasil pemindaian di Review Panel dengan kartu keparahan warna kustom (*CRITICAL*, *WARNING*, *INFO*).
*   **Lore Extraction & LoreDiff Modal**:
    *   Entitas lore baru yang terdeteksi oleh AI pipeline tidak langsung masuk ke database, melainkan ditampilkan di modal interaktif *LoreDiff*.
    *   Penulis dapat meninjau, mengedit detail, menyetujui (*Approve*), atau menolak (*Reject*) entitas tersebut sebelum masuk ke dalam Lorebook proyek cerita.
*   **Thread Tracker Panel**:
    *   Panel visual untuk memantau status setiap utas plot (*plot threads*) dalam cerita.
    *   Utas plot diberi penanda status (*Planted*, *Active*, *Resolved*, *Abandoned*) serta indikator animasi berdenyut merah jika utas tersebut berstatus kritis/belum terselesaikan.

---

## 📊 6. Emotional Arc & Visualizations (Fase Visualize)
Panel visualisasi data premium untuk memberikan wawasan analitis kepada penulis mengenai struktur cerita mereka.

*   **Emotional Arc Heatmap**:
    *   Heatmap berbasis ubin dinamis yang memetakan status emosional per bab cerita (Conflict, Breather, Shock, Dopamine Beat, dll).
*   **Constellation Map**:
    *   Visualisasi grafik interaktif menggunakan pustaka D3.js (d3-force) yang menggambarkan jaring-jaring relasi antar karakter, item, dan aturan dunia. Dilengkapi dengan filter rentang bab dan fallback daftar list untuk tampilan mobile.
*   **Word Count Analytics**:
    *   Grafik analitis interaktif (ComposedChart Recharts) yang menampilkan statistik jumlah kata per bab dengan fitur navigasi cepat ke Workspace saat grafik diklik.
*   **Lifespan Timeline Tracker**:
    *   Bagan bar horisontal (Gantt-style) yang melacak masa hidup atau durasi aktifnya setiap utas plot (*plot thread*) dan misteri cerita dari bab awal hingga target resolusinya.

---

## 📱 7. Progressive Web App (PWA) & Platform
Optimasi performa agar VibeNovel v2 dapat diakses secara instan layaknya aplikasi native mobile.

*   **Offline Availability (Workbox)**:
    *   Menyimpan aset static utama, font eksternal Google Fonts, dan caching data Supabase REST API menggunakan service worker.
*   **PwaUpdatePrompt Toast**:
    *   Notifikasi toast melayang di kanan bawah layar untuk memberitahukan pengguna jika ada pembaruan versi aplikasi (*Reload to Update*) atau saat aplikasi siap digunakan secara offline.
*   **Capacitor Ready**:
    *   Arsitektur visual dan struktur build statis (`dist/`) dirancang bersih agar dapat langsung dibungkus menjadi aplikasi Android/iOS menggunakan Capacitor CLI tanpa modifikasi logic.
