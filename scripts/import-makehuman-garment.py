"""Import an attributed MakeHuman .mhclo + OBJ garment into the local fitting runtime.
Preserves barycentric fitting references and derives skeletal weights from the body.
Usage: python3 scripts/import-makehuman-garment.py /path/garment.mhclo lmor_top_hoodie
"""
import gzip,json,struct,sys
from pathlib import Path

def read_glb(path):
 raw=gzip.decompress(Path(path).read_bytes());n=struct.unpack_from('<I',raw,12)[0]
 j=json.loads(raw[20:20+n]);binary=raw[28+n:]
 def attribute(aid):
  a=j['accessors'][aid];v=j['bufferViews'][a['bufferView']]
  fmt,bs={5120:('b',1),5121:('B',1),5122:('h',2),5123:('H',2),5125:('I',4),5126:('f',4)}[a['componentType']]
  dim={'SCALAR':1,'VEC2':2,'VEC3':3,'VEC4':4,'MAT4':16}[a['type']]
  at=v.get('byteOffset',0)+a.get('byteOffset',0);stride=v.get('byteStride',bs*dim)
  rows=[struct.unpack_from('<'+fmt*dim,binary,at+i*stride) for i in range(a['count'])]
  if a.get('normalized'):
   maximum={5120:127,5121:255,5122:32767,5123:65535}.get(a['componentType'],1)
   rows=[tuple(max(-1,c/maximum) for c in row) for row in rows]
  return rows
 prim=j['meshes'][0]['primitives'][0]
 return {k:attribute(v) for k,v in prim['attributes'].items()}

def base_shape(m):
 raw=gzip.decompress(Path('public/human/shapes.bin.gz').read_bytes());n=m['vertexCount'];base=[[0,0,0] for _ in range(n)]
 for k in range(3):
  acc=0;at=m['shapes']['baseOffset']+k*n*2
  for i in range(n):
   acc=(acc+(raw[at+i]|raw[at+n+i]<<8))&65535
   base[i][k]=m['shapes']['baseMin'][k]+acc*m['shapes']['baseScale'][k]
 return base

def compact_ranges(vs):
 out=[]
 for n in sorted(set(vs)):
  if out and n==out[-1][1]+1:out[-1][1]=n
  else:out.append([n,n])
 return out

