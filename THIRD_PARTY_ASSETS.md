# Aset dan atribusi L’MOR

## Foto produk asli

Foto contoh lokal dari Unsplash tetap dipakai pada katalog, studio, detail, dan bag. Foto tidak menyatakan kepemilikan L’MOR, ketersediaan barang, atau hubungan dengan orang/merek dalam foto. Lisensi: [Unsplash License](https://unsplash.com/license), diakses 20 November 2026.

| File                             | URL sumber                                                   |
| -------------------------------- | ------------------------------------------------------------ |
| `public/images/tee-white.jpg`    | https://images.unsplash.com/photo-1521572163474-6864f9cf17ab |
| `public/images/tee-washed.jpg`   | https://images.unsplash.com/photo-1503341504253-dff4815485f1 |
| `public/images/shirt-sage.jpg`   | https://images.unsplash.com/photo-1598033129183-c4f50c736f10 |
| `public/images/shirt-oxford.jpg` | https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf |
| `public/images/hoodie.jpg`       | https://images.unsplash.com/photo-1556821840-3a63f95609a7    |
| `public/images/jacket.jpg`       | https://images.unsplash.com/photo-1551028719-00167b16eac5    |
| `public/images/trousers.jpg`     | https://images.unsplash.com/photo-1594633312681-425c7b97ccd1 |
| `public/images/denim.jpg`        | https://images.unsplash.com/photo-1542272604-787c3835535d    |
| `public/images/chino.jpg`        | https://images.unsplash.com/photo-1473966968600-fa801b869a1a |
| `public/images/denim-light.jpg`  | https://images.unsplash.com/photo-1541099649105-f69ad21f3246 |

## Model manusia dan pakaian

- Sumber: [HumanForge / MakeHuman](https://github.com/abdulrehman043/humanforge), commit `2226df1f50a04c5a8e1c02ea33780d28337dfbb1`.
- Runtime: **MIT**, salinan di `public/licenses/humanforge-MIT.txt`; kode di-vendor pada `src/vendor/humanforge`. Perubahan disposal dicatat pada NOTICE.md.
- Aset: **CC0 1.0**, seperti dinyatakan pada [LICENSE.ASSETS.md sumber](https://github.com/abdulrehman043/humanforge/blob/2226df1f50a04c5a8e1c02ea33780d28337dfbb1/LICENSE.ASSETS.md). Salinan lengkap ada pada `public/licenses/humanforge-assets-CC0.md`.
- [Penjelasan lisensi grafis MakeHuman](https://static.makehumancommunity.org/about/license.html).

`public/human` memuat body, morph targets, rig, kulit young male/female (Asian, African, Caucasian), mata brownlight, brows/lashes, teeth/tongue, rambut Short tousled dan Long sleek, sumber casual outfits, serta shoes02. Kredit pembuat rambut komunitas culturalibre dan asal setiap aset dipertahankan dalam LICENSE.ASSETS.md.

Pakaian dipisahkan dari outfit sumber menggunakan `scripts/prepare-human-garments.py`. UV, skin weights, dan referensi fitting dipertahankan agar mengikuti perubahan tubuh. Shader menerapkan warna/tekstur kain dan grafis kaos yang diambil dari foto contoh lokal. Dasi dan detail hardware/lapel dibuat secara prosedural. Bentuk pakaian merupakan pendekatan referensi foto, belum scan produk.

Komponen hood diturunkan dari `output/clothing_hoodie.glb` milik [CharacterCreator](https://github.com/kblood/CharacterCreator/tree/852e48f316b90a0937234886630e4fb4cdfd1f78), commit `852e48f316b90a0937234886630e4fb4cdfd1f78`. Aset GLB hasil generasi dinyatakan **CC0-1.0** pada [LICENSE-NOTES.md sumber](https://github.com/kblood/CharacterCreator/blob/852e48f316b90a0937234886630e4fb4cdfd1f78/LICENSE-NOTES.md), disalin utuh di `public/licenses/charactercreator-assets.md`. Tidak ada kode GPL CharacterCreator yang digunakan. Script fitting ditulis lokal, hasilnya `public/human/proxies/clothes-lmor_hood.glb.gz`.

## Font dan runtime

- Manrope dan Space Grotesk melalui Fontsource: SIL Open Font License.
- Helvetiker bold untuk logo 3D, didistribusikan bersama Three.js: notice asli di `public/licenses/three-fonts.txt`.
- Lucide: ISC. Three.js, React, React DOM, React Router, dan fflate: lisensi masing-masing disertakan di `public/licenses/`.
- Lenis: MIT, salinan di `public/licenses/lenis.txt`.
- GSAP dan ScrollTrigger: [GSAP Standard License](https://gsap.com/standard-license); notice di `public/licenses/gsap.txt`.

Logo teks L’MOR, favicon, layout, integrasi kontrol, pemetaan produk, styling wajah, pose, detail pakaian, dan choreography scroll dibuat untuk proyek ini. Konsep panggung scroll terinspirasi [Igloo Inc.](https://www.igloo.inc/); tidak memakai kode, logo, atau aset visual Igloo.
