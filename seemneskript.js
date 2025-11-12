#!/usr/bin/env bun
/*
Generates CSV files for the airbnb schema in this repo.
Usage: bun run generate_seed.js --out data --listings 2000000
Options:
  --out <dir>        Output directory for CSV files (default: data)
  --listings <n>     Number of listings to generate (default: 2000000)
  --seed <n>         PRNG seed (default: 42)
*/

import { writeFileSync, mkdirSync, existsSync } from 'fs';
import { join } from 'path';

// Tiny arg parser supporting flags and key values
const rawArgs = process.argv.slice(2);
const args = {};
for (let i=0;i<rawArgs.length;i++){
  const a = rawArgs[i];
  if (!a.startsWith('--')) continue;
  const key = a.replace(/^--/, '');
  const val = rawArgs[i+1] && !rawArgs[i+1].startsWith('--') ? rawArgs[i+1] : 'true';
  args[key] = val;
}

const OUT = args.out || 'data';
const SEED = parseInt(args.seed || '42', 10);
const FORCE_ALL_2M = args['all-nonlookup'] === 'true' || args['all2m'] === 'true';
const GENERATE_SQL = args['generate-sql'] === 'true' || args['generate-sql'] === '1';
const NUM_LISTINGS = parseInt(args.listings || (FORCE_ALL_2M ? '2000000' : '2000000'), 10);

if (!existsSync(OUT)) mkdirSync(OUT, { recursive: true });

// simple mulberry32 PRNG for determinism
function mulberry32(a) {
  return function() {
    let t = a += 0x6D2B79F5;
    t = Math.imul(t ^ t >>> 15, t | 1);
    t ^= t + Math.imul(t ^ t >>> 7, t | 61);
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  }
}

const rng = mulberry32(SEED);

function sample(arr) { return arr[Math.floor(rng()*arr.length)]; }

const firstNames = ['Emma','Olivia','Ava','Isabella','Sophia','Liam','Noah','Oliver','Elijah','James'];
const lastNames = ['Smith','Johnson','Williams','Brown','Jones','Garcia','Miller','Davis','Rodriguez','Martinez'];
const cities = ['Tallinn','Tartu','Pärnu','Riga','Vilnius','Helsinki','Stockholm','Copenhagen'];
const countries = ['Estonia','Latvia','Lithuania','Finland','Sweden','Denmark'];
const roomTypes = ['Entire place','Private room','Shared room'];
const amenities = ['Wifi','Kitchen','Free parking','Washer','Dryer','Heating','Air conditioning','Pool'];

