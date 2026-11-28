import { test } from 'node:test';
import assert from 'node:assert/strict';
import sample from '../fixtures/idx-sample.json';
import { bucketOf, fromReso } from '../src/lib/idx/reso';
import { normalizeAddress, makeMatcher } from '../src/lib/idx/match';
import { plan } from '../src/lib/idx/sync';
import { summarize } from '../src/lib/idx/store';
import type { Listing } from '../src/lib/idx/types';

const listings = (sample.value as any[]).map(fromReso).filter(Boolean) as Listing[];
const byKey = Object.fromEntries(listings.map((l) => [l.key, l]));

test('the four lists: sale, rent, sold, rented', () => {
  assert.equal(bucketOf({ StandardStatus: 'Active', PropertyType: 'Residential' }), 'forSale');
  assert.equal(bucketOf({ StandardStatus: 'Active Under Contract', PropertyType: 'Residential' }), 'forSale');
  assert.equal(bucketOf({ StandardStatus: 'Closed', PropertyType: 'Residential' }), 'sold');
  assert.equal(bucketOf({ StandardStatus: 'Active', PropertyType: 'Residential Lease' }), 'forLease');
  assert.equal(bucketOf({ StandardStatus: 'Closed', PropertyType: 'Residential Lease' }), 'leased');
  assert.equal(bucketOf({ StandardStatus: 'Withdrawn', PropertyType: 'Residential' }), null);
});

test('expired listings and ones the seller keeps off other sites are dropped', () => {
  assert.equal(byKey.k6, undefined);
  assert.equal(byKey.k7, undefined);
  assert.equal(listings.length, 6);
});

test('a feed record becomes a listing with the brokerage and first photo', () => {
  const l = byKey.k1;
  assert.equal(l.address, '2450 SW 3rd Ave'); assert.equal(l.unit, '1204'); assert.equal(l.zip, '33129');
  assert.equal(l.officeName, 'Sample Realty Group'); assert.equal(l.photoUrl, 'https://example.com/a.jpg');
  assert.equal(byKey.k3.beds, 0);
});

test('addresses written differently come out the same', () => {
  const want = '2450 sw 3 ave';
  for (const a of ['2450 SW 3rd Avenue, Miami, FL', '2450 S.W. 3RD AVE #1204', '2450 Southwest 3 Ave Unit 9', '2450 sw 3rd ave 1204'])
    assert.equal(normalizeAddress(a.replace('S.W.', 'SW')), want, a);
  assert.equal(normalizeAddress('1000 Brickell Avenue, Unit 2301'), '1000 brickell ave');
});

test('matching: address first, alias, name for twin towers, position last', () => {
  const m = makeMatcher(sample.buildings as any);
  assert.deepEqual(m(byKey.k1), { buildingId: 'b-palm', by: 'address' });
  assert.deepEqual(m(byKey.k2), { buildingId: 'b-palm', by: 'address' });          // listed under the tower's second address
  assert.deepEqual(m(byKey.k3), { buildingId: 'b-north', by: 'address' });         // two towers share the address; the name decides
  assert.equal(m(byKey.k4), null);                                                 // same address, no name: not guessed
  assert.deepEqual(m(byKey.k5), { buildingId: 'b-lone', by: 'position' });
  assert.equal(m(byKey.k8), null);
});

test('a sync plan stores matches and lists what has no building yet', () => {
  const { rows, unmatched } = plan(listings, sample.buildings as any);
  assert.equal(rows.length, 4);
  assert.deepEqual(unmatched.map((u) => u.address).sort(), ['100 Example Bay Dr', '77 Nowhere Ct']);
});

test('summary line for a building', () => {
  const by = { forSale: [byKey.k1], forLease: [], sold: [byKey.k2], leased: [] } as any;
  const s = summarize(by);
  assert.equal(s.forSale, 1); assert.equal(s.fromPrice, 850000); assert.equal(s.medianSoldPerSqft, 750);
});
