"""Generate a deduplicated, explicitly unvalidated research bank; never public page content."""
import csv, hashlib, json, random, re, unicodedata, zipfile
from collections import Counter
from pathlib import Path

OUT=Path('outputs/lmor-seo-2026-11-20');OUT.mkdir(parents=True,exist_ok=True)
SEED=20261120
COLORS=['hitam','putih','navy','abu abu','krem','beige','cokelat','olive','sage','maroon','biru','biru muda','hijau','pastel','warna netral','earth tone','monokrom','dusty pink']
VALUES=['premium','harga terjangkau','kualitas premium','tampilan elegan','nyaman dipakai','desain minimalis','mudah dipadukan','premium terjangkau']
QUALITY=['nyaman dipakai','mudah dipadukan','terlihat rapi','cocok sehari hari','berkesan premium']
# Product and fit taxonomy. “demo” only means a category exists in the current mock catalog.
PRODUCTS=[
 ('kaos','polos|oversize|regular fit|relaxed fit|lengan pendek|minimalis','all',True,'daily'),
 ('kaos lengan panjang','polos|regular fit|relaxed fit|minimalis','all',False,'daily'),
 ('kaos polo','polos|regular fit|lengan pendek|minimalis|berkerah','all',False,'smart'),
 ('kemeja','polos|regular fit|relaxed fit|lengan panjang|lengan pendek|minimalis','all',True,'smart'),
 ('kemeja oxford','polos|regular fit|lengan panjang|minimalis','all',True,'smart'),
 ('kemeja linen','polos|relaxed fit|lengan panjang|lengan pendek|minimalis','all',True,'smart'),
 ('kemeja flanel','kotak kotak|regular fit|relaxed fit|lengan panjang','all',False,'daily'),
 ('hoodie','polos|oversize|regular fit|relaxed fit|minimalis','all',True,'layer'),
 ('sweater','polos|rajut|regular fit|relaxed fit|minimalis','all',False,'layer'),
 ('sweatshirt','polos|oversize|regular fit|relaxed fit|minimalis','all',False,'layer'),
 ('cardigan','polos|rajut|regular fit|relaxed fit|minimalis','all',False,'layer'),
 ('jaket','polos|regular fit|relaxed fit|minimalis|casual','all',True,'layer'),
 ('jaket denim','regular fit|relaxed fit|minimalis|casual','all',False,'layer'),
 ('jaket bomber','polos|regular fit|relaxed fit|minimalis','all',False,'layer'),
 ('rompi','polos|regular fit|relaxed fit|minimalis','all',False,'layer'),
 ('outer','polos|regular fit|relaxed fit|minimalis|casual','all',False,'layer'),
 ('celana panjang','regular fit|straight fit|relaxed fit|minimalis','all',True,'daily'),
 ('celana pendek','polos|regular fit|relaxed fit|minimalis','all',False,'daily'),
 ('celana chino','regular fit|straight fit|relaxed fit|minimalis','all',True,'smart'),
 ('celana cargo','regular fit|straight fit|relaxed fit|minimalis','all',True,'daily'),
 ('celana jeans','regular fit|straight fit|relaxed fit|wide leg','all',True,'daily'),
 ('celana jogger','polos|regular fit|relaxed fit|minimalis','all',True,'daily'),
 ('celana training','polos|regular fit|relaxed fit|minimalis','all',False,'daily'),
 ('celana kulot','polos|wide leg|relaxed fit|minimalis','female',False,'smart'),
 ('celana palazzo','polos|wide leg|relaxed fit|minimalis','female',False,'smart'),
 ('rok panjang','polos|plisket|a line|minimalis','female',False,'smart'),
 ('rok midi','polos|plisket|a line|minimalis','female',False,'smart'),
 ('dress kasual','polos|midi|maxi|lengan panjang|minimalis','female',False,'smart'),
 ('tunik','polos|regular fit|relaxed fit|lengan panjang|minimalis','female',False,'smart'),
 ('blus','polos|regular fit|relaxed fit|lengan panjang|minimalis','female',False,'smart'),
 ('setelan','polos|regular fit|relaxed fit|minimalis|casual','all',False,'daily'),
 ('baju basic','polos|regular fit|relaxed fit|minimalis','all',False,'daily'),
]
AUDIENCES=[
 ('umum',80000,'','all','adult'),('pria dewasa',70000,'pria','male','adult'),
 ('wanita dewasa',70000,'wanita','female','adult'),('anak muda',60000,'anak muda','all','adult'),
 ('remaja',45000,'remaja','all','teen'),('mahasiswa',35000,'mahasiswa','all','adult'),
 ('ayah',25000,'ayah','male','adult'),('ibu',25000,'ibu','female','adult'),
 ('orang tua',25000,'orang tua','all','senior'),('anak laki laki',25000,'anak laki-laki','male','child'),
 ('anak perempuan',25000,'anak perempuan','female','child'),('keluarga',15000,'keluarga','all','family')]