function csvEscape(s) {
  if (s === null || s === undefined) return '';
  return '"' + String(s).replace(/"/g, '""') + '"';
}

// Generate lookup tables first
function generateSimpleCsv(filename, headers, rows) {
  const path = join(OUT, filename);
  const out = [headers.join(',')];
  for (const r of rows) out.push(r.map(csvEscape).join(','));
  writeFileSync(path, out.join('\n'));
  console.log('Wrote', path, rows.length, 'rows');
}

// users
// Determine sizes. If FORCE_ALL_2M is set, ensure all non-lookup tables reach at least 2M.
// For small test runs (NUM_LISTINGS < 10k) pick smaller minima to avoid huge test outputs.
const USERS = FORCE_ALL_2M ? Math.max(2000000, Math.floor(NUM_LISTINGS * 1)) : Math.max(NUM_LISTINGS < 10000 ? 1000 : 500000, Math.floor(NUM_LISTINGS * 0.6));
{
  const rows = [];
  for (let i=1;i<=USERS;i++) {
    const name = sample(firstNames) + ' ' + sample(lastNames);
    const email = (name.replace(/\s+/g,'').toLowerCase() + i + '@example.com');
    const password = 'x'.repeat(60);
    const created_at = new Date(Date.now() - Math.floor(rng()*5*365*24*3600*1000)).toISOString().slice(0,19).replace('T',' ');
    rows.push([i, name, email, password, created_at]);
  }
  generateSimpleCsv('users.csv', ['id','name','email','password','created_at'], rows);
}

// room_types
{
  const rows = roomTypes.map((n,i) => [i+1, n]);
  generateSimpleCsv('room_types.csv', ['id','name'], rows);
}

// countries
{
  const rows = countries.map((n,i) => [i+1, n]);
  generateSimpleCsv('countries.csv', ['id','name'], rows);
}

// cities
{
  const rows = [];
  let id=1;
  for (let cIdx=0;cIdx<countries.length;cIdx++){
    const cnt = 3;
    for (let j=0;j<cnt;j++){
      rows.push([id, cIdx+1, sample(cities) + (j+1)]);
      id++;
    }
  }
  generateSimpleCsv('cities.csv', ['id','country_id','name'], rows);
}

// amenities
{
  const rows = amenities.map((n,i) => [i+1,n]);
  generateSimpleCsv('amenities.csv', ['id','name'], rows);
}

// hosts (one host per some users)
const HOSTS = FORCE_ALL_2M ? Math.max(2000000, Math.floor(NUM_LISTINGS * 1)) : Math.max( Math.floor(NUM_LISTINGS * 0.2), NUM_LISTINGS < 10000 ? 1000 : 10000 );
{
  const rows = [];
  for (let i=1;i<=HOSTS;i++){
    const user_id = ((i-1) % USERS) + 1;
    const location = sample(cities) + ', ' + sample(countries);
    const is_superhost = rng() < 0.05 ? 1 : 0;
    const response_rate = (rng()*100).toFixed(2);
    const since = new Date(Date.now() - Math.floor(rng()*5*365*24*3600*1000)).toISOString().slice(0,10);
    const profile_pic = '';
    const phone_verified = rng() < 0.5 ? 1 : 0;
    const about = '';
    rows.push([i, user_id, location, is_superhost, response_rate, since, profile_pic, phone_verified, about]);
  }
  generateSimpleCsv('hosts.csv', ['id','user_id','location','is_superhost','response_rate','since','profile_pic','phone_verified','about'], rows);
}

// listings - big table
{
  const rows = [];
  let id = 1;
  const cityCount = countries.length * 3;
  for (; id<=NUM_LISTINGS; id++){
    const adjectives = ['Cozy','Modern','Spacious','Charming','Elegant','Rustic','Sunny','Quiet'];
    const types = ['Apartment','Studio','House','Loft','Villa','Cottage'];
    const name = `${sample(adjectives)} ${sample(types)} in ${sample(cities)}`;
    const host_id = ((id-1) % HOSTS) + 1;
    const city_id = (Math.floor(rng()*cityCount) + 1);
    const price = (Math.floor(rng()*300) + 20).toFixed(2);
    const room_type_id = Math.floor(rng()*roomTypes.length) + 1;
    const accommodates = Math.floor(rng()*6) + 1;
    const bedrooms = Math.floor(rng()*4) + 1;
    const beds = Math.max(1, Math.floor(rng()*5));
    rows.push([id, name, host_id, city_id, price, room_type_id, accommodates, bedrooms, beds]);
    if (id % 100000 === 0) {
      // flush to file periodically to avoid huge memory
      const path = join(OUT, 'listings.csv');
      const header = ['id','name','host_id','city_id','price','room_type_id','accommodates','bedrooms','beds'];
      const chunk = rows.map(r=>r.map(csvEscape).join(',')).join('\n') + '\n';
      if (!existsSync(path)) writeFileSync(path, header.join(',') + '\n' + chunk);
      else writeFileSync(path, chunk, { flag: 'a' });
      console.log('Flushed', id, 'listings');
      rows.length = 0;
    }
  }
  // final flush
  const path = join(OUT, 'listings.csv');
  const header = ['id','name','host_id','city_id','price','room_type_id','accommodates','bedrooms','beds'];
  const chunk = rows.map(r=>r.map(csvEscape).join(',')).join('\n');
  if (!existsSync(path)) writeFileSync(path, header.join(',') + '\n' + chunk);
  else if (chunk.length) writeFileSync(path, '\n' + chunk, { flag: 'a' });
  console.log('Wrote listings up to', NUM_LISTINGS);
}

// listing_amenities - sample some amenities per listing, write in streaming fashion
{
  const path = join(OUT, 'listing_amenities.csv');
  const header = ['listing_id','amenity_id'];
  writeFileSync(path, header.join(',') + '\n');
  for (let i=1;i<=NUM_LISTINGS;i++){
    // assign 1-4 amenities
    const count = Math.floor(rng()*4) + 1;
    const used = new Set();
    for (let k=0;k<count;k++){
      let a = Math.floor(rng()*amenities.length) + 1;
      if (used.has(a)) continue;
      used.add(a);
      writeFileSync(path, `${i},${a}\n`, { flag: 'a' });
    }
    if (i % 500000 === 0) console.log('listing_amenities progress', i);
  }
  console.log('Wrote listing_amenities');
}

// reviews - ensure total reviews >= 2M if FORCE_ALL_2M
{
  const path = join(OUT, 'reviews.csv');
  const header = ['id','listing_id','reviewer_id','reviewed_at','rating','comment','accuracy','cleanliness'];
  writeFileSync(path, header.join(',') + '\n');

  // target total reviews
  const targetReviews = FORCE_ALL_2M ? Math.max(2000000, NUM_LISTINGS) : Math.floor(NUM_LISTINGS * 1.2);
  let id = 1;
  let written = 0;
  for (let listing=1; listing<=NUM_LISTINGS && written < targetReviews; listing++){
    // allocate roughly evenly but randomize
    const maxPer = 3;
    const reviewsCount = Math.max(1, Math.floor(rng()*maxPer));
    for (let r=0;r<reviewsCount && written < targetReviews;r++){
      const reviewer_id = Math.floor(rng()*USERS)+1;
      const reviewed_at = new Date(Date.now() - Math.floor(rng()*3*365*24*3600*1000)).toISOString().slice(0,10);
      const rating = (Math.round((rng()*5)*100)/100).toFixed(2);
      const comment = '';
      const accuracy = rating;
      const cleanliness = rating;
      writeFileSync(path, `${id},${listing},${reviewer_id},${reviewed_at},${rating},"${comment}",${accuracy},${cleanliness}\n`, { flag: 'a' });
      id++; written++;
    }
    if (listing % 500000 === 0) console.log('reviews progress', listing, 'written', written);
  }
  console.log('Wrote reviews', written);
}


// bookings - if FORCE_ALL_2M ensure bookings >=2M (one per listing is reasonable)
{
  const path = join(OUT, 'bookings.csv');
  const header = ['id','user_id','listing_id','check_in','check_out','guests','status','created_at'];
  writeFileSync(path, header.join(',') + '\n');
  let id = 1;
  const targetBookings = FORCE_ALL_2M ? Math.max(2000000, NUM_LISTINGS) : Math.floor(NUM_LISTINGS * 0.6);
  for (let listing=1; listing<=targetBookings; listing++){
    const user_id = Math.floor(rng()*USERS) + 1;
    const check_in_date = new Date(Date.now() - Math.floor(rng()*365*24*3600*1000));
    const check_out_date = new Date(check_in_date.getTime() + (Math.floor(rng()*14)+1)*24*3600*1000);
    const check_in = check_in_date.toISOString().slice(0,10);
    const check_out = check_out_date.toISOString().slice(0,10);
    const guests = Math.floor(rng()*4)+1;
    const status = sample(['pending','confirmed','cancelled']);
    const created_at = new Date(check_in_date.getTime() - Math.floor(rng()*30*24*3600*1000)).toISOString().slice(0,19).replace('T',' ');
    writeFileSync(path, `${id},${user_id},${listing},${check_in},${check_out},${guests},${status},${created_at}\n`, { flag: 'a' });
    id++;
    if (listing % 500000 === 0) console.log('bookings progress', listing);
  }
  console.log('Wrote bookings', id-1);
}

// Optionally produce a generate-sql file with LOAD DATA statements
if (GENERATE_SQL){
  const sqlPath = join(OUT, 'load_data.sql');
  const lines = [];
  const files = ['countries.csv','cities.csv','room_types.csv','amenities.csv','users.csv','hosts.csv','listings.csv','listing_amenities.csv','reviews.csv','bookings.csv'];
  for (const f of files){
    lines.push(`SET GLOBAL local_infile=1;`);
    lines.push(`LOAD DATA LOCAL INFILE '${f}' INTO TABLE ${f.replace('.csv','')} FIELDS TERMINATED BY ',' ENCLOSED BY '"' LINES TERMINATED BY '\n' IGNORE 1 LINES;`);
  }
  writeFileSync(sqlPath, lines.join('\n') + '\n');
  console.log('Wrote', sqlPath);
}
console.log('Seed generation complete. Files in', OUT);