def main(mhclo, garment_id):
 root=mhclo.parent;m=json.loads(Path('public/human/manifest.json').read_text());base=base_shape(m)
 refs=[];hidden=[];scale=[[0,0,1],[0,0,1],[0,0,1]];meta={};mode=''
 for raw in mhclo.read_text(errors='replace').splitlines():
  p=raw.strip().split()
  if not p or p[0].startswith('#'):continue
  if p[0]=='verts':mode='verts';continue
  if p[0]=='delete_verts':mode='delete';continue
  if mode=='verts' and p[0].lstrip('-').isdigit():
   refs.append(list(map(float,p[:9])) if len(p)>=9 else [int(p[0])]*3+[1,0,0,0,0,0]);continue
  if mode=='delete' and p[0].isdigit():
   i=0
   while i<len(p):
    if i+2<len(p) and p[i+1]=='-':hidden.extend(range(int(p[i]),int(p[i+2])+1));i+=3
    else:hidden.append(int(p[i]));i+=1
   continue
  if p[0] in ['x_scale','y_scale','z_scale']:scale['xyz'.index(p[0][0])]=[int(p[1]),int(p[2]),float(p[3])*.1]
  else:meta[p[0]]=' '.join(p[1:])
 obj=root/meta['obj_file'];uvs=[];faces=[]
 for raw in obj.read_text(errors='replace').splitlines():
  p=raw.split()
  if not p:continue
  if p[0]=='vt':uvs.append([float(p[1]),1-float(p[2])])
  if p[0]=='f':
   face=[tuple(int(x)-1 if x else -1 for x in token.split('/')) for token in p[1:]]
   for i in range(1,len(face)-1):faces.extend([face[0],face[i],face[i+1]])
 body=read_glb('public/human/body.glb.gz');weights={}
 for i,(mh,) in enumerate(body['_MH']):weights[int(mh)]=list(zip(body['JOINTS_0'][i],body['WEIGHTS_0'][i]))
 axis=[abs(base[int(a)][k]-base[int(b)][k])/d if d else 1 for k,(a,b,d) in enumerate(scale)]
 attrs={k:[] for k in ['POSITION','TEXCOORD_0','_REFS','_REFW','_OFFS','_JOINTS','_WEIGHTS']};indices=[];lookup={}
 for f in faces:
  key=f[:2]
  if key not in lookup:
   v,uv=key;r=refs[v];a,b,c=map(int,r[:3]);ws=r[3:6];offset=[x*.1 for x in r[6:9]]
   lookup[key]=len(lookup)
   attrs['POSITION'].extend(sum(base[j][k]*w for j,w in zip([a,b,c],ws))+offset[k]*axis[k] for k in range(3))
   attrs['TEXCOORD_0'].extend(uvs[uv] if uv>=0 else [0,0]);attrs['_REFS'].extend([a,b,c]);attrs['_REFW'].extend(ws);attrs['_OFFS'].extend(offset)
   acc={}
   for j,w in zip([a,b,c],ws):
    for bone,bw in weights.get(j,[(0,1)]):acc[int(bone)]=acc.get(int(bone),0)+w*bw
   best=sorted(acc.items(),key=lambda p:p[1],reverse=True)[:4];total=sum(v for _,v in best) or 1
   attrs['_JOINTS'].extend([k for k,_ in best]+[0]*(4-len(best)));attrs['_WEIGHTS'].extend([max(0,v/total) for _,v in best]+[0]*(4-len(best)))
  indices.append(lookup[key])
 j={'asset':{'version':'2.0','generator':'L’MOR MakeHuman garment importer'},'buffers':[{}],'bufferViews':[],'accessors':[]};binary=bytearray()
 def add(values,dim,kind):
  binary.extend(b'\0'*((-len(binary))%4));at=len(binary);fmt={5126:'f',5123:'H',5121:'B',5125:'I'}[kind]
  binary.extend(struct.pack('<'+fmt*len(values),*values))
  j['bufferViews'].append({'buffer':0,'byteOffset':at,'byteLength':len(binary)-at})
  j['accessors'].append({'bufferView':len(j['bufferViews'])-1,'componentType':kind,'count':len(values)//dim,'type':{1:'SCALAR',2:'VEC2',3:'VEC3',4:'VEC4'}[dim]})
  return len(j['accessors'])-1
 glattrs={}
 for k,values in attrs.items():glattrs[k]=add(values,2 if k=='TEXCOORD_0' else 4 if k in ['_JOINTS','_WEIGHTS'] else 3,5123 if k=='_REFS' else 5121 if k=='_JOINTS' else 5126)
 index=add(indices,1,5123 if len(lookup)<65536 else 5125)
 j.update(meshes=[{'primitives':[{'attributes':glattrs,'indices':index,'mode':4}]}],nodes=[{'mesh':0}],scenes=[{'nodes':[0]}],scene=0)
 binary.extend(b'\0'*((-len(binary))%4));j['buffers'][0]['byteLength']=len(binary)
 js=json.dumps(j,separators=(',',':'),ensure_ascii=True).encode();js+=b' '*((-len(js))%4)
 raw=struct.pack('<III',0x46546c67,2,28+len(js)+len(binary))+struct.pack('<II',len(js),0x4e4f534a)+js+struct.pack('<II',len(binary),0x004e4942)+binary
 output=f'proxies/clothes-{garment_id}.glb.gz';Path('public/human',output).write_bytes(gzip.compress(raw,9,mtime=0))
 mat={}
 if meta.get('material') and (root/meta['material']).exists():
  for line in (root/meta['material']).read_text(errors='replace').splitlines():
   pp=line.split()
   if pp and not pp[0].startswith('#'):mat[pp[0]]=' '.join(pp[1:])
 proxy={'id':garment_id,'kind':'clothes','file':output,'triangles':len(indices)//3,'transparent':False,'tintable':True,'zDepth':int(meta.get('z_depth',50)),'scale':scale,'deleteVerts':compact_ranges(hidden),'textureSize':1024,'doubleSided':True,'source':str(mhclo.name)}
 for key,suffix,target in [('diffuseTexture','','texture'),('normalmapTexture','_n','normalTexture')]:
  if mat.get(key):
   tex=root/mat[key]
   if not tex.exists():tex=next(root.rglob(Path(mat[key]).name),tex)
   if tex.exists():
    out=Path('public/human/textures',garment_id+suffix+tex.suffix.lower());out.write_bytes(tex.read_bytes());proxy[target]=f'textures/{garment_id}{suffix}.webp';print('Convert texture:',out)
 m['proxies']=[p for p in m['proxies'] if p['id']!=garment_id]+[proxy];Path('public/human/manifest.json').write_text(json.dumps(m,separators=(',',':')))
 print(garment_id,len(lookup),'vertices',len(indices)//3,'triangles',len(refs),'fitting references')
if __name__=='__main__':main(Path(sys.argv[1]),sys.argv[2])
