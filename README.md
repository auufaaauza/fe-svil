# SVIL Frontend — Next.js

UI siswa, guru dan admin; backend ada di ../be-svill. Panduan alur, akun lokal dan batas implementasi ada di [README utama](../README.md).

    npm install
    npm run dev

Buka http://127.0.0.1:3000. Laravel harus berjalan pada http://127.0.0.1:8000. API_BACKEND_URL pada .env.local dibaca oleh rewrites; browser menggunakan /api/v1 dan /sanctum pada origin frontend yang sama.

    npm test
    npm run build

Halaman /login dan /register publik. Registrasi hanya siswa dengan kode kelas. Workspace terpisah di /siswa, /guru, /admin beserta subhalamannya. Role dan izin data ditetapkan Laravel.

UI menggunakan Plus Jakarta Sans dan Poppins lokal, ikon/ilustrasi SVG bergerak, popup pilihan bertema dan loading sesi/route. Preferensi reduced motion perangkat dihormati.

Untuk Vercel: pilih Root Directory fe-svill, preset Next.js dan API_BACKEND_URL=https://api2.findmycareer.my.id sebelum build. Salin nilai frontend Vercel yang sebenarnya ke FRONTEND_URL dan SANCTUM_STATEFUL_DOMAINS backend. Jangan memasukkan password database atau APP_KEY ke environment frontend. Panduan cPanel di [README backend](../be-svill/README.md).

Build dan tes tidak menggantikan pemeriksaan visual/interaksi pada perangkat. Pemeriksaan browser otomatis masih diblokir pengaturan akses tersimpan.

Pembaca materi mendukung PDF inline dan slide PPTX privat melalui proxy API yang sama. PPTX mendukung teks, raster, bentuk dasar dan tabel sederhana; gunakan PDF untuk layout kompleks. Layar penuh, navigasi slide, transkrip teks dan unduh tersedia. Halaman detail konten berada di /guru/materi/{jenis}/{id} dan /admin/konten/{jenis}/{id}; detail murid di /guru/tinjauan/{id}.

Tab kelas/mapel, tugas/proyek, kuis banyak soal, buku nilai, roster/pengumuman, tindak lanjut dan pengumpulan penelitian sudah terhubung ke backend. Butir instrumen aktual dimasukkan admin dari peneliti, bukan data contoh.

Pengaturan akun dan Kabar berada di header. Tab Kalender/Progres di ruang belajar/laporan terhubung ke API; siswa juga dapat membuka riwayat kelas lama. Guru/admin mengatur video LKPD di detail konten dan media materi pada formulir materi. Video YouTube memakai pemutar tertanam setelah tombol putar ditekan; audio memakai tautan HTTPS dan kontrol bawaan browser.

Environment Vercel production: API_BACKEND_URL=https://api2.findmycareer.my.id. Nilai ini server-only. Rilis source dapat disiapkan melalui scripts/package-release.ps1; paket tidak berisi .env lokal, .next maupun node_modules. Pemeriksaan visual ponsel dan pengujian di domain hosting aktual tetap perlu dilakukan.