OCCASIONS={'daily':['sehari hari','jalan santai','akhir pekan','liburan','acara keluarga','traveling'],
 'smart':['acara keluarga','makan bersama','kerja santai','akhir pekan','acara semi formal','liburan'],
 'layer':['cuaca sejuk','jalan santai','perjalanan','liburan','akhir pekan','acara keluarga']}

seen=set(); rows=[]; priority=[]; stats=Counter(); by_product=Counter(); by_intent=Counter(); by_status=Counter()
normalize=lambda s:re.sub(r'[^a-z0-9]','',unicodedata.normalize('NFKC',s).casefold())
def status(age,demo):
 if age=='child':return 'butuh_koleksi_anak'
 if age=='family':return 'butuh_koleksi_keluarga'
 if age=='senior':return 'validasi_fit_senior'
 if age=='teen':return 'validasi_ukuran_remaja'
 return 'kategori_demo' if demo else 'rencana_koleksi'
def append(keyword,aud,product,intent,availability,topic,tier):
 keyword=re.sub(r'\s+',' ',keyword).strip()
 key=normalize(keyword)
 if key in seen or len(keyword.split())>14 or len(keyword)<4:return False
 if re.search(r'\b(\w+) \1\b',keyword):return False
 seen.add(key);row=[keyword,aud,product,intent,availability,topic,tier,'']
 rows.append(row);stats[aud]+=1;by_product[product]+=1;by_intent[intent]+=1;by_status[availability]+=1
 return True

# Short, editorially selected starting terms, not measured search-volume winners.
core=['lmor','brand lmor','lmor fashion','katalog lmor','koleksi lmor','kaos lmor','kemeja lmor','hoodie lmor','celana lmor',
 'fashion premium terjangkau','brand fashion premium harga terjangkau','baju premium harga terjangkau','pakaian premium terjangkau',
 'brand pakaian berkualitas harga terjangkau','baju casual pria','baju casual wanita','kaos premium pria','kaos premium wanita',
 'kaos oversize pria','kaos oversize wanita','kaos polos premium','kaos unisex premium','hoodie unisex','hoodie premium terjangkau',
 'kemeja pria premium','kemeja wanita premium','kemeja oxford pria','kemeja linen wanita','celana chino pria','celana cargo pria',
 'celana jeans wanita','celana jogger unisex','padu padan baju basic','cara memilih ukuran baju online','cara mengukur lingkar dada baju',
 'cara memilih celana sesuai ukuran','cara merawat kaos katun','cara memadukan kemeja dan celana','outfit rapi harga terjangkau',
 'outfit minimalis pria','outfit minimalis wanita','outfit kuliah sederhana','outfit kerja casual','outfit keluarga sederhana']
for term in core:
 append(term,'umum','brand' if 'lmor' in term or 'brand' in term else 'fashion','informasi' if term.startswith(('cara','padu')) else 'komersial','validasi_brand' if 'lmor' in term else 'butuh_koleksi_keluarga' if 'keluarga' in term else 'kategori_demo','identitas dan panduan','P1')
 priority.append(rows[-1])
for ai,(aud,quota,suffix,gender,age) in enumerate(AUDIENCES):
 rng=random.Random(SEED+ai);allowed=[p for p in PRODUCTS if gender!='male' or p[2]!='female']
 if age=='family':allowed=[p for p in allowed if p[0] in ['kaos','kemeja','hoodie','sweater','jaket','celana panjang','celana jeans','setelan','baju basic']]
 attempts=0
 while stats[aud]<quota:
  attempts+=1
  if attempts>quota*100:raise RuntimeError(f'Insufficient valid combinations: {aud}')
  product,styles,pgender,demo,group=allowed[rng.randrange(len(allowed))]
  style=rng.choice(styles.split('|'));color=rng.choice(COLORS);value=rng.choice(VALUES);occasion=rng.choice(OCCASIONS[group]);kind=rng.randrange(10)
  audience=suffix
  if aud=='mahasiswa' and pgender=='female':audience='mahasiswi'
  if age in ['teen','child','family'] and occasion in ['kerja santai','acara semi formal']:occasion='acara keluarga'
  item=' '.join(filter(None,[product,style,color,audience]))
  basic=' '.join(filter(None,[product,style,audience]))
  if kind==0:keyword=f'{basic} {value}';intent='komersial'
  elif kind==1:keyword=f'{item} {value}';intent='komersial'
  elif kind==2:keyword=f'{item} untuk {occasion}';intent='komersial'
  elif kind==3:keyword=f'harga {item} premium';intent='transaksional'
  elif kind==4:keyword=f'beli {item} harga terjangkau';intent='transaksional'
  elif kind==5:keyword=f'ide outfit {item} untuk {occasion}';intent='inspirasi'
  elif kind==6:keyword=f'cara memilih {basic} untuk {occasion}';intent='informasi'
  elif kind==7:keyword=f'padu padan {item} untuk {occasion}';intent='inspirasi'
  elif kind==8:keyword=f'{item} yang {rng.choice(QUALITY)}';intent='komersial'
  else:keyword=f'{basic} {value} untuk {occasion}';intent='komersial'
  if rng.random()<.05:keyword='lmor '+keyword
  tier='P2' if age=='adult' and demo and len(keyword.split())<=10 else 'P3'
  if append(keyword,aud,product,intent,status(age,demo),group,tier) and len(priority)<600:
   # Spread practical starting candidates across product/audience groups.
   if tier=='P2' and (by_product[product]<35 or rng.random()<.025):priority.append(rows[-1])

