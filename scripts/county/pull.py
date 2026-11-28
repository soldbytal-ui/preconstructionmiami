import json, time, urllib.parse, urllib.request, collections, sys
B="https://services.arcgis.com/8Pc9XBTAsYuxx9Ny/arcgis/rest/services/"
def q(svc, **p):
    p.setdefault('f','json')
    url=B+svc+"/FeatureServer/0/query?"+urllib.parse.urlencode(p)
    for a in range(3):
        try:
            d=json.load(urllib.request.urlopen(urllib.request.Request(url,headers={'User-Agent':'preconstructionmiami.net building profiles (contact via site)'}),timeout=60))
            if 'error' in d: raise RuntimeError(d['error'])
            time.sleep(2.5); return d
        except Exception as e:
            print('retry',e,file=sys.stderr); time.sleep(8)
    raise SystemExit('county service not answering')
# 1. condo towers: reference-folio footprints 150 ft and taller
fp=[]; off=0
while True:
    d=q('BuildingFootprintUBIDFolio_gdb', where="BLDG_TYPE='REFERENCE FOLIO' AND BLDG_HEIGHT>=150", outFields="UBID,FOLIO,ADDRESS,CITY,ZIP_CODE,BLDG_HEIGHT,LIVING_AREA", returnCentroid='true', returnGeometry='false', outSR=4326, resultOffset=off, resultRecordCount=1000, orderByFields='OBJECTID')
    for f in d['features']: fp.append({**f['attributes'], 'c':f.get('centroid')})
    if not d.get('exceededTransferLimit'): break
    off+=1000
json.dump(fp,open('footprints.json','w')); print(len(fp),'footprints', len({f['FOLIO'] for f in fp}),'folios')
# 2. the units in each: name, year, unit count
prefixes=sorted({f['FOLIO'][:9] for f in fp if f['FOLIO']})
units={}
for i in range(0,len(prefixes),12):
    grp=prefixes[i:i+12]
    where="CONDO_FLAG='C' AND ("+" OR ".join(f"FOLIO LIKE '{p}%'" for p in grp)+")"
    off=0
    while True:
        d=q('PaParcelView_gdb', where=where, outFields="FOLIO,TRUE_SITE_ADDR_NO_UNIT,TRUE_SITE_ZIP_CODE,TRUE_SITE_CITY,DOR_DESC,SUBDIVISION,YEAR_BUILT,BEDROOM_COUNT", returnGeometry='false', resultOffset=off, resultRecordCount=2000, orderByFields='OBJECTID')
        for f in d['features']:
            a=f['attributes']; units.setdefault(a['FOLIO'][:9],[]).append(a)
        if not d.get('exceededTransferLimit'): break
        off+=2000
    print(i,len(units),sum(len(v) for v in units.values()),flush=True)
json.dump(units,open('units.json','w'))
