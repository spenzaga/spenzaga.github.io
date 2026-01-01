# CBT Application for SMP Negeri 1 Purbalingga

Aplikasi Computer Based Test untuk SMP Negeri 1 Purbalingga dengan dukungan berbagai tipe soal.

## Fitur

- Login dengan NIS
- Konfirmasi data siswa
- Tipe soal: TF, MC, MR, TI, MG, SEQ, NUMG
- Timer dan navigasi soal
- Floating navigation button
- Fitur keamanan: anti screenshot, anti new tab, dll.
- Penyimpanan hasil ke Firebase
- Halaman hasil dengan review soal
- Efek konfeti untuk skor >=80%

## Setup

1. Pastikan Firebase config sudah benar.
2. Jalankan server lokal:
   ```
   python -m http.server 8000
   ```
3. Buka http://localhost:8000/index.html

## Struktur File

- index.html: Halaman login
- confirm.html: Konfirmasi data
- quiz.html: Halaman ujian
- results.html: Hasil dan review
- styles.css: Styling
- script.js: Logika aplikasi