assert len(rows)==500000 and len(seen)==500000
# Priorities include all audience plans while retaining the short core terms first.
for aud,_,_,_,age in AUDIENCES:
 chosen=[r for r in rows if r[1]==aud and 5<=len(r[0].split())<=9]
 chosen.sort(key=lambda r:(r[6]!='P2',len(r[0]),r[0]))
 priority.extend(chosen[:25])
priority=list({normalize(r[0]):r for r in priority}.values())[:1000]
header=['keyword','audiens','kelompok_produk','niat_pencarian','status_koleksi','cluster','prioritas_editorial','volume_bulanan']
source=OUT/'source';source.mkdir(exist_ok=True)
with (source/'LMOR-500000-keywords.csv').open('w',encoding='utf-8-sig',newline='') as f:
 writer=csv.writer(f);writer.writerow(header);writer.writerows(rows)
with (source/'keywords-only.csv').open('w',encoding='utf-8',newline='') as f:
 writer=csv.writer(f);writer.writerow(['Keyword']);writer.writerows([[r[0]] for r in rows])
with (source/'prioritas.csv').open('w',encoding='utf-8-sig',newline='') as f:
 writer=csv.writer(f);writer.writerow(header);writer.writerows(priority)
manifest={'brand':'L’MOR','positioning':'Premium dengan harga terjangkau','date':'2026-11-20','seed':SEED,'count':len(rows),'unique_normalized':len(seen),'source':'Kandidat sintetis dari taksonomi produk/audiens, bukan data volume Google','volume_bulanan':None,'by_audience':dict(stats),'by_product':dict(by_product),'by_intent':dict(by_intent),'by_collection_status':dict(by_status),'priority_count':len(priority),'sha256_csv':hashlib.sha256((source/'LMOR-500000-keywords.csv').read_bytes()).hexdigest()}
(OUT/'manifest.json').write_text(json.dumps(manifest,ensure_ascii=False,indent=2))
(source/'priority.json').write_text(json.dumps(priority,ensure_ascii=False))
(source/'keywords.json').write_text(json.dumps([r[0] for r in rows],ensure_ascii=False))
notes='''L’MOR - BANK 500.000 KANDIDAT KEYWORD\n\nPosisi brand: premium dengan harga terjangkau.\n\nSemua keyword adalah ide riset yang dibuat secara kombinatorial dan dideduplikasi setelah normalisasi huruf, spasi, dan tanda baca. Belum ada verifikasi volume, CPC, persaingan, peringkat, atau konversi. Kolom volume sengaja kosong. P1 adalah istilah awal pilihan editorial; P2 kategori dewasa yang dekat dengan katalog demo; P3 long-tail atau pengembangan koleksi. Prioritas bukan skor Google.\n\nKatalog situs saat ini adalah demo dewasa. Anak, keluarga, remaja, dan senior memiliki status validasi terpisah. Jangan menjanjikan ukuran, stok, bahan, harga, atau layanan yang belum tersedia. Keyword bukan klaim bahwa produk sudah dijual.\n\nGunakan kelompok topik untuk merancang halaman/konten yang berguna. Jangan tempel daftar ini ke halaman, teks tersembunyi, meta keywords, atau otomatis membuat 500.000 halaman. Google tidak memakai meta keywords dan keyword stuffing melanggar kebijakan spam. Pilih sedikit target yang paling relevan, validasi dengan Keyword Planner dan Search Console, lalu tulis konten yang menjawab kebutuhan pembeli.\n\nSumber panduan: https://developers.google.com/search/docs/essentials/spam-policies\nhttps://developers.google.com/search/docs/crawling-indexing/special-tags\nhttps://developers.google.com/search/docs/fundamentals/creating-helpful-content\n\nStruktur saat ini memakai hash routing dan produk demo. Untuk SEO produksi, perlukan domain final, URL kategori/produk yang bisa diindeks tanpa fragmen hash, konten HTML yang dapat dirayapi, detail produk nyata, dan Search Console. Tidak ada jaminan peringkat satu.\n'''
(OUT/'PETUNJUK.txt').write_text(notes)
with zipfile.ZipFile(OUT/'LMOR-500000-keywords.zip','w',zipfile.ZIP_DEFLATED,compresslevel=9) as z:
 for file in [source/'LMOR-500000-keywords.csv',source/'prioritas.csv',OUT/'manifest.json',OUT/'PETUNJUK.txt']:z.write(file,file.name)
 guide=Path('research/seo/strategi-seo.txt')
 if guide.exists():z.write(guide,guide.name)
print(json.dumps({'count':len(rows),'unique':len(seen),'priorities':len(priority),'audiences':stats,'zip_mb':round((OUT/'LMOR-500000-keywords.zip').stat().st_size/1e6,2)},ensure_ascii=False))
