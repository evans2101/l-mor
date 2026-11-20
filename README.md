# L’MOR — Wear your own way.

Website konsep fashion responsif dengan katalog dan ruang coba manusia 3D. Seluruh aplikasi berjalan di browser, **tanpa database, akun, API key, atau backend**.

## Menjalankan

Gunakan Node.js 22.12+ dan npm.

```sh
npm ci
npm run dev
```

Buka URL yang ditampilkan Vite (default `http://localhost:5173`).

```sh
npm run build       # TypeScript + bundling produksi ke dist/
npm run preview     # preview hasil build
npm test            # state, varian, bag, harga dan integritas aset manusia
npx playwright install chromium
npm run test:e2e    # navigasi scroll, studio sampai cart, responsive dan aksesibilitas
```

## Halaman dan fitur

- **Beranda**: satu panggung tetap setinggi layar. Wheel/trackpad, swipe vertikal, Page Up/Down, atau tombol navigasi mengganti konten hero → studio → logo 3D di posisi yang sama dengan crossfade, blur halus, dan perubahan skala. Dokumen tidak bergulir. Tidak ada panel atau slogan perantara. Header mengikuti konten aktif dan tautan langsung `/#/?studio=1` serta `/#/?about=1` tetap bekerja. Konten nonaktif dibuat inert dan disembunyikan dari pembaca layar. Preferensi reduced motion memakai perpindahan instan.
- **5D Studio**: baju + celana sekaligus, kategori dan warna, ukuran masing-masing produk, model male/female, enam skin tone, tinggi 140–205 cm dan berat 40–130 kg. Daftar produk dan kontrol fitting bergulir di dalam panel; pada mobile, produk dapat digeser horizontal dan area studio dapat digulir tanpa memindahkan dokumen. Gesture di tengah panel tidak mengganti bab. Beri jeda lalu gulir di batas panel atau gunakan navigasi bab untuk melanjutkan. Model dapat diputar dengan drag/tombol panah, dilihat dari tiga sisi, diperbesar, atau diputar otomatis. Tersedia reset, lookbook maksimal 12 look, dan belanja seluruh outfit.
- **Katalog** (`/#/catalog`): 12 produk contoh dengan foto asli, pencarian, kategori, filter model/harga/favorit, sortir harga/terbaru, muat lebih banyak, detail produk, pilihan warna/ukuran, panduan ukuran, coba di studio, dan tambah ke bag.
- **Bag** (`/#/cart`): varian warna/ukuran, jumlah, hapus, favorit, ringkasan biaya, progress gratis ongkir demo, kupon demo `LMOR10`, serta unduh ringkasan lokal.
- Menu mobile, navigasi keyboard, dialog native dengan focus trap/Escape, reduced motion, dan fallback ketika WebGL 2 tidak tersedia.

## Penyimpanan dan batas demo

Data produk ada di `src/data.ts`. State ada di `src/state.tsx` dan disimpan dengan key `lmor-studio-v1` di localStorage. Data hanya tersedia pada browser/perangkat yang sama, dapat hilang bila data situs dibersihkan, dan bukan inventaris atau penyimpanan pesanan. Aplikasi tetap bekerja dalam sesi saat localStorage tidak diizinkan.

“5D Studio” adalah nama pengalaman. Model manusia memakai mesh anatomis MakeHuman/HumanForge, tekstur kulit 2K, rambut bertekstur, rig skeletal, serta morph target gender/tinggi/berat. Wajah memiliki penyesuaian halus, pose santai, kedipan, napas, dan gerakan kepala. Ini render 3D realtime, bukan foto manusia.

**Foto katalog awal tetap dipertahankan.** Pakaian pada model menggunakan mesh 3D terpisah yang mengikuti perubahan tubuh, warna kain, dan detail berdasarkan referensi foto: grafis tangan pada kaos hitam, dasi, hood, serta lapel/ritsleting jaket. Geometri ini merupakan pendekatan visual; belum berupa scan produk atau pola jahit identik. Foto sampel tidak berubah mengikuti swatch warna yang dipilih.

