"""Fit the CC0 CharacterCreator hood component to the local MakeHuman base.
Usage: python3 scripts/import-hood-detail.py /path/clothing_hoodie.glb
Source/provenance: public/licenses/charactercreator-assets.md (no GPL code used).
"""
import gzip,json,struct,sys,importlib.util
from pathlib import Path
spec=importlib.util.spec_from_file_location('mh','scripts/import-makehuman-garment.py');mh=importlib.util.module_from_spec(spec);spec.loader.exec_module(mh)
raw=Path(sys.argv[1]).read_bytes();n=struct.unpack_from('<I',raw,12)[0];j=json.loads(raw[20:20+n]);binary=raw[28+n:]
def attr(aid):
 a=j['accessors'][aid];v=j['bufferViews'][a['bufferView']];fmt,bs={5121:('B',1),5123:('H',2),5125:('I',4),5126:('f',4)}[a['componentType']];dim={'SCALAR':1,'VEC2':2,'VEC3':3,'VEC4':4}[a['type']];at=v.get('byteOffset',0)+a.get('byteOffset',0);stride=v.get('byteStride',bs*dim)
 return [struct.unpack_from('<'+fmt*dim,binary,at+i*stride) for i in range(a['count'])]
p=j['meshes'][0]['primitives'][0];attrs={k:attr(v) for k,v in p['attributes'].items()};indices=[r[0] for r in attr(p['indices'])];keep=[i for i,c in enumerate(attrs['_CCCOLLAR']) if c[0]>.5];lookup={v:i for i,v in enumerate(keep)}
indices=[lookup[v] for offset in range(0,len(indices),3) if all(v in lookup for v in indices[offset:offset+3]) for v in indices[offset:offset+3]]
m=json.loads(Path('public/human/manifest.json').read_text());base=mh.base_shape(m);body=mh.read_glb('public/human/body.glb.gz');weights={int(v[0]):(body['JOINTS_0'][i],body['WEIGHTS_0'][i]) for i,v in enumerate(body['_MH'])}
out={k:[] for k in ['POSITION','TEXCOORD_0','_REFS','_REFW','_OFFS','_JOINTS','_WEIGHTS']}
for i in keep:
 pos=attrs['POSITION'][i]
 nearest=min(weights,key=lambda v:sum((base[v][k]-pos[k])**2 for k in range(3)))
 out['POSITION'].extend(pos);out['TEXCOORD_0'].extend(attrs['TEXCOORD_0'][i]);out['_REFS'].extend([nearest]*3);out['_REFW'].extend([1,0,0]);out['_OFFS'].extend(pos[k]-base[nearest][k] for k in range(3));out['_JOINTS'].extend(weights[nearest][0]);out['_WEIGHTS'].extend(weights[nearest][1])
doc={'asset':{'version':'2.0','generator':'LMOR CC0 hood fitting'},'buffers':[{}],'bufferViews':[],'accessors':[]};buf=bytearray()
def add(values,dim,kind):
 buf.extend(b'\0'*((-len(buf))%4));at=len(buf);fmt={5126:'f',5123:'H',5121:'B'}[kind];buf.extend(struct.pack('<'+fmt*len(values),*values));doc['bufferViews'].append({'buffer':0,'byteOffset':at,'byteLength':len(buf)-at});doc['accessors'].append({'bufferView':len(doc['bufferViews'])-1,'componentType':kind,'count':len(values)//dim,'type':{1:'SCALAR',2:'VEC2',3:'VEC3',4:'VEC4'}[dim]});return len(doc['accessors'])-1
a={k:add(v,2 if k=='TEXCOORD_0' else 4 if k in ['_JOINTS','_WEIGHTS'] else 3,5123 if k=='_REFS' else 5121 if k=='_JOINTS' else 5126) for k,v in out.items()};idx=add(indices,1,5123)
doc.update(meshes=[{'primitives':[{'attributes':a,'indices':idx,'mode':4}]}],nodes=[{'mesh':0}],scenes=[{'nodes':[0]}],scene=0);buf.extend(b'\0'*((-len(buf))%4));doc['buffers'][0]['byteLength']=len(buf);js=json.dumps(doc,separators=(',',':')).encode();js+=b' '*((-len(js))%4);glb=struct.pack('<III',0x46546c67,2,28+len(js)+len(buf))+struct.pack('<II',len(js),0x4e4f534a)+js+struct.pack('<II',len(buf),0x004e4942)+buf
id='lmor_hood';file='proxies/clothes-lmor_hood.glb.gz';Path('public/human',file).write_bytes(gzip.compress(glb,9,mtime=0));source=next(p for p in m['proxies'] if p['id']=='male_casualsuit02');meta={'id':id,'kind':'clothes','file':file,'triangles':len(indices)//3,'transparent':False,'tintable':True,'zDepth':55,'scale':source['scale'],'texture':'textures/fabric-cotton.webp','textureSize':512,'doubleSided':True,'roughness':.9,'tileable':True,'source':'CharacterCreator clothing_hoodie.glb, CC0 hood component'};m['proxies']=[p for p in m['proxies'] if p['id']!=id]+[meta];Path('public/human/manifest.json').write_text(json.dumps(m,separators=(',',':')));print(len(keep),'fitted hood vertices;',len(indices)//3,'triangles')
