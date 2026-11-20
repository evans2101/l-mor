"""Split licensed outfit meshes into independent top/bottom fitting proxies.
HumanForge / MakeHuman CC0 assets, pinned to 2226df1f50a04c5a8e1c02ea33780d28337dfbb1.
Run from the repository root after downloading the original source package.
Preserves UVs, skinning weights and barycentric body references.
"""
import gzip,json,struct
from pathlib import Path

def read(name):
 raw=gzip.decompress(Path('public/human/proxies/clothes-'+name+'.glb.gz').read_bytes());l=struct.unpack_from('<I',raw,12)[0];j=json.loads(raw[20:20+l]);bin=raw[20+l+8:];pr=j['meshes'][0]['primitives'][0]
 def attr(idx):
  a=j['accessors'][idx];v=j['bufferViews'][a['bufferView']];kind,sz={5120:('b',1),5121:('B',1),5122:('h',2),5123:('H',2),5125:('I',4),5126:('f',4)}[a['componentType']];dims={'SCALAR':1,'VEC2':2,'VEC3':3,'VEC4':4}[a['type']];start=v.get('byteOffset',0)+a.get('byteOffset',0);stride=v.get('byteStride',sz*dims)
  vals=[struct.unpack_from('<'+kind*dims,bin,start+i*stride) for i in range(a['count'])]
  if a.get('normalized'):
   div={5120:127,5121:255,5122:32767,5123:65535}[a['componentType']];vals=[tuple(max(-1,x/div) for x in v) for v in vals]
  return vals
 pos=attr(pr['attributes']['POSITION']);node=j['nodes'][0];scale=node.get('scale',[1,1,1]);trans=node.get('translation',[0,0,0]);pos=[tuple(v[k]*scale[k]+trans[k] for k in range(3)) for v in pos]
 idx=[x[0] for x in attr(pr['indices'])];parent=list(range(len(pos)))
 def root(x):
  while parent[x]!=x:parent[x]=parent[parent[x]];x=parent[x]
  return x
 def union(a,b):parent[root(a)]=root(b)
 welded={}
 for i,p in enumerate(pos):
  key=tuple(round(x,4) for x in p)
  if key in welded:union(i,welded[key])
  else:welded[key]=i
 for i in range(0,len(idx),3):union(idx[i],idx[i+1]);union(idx[i],idx[i+2])
 components={}
 for i in range(0,len(idx),3):components.setdefault(root(idx[i]),[]).extend(idx[i:i+3])
 stats=[]
 for inds in components.values():
  ys=[pos[i][1] for i in set(inds)];stats.append((len(inds)//3,round(min(ys),3),round(max(ys),3)))
 return j,bin,pr,pos,idx,components,stats

def write_glb(j, binary, pr, indices, destination):
 binary += b'\x00' * ((-len(binary)) % 4)
 at=len(binary)
 bits=j['accessors'][pr['indices']]['componentType']
 code='H' if bits==5123 else 'I'
 index_bytes=struct.pack('<'+code*len(indices),*indices)
 binary+=index_bytes
 j['bufferViews'].append({'buffer':0,'byteOffset':at,'byteLength':len(index_bytes),'target':34963})
 j['accessors'].append({'bufferView':len(j['bufferViews'])-1,'componentType':bits,'count':len(indices),'type':'SCALAR','min':[min(indices)],'max':[max(indices)]})
 pr['indices']=len(j['accessors'])-1
 binary += b'\x00' * ((-len(binary)) % 4)
 j['buffers'][0]['byteLength']=len(binary)
 js=json.dumps(j,separators=(',',':')).encode();js+=b' ' *((-len(js))%4)
 raw=struct.pack('<III',0x46546c67,2,12+8+len(js)+8+len(binary))+struct.pack('<II',len(js),0x4e4f534a)+js+struct.pack('<II',len(binary),0x004e4942)+binary
 destination.write_bytes(gzip.compress(raw,compresslevel=9,mtime=0))

def ranges(values):
 out=[]
 for n in sorted(values):
  if out and n==out[-1][1]+1:out[-1][1]=n
  else:out.append([n,n])
 return out

if __name__=='__main__':
 manifest_path=Path('public/human/manifest.json')
 m=json.loads(manifest_path.read_text())
 N=m['vertexCount'];shape=gzip.decompress(Path('public/human/shapes.bin.gz').read_bytes());at=m['shapes']['baseOffset']+N*2;acc=0;baseY=[]
 for i in range(N):
  acc=(acc+(shape[at+i]|shape[at+N+i]<<8))&65535
  baseY.append(m['shapes']['baseMin'][1]+acc*m['shapes']['baseScale'][1])
 aliases={
  'lmor_top_tee':('male_casualsuit06','top'),
  'lmor_top_washed':('male_casualsuit06','top'),
  'lmor_top_shirt':('male_casualsuit01','top'),
  'lmor_top_oxford':('male_casualsuit01','top'),
  'lmor_top_hoodie':('male_casualsuit02','top'),
  'lmor_top_jacket':('male_casualsuit02','top'),
  'lmor_bottom_denim':('male_casualsuit06','bottom'),
  'lmor_bottom_cargo':('male_casualsuit05','bottom'),
  'lmor_bottom_trousers':('female_sportsuit01','bottom'),
  'lmor_bottom_shorts':('female_casualsuit02','bottom'),
 }
 m['proxies']=[p for p in m['proxies'] if p['id'] not in aliases]
 for id,(source,part) in aliases.items():
  j,binary,pr,positions,_,components,_=read(source)
  selected=[]
  for indices in components.values():
   maxY=max(positions[i][1] for i in indices)
   is_top=maxY>1.05
   if source=='male_casualsuit01' and part=='top':
    selected.extend(i for offset in range(0,len(indices),3) if sum(positions[v][1] for v in indices[offset:offset+3])/3>.935 for i in indices[offset:offset+3])
   elif (part=='top')==is_top:selected.extend(indices)
  if not selected:raise ValueError('Empty garment '+id)
  filename='proxies/clothes-'+id+'.glb.gz'
  write_glb(j,binary,pr,selected,Path('public/human')/filename)
  meta=next(p.copy() for p in m['proxies'] if p['id']==source and p['kind']=='clothes')
  hidden=[]
  for a,b in meta.get('deleteVerts',[]):
   hidden.extend(i for i in range(a,b+1) if (baseY[i]>=.88 if part=='top' else baseY[i]<=.97))
  meta.update(id=id,file=filename,triangles=len(selected)//3,deleteVerts=ranges(hidden),tintable=True,color='#ffffff',source=source)
  m['proxies'].append(meta)
  print(id, len(selected)//3, 'triangles')
 manifest_path.write_text(json.dumps(m,separators=(',',':')))
