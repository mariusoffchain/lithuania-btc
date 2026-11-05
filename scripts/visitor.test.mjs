import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
{
 const name="lithuania-btc";
 const domain=await import("../domain.js");
 test(`${name}: accent, city, category and combined search`,()=>{
  const p={name:'Kafejnīca',address:'Rīga, Centrs',icon:'local_cafe'};
  assert.ok(domain.matchesPlace(p,'riga'));
  assert.ok(domain.matchesPlace(p,'RĪGA cafe'));
  assert.ok(domain.matchesPlace(p,'kafejnica'));
  assert.ok(!domain.matchesPlace(p,'Tallinn cafe'));
  assert.ok(domain.matchesPlace({name:'Arbūzai',address:'Vilnius'},'arbuzai'));
 });
 test(`${name}: coincident places remain individually recoverable`,()=>{
  const records=[{id:1,lon:0,lat:0},{id:2,lon:0,lat:0},{id:3,lon:20,lat:20},{id:4,lon:100,lat:100}];
  const groups=domain.groupNearbyPlaces(records,([x,y])=>({x,y}));
  assert.deepEqual(groups.map(g=>g.map(p=>p.id).sort()).sort((a,b)=>a[0]-b[0]),[[1,2,3],[4]]);
  assert.equal(new Set(groups.flat().map(p=>p.id)).size,4);
 });
 test(`${name}: saved and live data use the same name and editorial exclusions`,async()=>{
  const boundary=JSON.parse(await readFile(new URL("../data/lithuania.geojson",import.meta.url)));
  const sample={id:999,lon:25.28,lat:54.68};
  for(const label of ['', 'Unnamed','Unnamed place','T/N Fun Casino & Foto Veidrodžio nuoma'])assert.equal(domain.filterPlaces([{...sample,name:label}],boundary).length,0);
  assert.equal(domain.filterPlaces([{...sample,name:'Arbūzai'}],boundary).length,1);
 });
 test(`${name}: calendar handles all-day dates, missing end and unconfirmed dates`,()=>{
  const event={id:'fixture',title:{en:'Meetup; Rīga'},description:{en:'First line\nSecond line'},start:'2026-11-05',end:'2026-11-06',dateOnly:true};
  const ics=domain.ics(event);
  assert.match(ics,/DTSTART;VALUE=DATE:20261105/);
  assert.match(ics,/DTEND;VALUE=DATE:20261107/);
  assert.match(ics,/SUMMARY:Meetup\\; Rīga/);
  assert.doesNotMatch(ics,/undefined/);
  assert.throws(()=>domain.ics({...event,status:'planned'}));
  assert.throws(()=>domain.ics({...event,dateUncertain:true}));
  assert.throws(()=>domain.ics({...event,end:'2026-11-04'}));
  const timed=domain.ics({...event,start:'2026-11-05T18:00:00+02:00',end:null,dateOnly:false});
  assert.match(timed,/DTSTART:20261105T160000Z/);assert.doesNotMatch(timed,/DTEND/);
 });
}
