# L’MOR — Wear your own way.

Website konsep fashion responsif dengan katalog dan ruang coba avatar 3D. Seluruh aplikasi berjalan di browser, **tanpa database, akun, API key, atau backend**.

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
npm test            # validasi state, varian, bag, dan perhitungan harga
npx playwright install chromium
npm run test:e2e    # alur browser, perubahan visual avatar mobile, aksesibilitas, dan ukuran layar
```

## Halaman dan fitur

- **Beranda**: hero dengan maskot 3D melambaikan tangan, 5D Studio interaktif, serta logo animasi.
- **5D Studio**: baju + celana sekaligus, kategori dan warna, ukuran masing-masing produk, model male/female, enam skin tone, tinggi 140–205 cm dan berat 40–130 kg. Pada mobile, pilihan produk dapat digeser secara horizontal. Avatar dapat diputar dengan drag/tombol panah, dilihat dari tiga sisi, diperbesar, atau diputar otomatis. Reset, lookbook maksimal 12 look, dan belanja seluruh outfit tersedia.
- **Katalog** (`/#/catalog`): 12 produk contoh, pencarian, kategori, filter model/harga/favorit, sortir harga/terbaru, muat lebih banyak, detail produk, pilihan warna/ukuran, panduan ukuran, coba di studio, dan tambah ke bag.
- **Bag** (`/#/cart`): varian warna/ukuran, jumlah, hapus, favorit, ringkasan biaya, progress gratis ongkir demo, kupon demo `LMOR10`, serta unduh ringkasan lokal.
- Menu mobile, navigasi keyboard, dialog native dengan focus trap/Escape, reduced motion, dan fallback ketika WebGL 2 tidak tersedia.

## Penyimpanan dan batas demo

Data produk ada di `src/data.ts`. State ada di `src/state.tsx` dan disimpan dengan key `lmor-studio-v1` di localStorage. Data hanya tersedia pada browser/perangkat yang sama, dapat hilang bila data situs dibersihkan, dan bukan inventaris atau penyimpanan pesanan. Aplikasi tetap bekerja dalam sesi saat localStorage tidak diizinkan.

“5D Studio” adalah nama pengalaman. Renderer-nya adalah **avatar 3D bergaya ilustratif menggunakan Three.js**, dibuat dari geometri lokal. Tinggi/berat mengubah proporsi dengan pendekatan visual. Siluet baju dan celana mengikuti kategori, bukan rekonstruksi akurat dari foto. Pemilihan ukuran digunakan untuk varian bag; belum mengubah simulasi kelonggaran kain. Tidak ada pemindaian tubuh, rekomendasi ukuran medis, atau simulasi fisika kain.

Foto, nama, material, harga, panduan ukuran, promo, dan biaya pengiriman merupakan sampel. Checkout **belum** memproses pesanan, alamat, pembayaran, atau pengiriman. Tombol checkout menampilkan penjelasan demo dan unduhan ringkasan, tanpa membuat transaksi.

## Struktur

```text
src/
  App.tsx                   Beranda, katalog, bag, navigasi, footer
  data.ts                   Produk, varian, default avatar
  state.tsx                 State lokal tervalidasi + perhitungan bag
  components/
    Avatar.tsx              Renderer dan model 3D prosedural
    AvatarView.tsx          Lazy loading, intersection, error boundary
    Studio.tsx              Outfit, body controls, lookbook
    Product.tsx             Kartu, detail, swatch, panduan ukuran
    Dialog.tsx              Dialog modal aksesibel
  styles.css                Gaya dan breakpoint responsif
public/images/              Foto sampel lokal
```

Untuk mengganti koleksi, edit `src/data.ts` dan tambahkan foto di `public/images/`. Tipe garment menentukan bentuk dasar avatar (`tee`, `shirt`, `hoodie`, `jacket`, `trousers`, `denim`, `cargo`, `shorts`). Untuk produksi, ganti foto/detail/harga dan tambahkan integrasi checkout yang sesuai.

## Performa dan deployment

Avatar dimuat secara lazy, geometri hanya dibangun ulang saat jenis pakaian/model berubah, dan perubahan proporsi diperhalus tanpa membangun ulang scene. Render dibatasi sekitar 30 fps, dijeda ketika offscreen/tab tidak aktif, serta hanya menggambar ulang studio saat perlu. Pixel ratio dibatasi 1.5 dan bayangan kontak statis menggantikan shadow map dinamis. Font dan foto disajikan dari aset lokal.

Deploy folder `dist/` ke hosting statis pilihanmu. `base: './'` dan hash routing mendukung subfolder maupun GitHub Pages tanpa rewrite server. Semua jalur halaman menggunakan `/#/...` agar reload langsung tetap bekerja. Build tidak membutuhkan secrets atau environment variables.

Atribusi aset dan lisensi ada di [THIRD_PARTY_ASSETS.md](./THIRD_PARTY_ASSETS.md).
