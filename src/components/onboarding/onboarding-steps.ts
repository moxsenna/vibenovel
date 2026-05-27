export interface TourStep {
  /** Selector matched against `[data-tour-step="..."]`. */
  target: string | null
  title: string
  body: string
  icon: string
}

export const HOME_ONBOARDING_STEPS: TourStep[] = [
  {
    target: null,
    icon: 'auto_awesome',
    title: 'Selamat datang di VibeNovel',
    body: 'Kamu bisa mulai dari membuat proyek baru, lanjut menulis naskah, atau membuka pengaturan bantuan AI.'
  },
  {
    target: 'new-project',
    icon: 'add_circle',
    title: 'Mulai novel baru',
    body: 'Pilih kartu ini saat ingin membuat cerita dari nol, memakai blueprint genre, atau mengimpor naskah lama.'
  },
  {
    target: 'settings',
    icon: 'settings',
    title: 'Pengaturan bantuan AI',
    body: 'Masukkan API key di sini sebelum memakai fitur bantuan AI. Kuncinya tetap tersimpan lokal di browser.'
  }
]

export const WORKSPACE_ONBOARDING_STEPS = {
  brainstorm: [
    {
      target: 'canvas-brainstorm',
      icon: 'psychology_alt',
      title: 'Ide Cerita',
      body: 'Di sini kamu merapikan premis, tokoh, konflik, dan arah ending lewat obrolan dengan Co-Author.'
    },
    {
      target: 'context-panel',
      icon: 'explore',
      title: 'Kompas Cerita',
      body: 'Panel samping menyimpan bagian penting cerita. Kalau panel sedang tertutup, buka lewat ikon menu di header.'
    },
    {
      target: 'menu-pintas',
      icon: 'bolt',
      title: 'Menu Pintas',
      body: 'Pakai ini untuk lompat ke fitur penting tanpa mencari tombol satu per satu.'
    }
  ],
  outline: [
    {
      target: 'canvas-outline',
      icon: 'format_list_numbered',
      title: 'Rencana Bab',
      body: 'Bagian ini membantu menyusun arah tiap bab sebelum kamu masuk ke penulisan naskah.'
    },
    {
      target: 'context-panel',
      icon: 'library_books',
      title: 'Catatan cerita',
      body: 'Tokoh, barang penting, aturan dunia, dan suara cerita tetap terlihat sebagai pegangan saat merancang bab.'
    },
    {
      target: 'menu-pintas',
      icon: 'bolt',
      title: 'Menu Pintas',
      body: 'Buka cepat Naskah, Ide Cerita, Pengaturan, atau aksi lain dari satu tempat.'
    }
  ],
  write: [
    {
      target: 'canvas-write',
      icon: 'history_edu',
      title: 'Naskah',
      body: 'Ini meja menulismu. Kamu bisa menulis bebas, memakai rencana bab, atau meminta AI membantu membuat adegan.'
    },
    {
      target: 'workspace-panel-toggle',
      icon: 'view_sidebar',
      title: 'Panel catatan',
      body: 'Gunakan tombol ini saat ingin melihat rencana bab, state tokoh, atau catatan cerita sambil menulis.'
    },
    {
      target: 'menu-pintas',
      icon: 'bolt',
      title: 'Menu Pintas',
      body: 'Saat ingin pindah mode tanpa kehilangan fokus, buka Menu Pintas dari header.'
    }
  ],
  review: [
    {
      target: 'canvas-review',
      icon: 'fact_check',
      title: 'Cek Cerita',
      body: 'Di sini kamu memeriksa lubang plot, konsistensi, alur emosi, dan catatan revisi sebelum lanjut.'
    },
    {
      target: 'context-panel',
      icon: 'radar',
      title: 'Radar cerita',
      body: 'Panel samping menampilkan ringkasan masalah dan petunjuk agar revisi terasa lebih terarah.'
    },
    {
      target: 'menu-pintas',
      icon: 'bolt',
      title: 'Menu Pintas',
      body: 'Gunakan Menu Pintas untuk kembali ke Naskah atau membuka Pengaturan kapan saja.'
    }
  ],
  visualize: [
    {
      target: 'canvas-visualize',
      icon: 'hub',
      title: 'Peta Cerita',
      body: 'Bagian ini memberi pandangan besar: emosi, timeline, hubungan, dan statistik naskah.'
    },
    {
      target: 'mode-switcher',
      icon: 'tabs',
      title: 'Pindah ruang kerja',
      body: 'Saat butuh kembali menulis atau merancang bab, pilih mode lain dari tab ruang kerja.'
    },
    {
      target: 'menu-pintas',
      icon: 'bolt',
      title: 'Menu Pintas',
      body: 'Semua perpindahan penting tetap bisa dicari dari satu tombol cepat.'
    }
  ]
} as const satisfies Record<string, readonly TourStep[]>
