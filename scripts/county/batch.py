import json, re, math, collections, hashlib
J=json.load(open('joined.json')); T={f['FOLIO']:f for f in json.load(open('tall.json'))}; P=json.load(open('projects.json')); Bs=json.load(open('buildings.json')); H={h['name']:h['id'] for h in json.load(open('hoods.json'))}
def dist(a,b,c,d): return math.hypot((b-d)*111320*math.cos(math.radians(a)),(a-c)*110540)
SMALL={'at','on','of','the','in','and','by','a','an','to','del','de','la','le'}
def clean(n):
    s=' '+n.upper().replace('ICONBRICKELL','ICON BRICKELL')+' '
    the=bool(re.search(r',?\s+THE\s*$| THE,? A | A CONDO THE ',s)) or s.strip().startswith('THE ')
    s=re.sub(r'\(.*?\)',' ',s); s=re.sub(r'\bCONDOMINIUMS?\b|\bCONDOS?\b|\bASSOCIATION\b|\bASSN\b|\bINC\b\.?|,\s*A\b|,\s*THE\b',' ',s); s=re.sub(r'[,\.]',' ',s); s=re.sub(r'\s+',' ',s).strip(' -'); s=re.sub(r'^(THE|A)\s+|\s+(THE|A)$','',s); s=re.sub(r'\s+(THE|A)$','',s)
    s=re.sub(r'\(.*?\)',' ',s); s=re.sub(r'[,\.]',' ',s); s=re.sub(r'\s+-\s*$','',s); s=re.sub(r'\s+',' ',s).strip(' -')
    s=re.sub(r'\bNO\s+(ONE|TWO|THREE|FOUR|\d+)\b',lambda m:{'ONE':'One','TWO':'Two','THREE':'Three','FOUR':'Four'}.get(m.group(1),m.group(1)),s)
    w=[]
    for i,x in enumerate(s.split()):
        if re.fullmatch(r'[IVX]{2,4}',x) or re.fullmatch(r'\d+\w*',x): w.append(x if not re.fullmatch(r'\d+(ST|ND|RD|TH)',x) else x.lower())
        elif x.lower() in SMALL and i>0: w.append(x.lower())
        elif x in ('TDR','GB'): w.append(x)
        else: w.append(x[0]+x[1:].lower() if x[0].isalpha() else x)
    s=' '.join(w); s={'Mybrickell':'MyBrickell',"L'excellence":"L'Excellence"}.get(s,s)
    return ('The '+s) if the else s
def addr(a,city):
    w=[]; toks=a.replace('.','').split()
    for i,x in enumerate(toks):
        X=x.upper()
        if X in ('NE','NW','SE','SW') or (X in ('N','S','E','W') and len(toks)-i>2): w.append(X)
        elif X in ('NORTH','SOUTH','EAST','WEST') and len(w)==1 and len(toks)-i>2: w.append(X[0])
        elif X in ('N','S','E','W') and len(toks)-i<=2: w.append({'N':'North','S':'South','E':'East','W':'West'}[X])
        else: w.append({'AVENUE':'Ave','STREET':'St','BOULEVARD':'Blvd','DRIVE':'Dr','ROAD':'Rd','COURT':'Ct','PLACE':'Pl','TERRACE':'Ter','LANE':'Ln'}.get(X, x.capitalize() if not re.match(r'\d',x) else x.lower()))
    return ' '.join(w)+', '+' '.join(p.capitalize() for p in city.split())+', FL'
CITY={'MIAMI BEACH':'Miami Beach','AVENTURA':'Aventura','SUNNY ISLES BEACH':'Sunny Isles Beach','BAL HARBOUR':'Bal Harbour','KEY BISCAYNE':'Key Biscayne','SURFSIDE':'Surfside','NORTH BAY VILLAGE':'North Bay Village','CORAL GABLES':'Coral Gables','NORTH MIAMI BEACH':'North Miami Beach','BAY HARBOR ISLANDS':'Bay Harbor Islands','COCONUT GROVE':'Coconut Grove','WILLIAMS ISLAND':'Aventura'}
known=[(x['latitude'],x['longitude'],x['neighborhoodId']) for x in P+Bs if x.get('latitude') and x.get('neighborhoodId')]
by=collections.defaultdict(list)
for o in J: by[o['folio']].append(o)
rows=[]; skipped=collections.Counter(); slugs={b['slug'] for b in Bs}
for folio,g in by.items():
    o=max(g,key=lambda x:x['units'])
    if o['heightFt']<100: skipped['under 100 ft']+=1; continue
    if any(b.get('latitude') and dist(o['lat'],o['lng'],b['latitude'],b['longitude'])<70 for b in Bs): skipped['already has a profile']+=1; continue
    if any(p.get('latitude') and dist(o['lat'],o['lng'],p['latitude'],p['longitude'])<45 for p in P): skipped['is a listed project']+=1; continue
    if re.search(r'suite|ste |#|hotel|apartments|apts',o['address']+' '+o['name'],re.I): skipped['office address or hotel']+=1; continue
    o['city']=(T.get(folio,{}).get('CITY') or o['city'] or 'Miami'); o['city']='Miami' if 'UNINCORP' in o['city'].upper() else o['city']
    name=clean(o['name'])
    if len(name)<3: skipped['no usable name']+=1; continue
    city=(o['city'] or 'Miami').upper()
    near=sorted((dist(o['lat'],o['lng'],a,b),n) for a,b,n in known)
    hood=near[0][1] if near and near[0][0]<900 else H.get(CITY.get(city,''))
    if city=='MIAMI BEACH' and not (near and near[0][0]<900): hood=H['South Beach'] if o['lat']<25.795 else H['Miami Beach']
    if not hood: skipped['outside the areas the site covers']+=1; continue
    slug=re.sub(r'[^a-z0-9]+','-',name.lower()).strip('-')
    if slug in slugs: slug+= '-'+re.sub(r'[^a-z0-9]+','-',(o['city'] or '').lower()).strip('-')
    if slug in slugs: skipped['duplicate name']+=1; continue
    slugs.add(slug)
    units=sum(x['units'] for x in {x['project']:x for x in g}.values())
    yr=o['recorded'][-4:] if o['recorded'] else None
    rows.append({'id':hashlib.md5(('county-'+folio).encode()).hexdigest(),'name':name,'slug':slug,'address':addr(o['address'],o['city'] or 'Miami'),'neighborhoodId':hood,'totalUnits':units,'heightM':None,'_ft':round(o['heightFt']),'latitude':round(o['lat'],6),'longitude':round(o['lng'],6),'tenure':'condo',
      'note':(f"The condominium was recorded with the State of Florida in {yr}." if yr else None),
      'sources':['https://www2.myfloridalicense.com/sto/file_download/extracts/Condo_MD.csv','https://gis-mdc.opendata.arcgis.com/datasets/7abe7f01391b4113b05030414669fef5'],'_raw':o['name'],'_zip':o['zip'],'_folio':folio})
print(len(rows),'to add;',dict(skipped)); print(collections.Counter(next((k for k,v in H.items() if v==r['neighborhoodId']),None) for r in rows).most_common())
for r in sorted(rows,key=lambda r:r['name']): print(f"{r['name']:<40} | {r['address']}")
json.dump(rows,open('batch.json','w'))