Proporsi dari tinggi/berat adalah estimasi visual, bukan pengukuran tubuh presisi atau simulasi fisika kain. Ukuran XS–XXL digunakan sebagai varian bag; belum menyimulasikan kelonggaran berdasarkan ukuran.

Nama, material, harga, panduan ukuran, promo, dan biaya pengiriman merupakan sampel. Checkout belum memproses pesanan, alamat, pembayaran, atau pengiriman. Tombol checkout menampilkan penjelasan demo dan unduhan ringkasan, tanpa membuat transaksi.

## Struktur

```text
src/
  App.tsx                   Header, routing, katalog, bag, footer
  navigation.ts             Navigasi konten aktif dan sinkronisasi header
  smoothScroll.ts           Scroll katalog/bag dan scroll lock modal
  data.ts                   Produk, varian, default model
  state.tsx                 State lokal tervalidasi + perhitungan bag
  realisticHuman.ts         Pemetaan tubuh, material, pakaian, dan pose
  garmentDetails.ts         Detail pakaian yang mengikuti rig tubuh
  vendor/humanforge/        Runtime manusia berlisensi MIT
  components/
    ExperienceHome.tsx      Tiga konten dalam satu panggung tetap
    useSceneExperience.ts   Wheel, swipe, keyboard, blur/fade, dan cleanup
    LogoScene.tsx           Logo bevel silver 3D
    Avatar.tsx              Renderer, pencahayaan, pose, idle motion
    AvatarView.tsx          Lazy loading, intersection, error boundary
    Studio.tsx              Outfit, body controls, lookbook
    Product.tsx             Kartu, detail, swatch, panduan ukuran
    Dialog.tsx              Dialog modal aksesibel
  styles.css                Desain dark/silver dan breakpoint responsif
public/brand/               Simbol logo SVG, dipakai juga untuk geometri 3D
public/images/              Foto produk asli
public/human/               Mesh, tekstur, morph targets dan fitting proxies
```

Untuk mengganti koleksi, edit `src/data.ts` dan tambahkan foto di `public/images/`. Pemetaan produk ke mesh ada di `src/realisticHuman.ts`. Untuk produksi, ganti foto/detail/harga dan tambahkan integrasi checkout yang sesuai.

## Performa dan deployment

Model dan tekstur dimuat lazy serta dibagi melalui cache antarscene. Morph tubuh dihitung ketika kontrol berubah; mesh dasar dipakai ulang. Render dibatasi sekitar 30 fps dan dijeda ketika konten tidak aktif, offscreen, atau tab tidak aktif. Blur hanya digunakan selama perpindahan konten. Pixel ratio dibatasi 1.5, shadow map 1024 px. Reduced motion mematikan transisi blur dan idle motion serta memakai perpindahan konten langsung. Semua font, foto, dan aset model disajikan dari file lokal.

Runtime HumanForge dipin ke commit `2226df1f50a04c5a8e1c02ea33780d28337dfbb1`. Untuk menyiapkan ulang proxy pakaian dari paket sumber yang disertakan:

```sh
python3 scripts/prepare-human-garments.py
```

Detail hood diturunkan dari aset GLB CC0 CharacterCreator; asal dan commit tercatat di `public/human/SOURCE.txt`. Script impor hood memerlukan file sumber `clothing_hoodie.glb`; hasil fitting sudah disertakan sehingga tidak perlu menjalankan script untuk build.

Deploy folder `dist/` ke hosting statis pilihanmu. `base: './'` dan hash routing mendukung subfolder maupun GitHub Pages tanpa rewrite server. Jalur halaman menggunakan `/#/...` agar reload langsung bekerja. Build tidak membutuhkan secrets atau environment variables.

Atribusi dan lisensi ada di [THIRD_PARTY_ASSETS.md](./THIRD_PARTY_ASSETS.md).
