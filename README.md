# ✈️ DISPATCH IO - Quick Start Guide

Selamat datang di AWQ OCC Dispatch Support System. Panduan singkat ini akan membantu Anda menguasai seluruh fitur utama hanya dalam hitungan menit.

---

## 1. 📊 FLIGHT BOARD (Pusat Kendali Utama)
Halaman ini adalah langkah pertama untuk memulai proses dispatch.
- **Daftar Penerbangan**: Pantau status real-time seluruh penerbangan (STD, STA, Reg, Route).
- **Multi-Selection**: Klik pada baris penerbangan untuk memilih satu atau lebih flight yang akan dianalisis.
- **Flight Detail**: Lihat rincian rute, beban (payload), dan informasi teknis lainnya pada panel yang tersedia.

## 2. 🔍 NOTAM ANALYSIS (Analisis Keselamatan)
Gunakan halaman ini untuk mendeteksi bahaya operasional di bandara rute Anda.
- **Dynamic Ops Window**: Sistem secara otomatis menghitung jendela waktu operasional berdasarkan STD/STA (termasuk skenario RTB).
- **Auto-Categorization**: NOTAM dikelompokkan secara cerdas (ALERT, NAVAID, FACILITY, dll).
- **Gap Detection**: Mendeteksi jika ada celah waktu (gap) di mana bandara tidak ter-cover oleh flight manapun (ditandai dengan badge ⚠️).
- **Critical Alerts**: NOTAM penutupan (CLOSURE) atau kerusakan alat navigasi kritis (ILS/RWY) akan disorot dengan warna Merah/Kuning.

## 3. 📝 RELEASE COMPILER (Penyusunan Briefing)
Halaman untuk merangkum hasil analisis menjadi dokumen briefing akhir.
- **Summary Generator**: Mengumpulkan NOTAM dan cuaca yang telah dipilih untuk dimasukkan ke dalam Flight Release.
- **Preview & Copy**: Lihat draf akhir briefing dan salin langsung ke sistem OFP atau kirim ke kru pesawat.

## 4. 🗺️ ROUTE MANAGER (Manajemen Profil Rute)
Pusat penyimpanan database rute yang telah disetujui.
- **Quick Filters**: Gunakan tombol filter cepat (WIII, WADD, WMKK, YPPH, dll) untuk mencari rute spesifik.
- **New Profile**: Tambahkan rute baru lengkap dengan SID/STAR dan waypoint routing.
- **Edit/Delete**: Perbarui data routing jika ada perubahan navigasi permanen (AIP Supplement).

## 5. 🌦️ TAF MANAGER (Analisis Cuaca)
Pantau kondisi meteorologi di bandara keberangkatan, tujuan, dan alternatif.
- **Live METAR/TAF**: Sinkronisasi data cuaca terbaru dari server meteorologi.
- **Weather Highlights**: Kata kunci cuaca signifikan (TS, FG, DZ, dll) akan disorot untuk mempercepat pengambilan keputusan.

## 6. 🔄 UPDATE NOTAM (Sinkronisasi Database)
Pastikan data Anda selalu yang paling mutakhir.
- **Sync Database**: Tekan tombol Sync untuk mengambil data NOTAM terbaru dari pusat data global.
- **Last Update Info**: Pantau kapan terakhir kali database diperbarui untuk memastikan validitas data.

---

### 💡 Tips Cepat:
- **Dark/Light Mode**: Gunakan ikon 🌓 di kanan atas untuk kenyamanan mata Anda.
- **External Links**: Klik menu **LINKS** untuk akses cepat ke FR24, Aviation Weather, BMKG, dan VAAC Darwin.
- **UTC Clock**: Jam di bagian atas selalu merujuk pada **Zulu Time (UTC)** untuk sinkronisasi operasi penerbangan internasional.






#  AWQ-DISPATCH SYSTEM UPDATE LOG - v2.5.0

This document summarizes the recent architectural and visual upgrades to the DISPATCH IO platform.

## 🎨 "Glass Cockpit" Visual Overhaul (v2.5.0)
*   **Flight Board**:
    *   Added **Quick-Stats Bar** for real-time monitoring of board state and ATC sync.
    *   Implemented **Row Status Accents** using CSS `:has()` for instant ATC readiness visibility.
    *   Refined **Compact Mode** for ultra-dense data monitoring on large displays.
*   **Release Compiler**:
    *   Transitioned to a **Split-Panel Layout** with a persistent briefing context sidebar.
    *   Enhanced terminal diagnostics with higher contrast and refined animation speeds.
*   **Route Registry**:
    *   Implemented **Sticky Headers** for improved navigation in long registries.
    *   Added **Quick-Filter Chips** for one-click station hub filtering.
*   **TAF Manager**:
    *   Converted legacy table to a modern **Responsive Card-Grid**.
    *   Introduced **Freshness Badges** with automatic age-calculation logic.

## 🎨 UI & Theme System (v2.4.2)
*   **Light Mode Optimization**: Standardized CSS variables in `Index.html` to ensure 100% readability across themes.
*   **Navigation Upgrade**: Implemented Glassmorphism effects with refined pill-style active tabs.
*   **Brand Styling**: Dynamic contrast adjustment for brand logos and system heartbeat indicators.

## 🚀 Release Compiler (CBR Engine)
*   **Visual Overhaul**: Terminal window now features a sunken glass effect with diagnostic scanlines.
*   **Error Handling**: Added `try...catch` safety for `localStorage` parsing, ensuring the app remains stable even with invalid data states.
*   **Action UI**: Standardized primary action buttons with high-contrast accents.

## 🧠 NOTAM Analysis Engine (V6.2 PROD)
*   **Full Spectrum Visibility**: The engine no longer filters out non-impacted NOTAMs; instead, it categorizes them by operational state.
*   **Status Logic**: New status classification system (IMPACTED, NOT IN WINDOW, FUTURE, EXPIRED).
*   **Intelligent Sorting**: Implemented `SortScore` logic to bubble up critical impacts.

---
*CRAFTED by CIZ @ 2026-07-03*
