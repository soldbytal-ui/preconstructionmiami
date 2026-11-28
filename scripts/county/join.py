import csv, json, re, collections, math
DIR={'north':'n','south':'s','east':'e','west':'w','northeast':'ne','northwest':'nw','southeast':'se','southwest':'sw'}
SUF={'avenue':'ave','street':'st','boulevard':'blvd','drive':'dr','road':'rd','court':'ct','place':'pl','terrace':'ter','lane':'ln','highway':'hwy','causeway':'cswy','plaza':'plz','circle':'cir','trail':'trl','parkway':'pkwy','av':'ave','boulv':'blvd'}
def norm(a):
    if not a: return ''
    s=a.lower().split(',')[0]
    s=re.sub(r'[.#]',' ',s); s=re.sub(r'\b(unit|apt|suite|ste|ph|bldg|building)\b.*$',' ',s)
    w=[DIR.get(x) or SUF.get(x) or re.sub(r'^(\d+)(st|nd|rd|th)$',r'\1',x) for x in s.split()]
    return ' '.join(w)
rows=list(csv.DictReader(open('dbpr.csv',encoding='latin-1')))
tall=json.load(open('tall.json'))
byaddr=collections.defaultdict(list)
for f in tall:
    k=norm(f['ADDRESS'])
    if k and k[0].isdigit(): byaddr[k].append(f)
out=[]; miss=[]
for r in rows:
    try: units=int(r['Units'] or 0)
    except: units=0
    if units<40: continue
    full=r['Street City State Zip']; parts=[p.strip() for p in full.split(',')]
    k=norm(parts[0]); zipm=re.search(r'(\d{5})(-\d{4})?\s*$',full)
    hits=byaddr.get(k,[])
    if zipm: hits=[h for h in hits if (h['ZIP_CODE'] or '')[:5]==zipm.group(1)] or hits
    if not hits:
        if units>=150: miss.append((units,r['Condo Name'],full))
        continue
    h=max(hits,key=lambda x:x['BLDG_HEIGHT'] or 0)
    out.append({'name':r['Condo Name'],'units':units,'recorded':r['Recorded Date'],'address':parts[0],'city':parts[1] if len(parts)>1 else None,'zip':zipm.group(1) if zipm else None,'heightFt':h['BLDG_HEIGHT'],'folio':h['FOLIO'],'lat':h['c']['y'],'lng':h['c']['x'],'type':h['BLDG_TYPE'],'project':r['Project Number'],'nfp':len(hits)})
print(len(out),'matched;', len(miss),'large condos unmatched')
# several registry entries can share one tower (phases) and one entry can be listed twice
bykey=collections.defaultdict(list)
for o in out: bykey[(o['folio'])].append(o)
print(len(bykey),'distinct towers')
print(collections.Counter(o['city'] for o in out).most_common(14))
for o in sorted(out,key=lambda o:-o['heightFt'])[:14]: print(o['name'],'|',o['address'],o['city'],'|',o['units'],'u |',round(o['heightFt']),'ft |',o['recorded'],'|',o['type'][:20] if o['type'] else None)
print('unmatched sample:'); [print(' ',m) for m in sorted(miss,reverse=True)[:12]]
json.dump(out,open('joined.json','w'))
