import { faker } from '@faker-js/faker';
import mysql from 'mysql2/promise';

const BATCH_SIZE = 10000;
const SEED = 12345;
faker.seed(SEED);

async function main() {
  const connection = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'airbnb_db',
    multipleStatements: true,
  });

  console.log('Ühendatud andmebaasi');

  await connection.query(`
    ALTER TABLE bookings DISABLE KEYS;
    ALTER TABLE reviews DISABLE KEYS;
    ALTER TABLE listings DISABLE KEYS;
    ALTER TABLE hosts DISABLE KEYS;
    ALTER TABLE listing_amenities DISABLE KEYS;
  `).catch(() => {});

  console.log('Tühjendan tabelid...');
  await connection.query(`
    SET FOREIGN_KEY_CHECKS = 0;
    TRUNCATE TABLE listing_amenities;
    TRUNCATE TABLE bookings;
    TRUNCATE TABLE reviews;
    TRUNCATE TABLE listings;
    TRUNCATE TABLE hosts;
    TRUNCATE TABLE users;
    TRUNCATE TABLE room_types;
    TRUNCATE TABLE countries;
    TRUNCATE TABLE cities;
    TRUNCATE TABLE amenities;
    SET FOREIGN_KEY_CHECKS = 1;
  `);

  console.log('Täidan lookup tabelid...');
  const roomTypes = ['Entire home/apt', 'Private room', 'Shared room', 'Hotel room'];
  for (const name of roomTypes) {
    await connection.query('INSERT INTO room_types (name) VALUES (?)', [name]);
  }

  const countries = ['Estonia', 'Latvia', 'Lithuania'];
  for (const name of countries) {
    await connection.query('INSERT INTO countries (name) VALUES (?)', [name]);
  }

  const [roomTypeRows] = await connection.query('SELECT id FROM room_types');
  const roomTypeIds = roomTypeRows.map(r => r.id);

  const [countryRows] = await connection.query('SELECT id, name FROM countries');
  const countryMap = {};
  for (const c of countryRows) countryMap[c.name] = c.id;

  console.log('Täidan linnad...');
  const cityNames = {
    Estonia: ['Tallinn', 'Tartu', 'Narva', 'Pärnu', 'Viljandi', 'Rakvere', 'Kuressaare', 'Haapsalu', 'Jõhvi', 'Valga'],
    Latvia: ['Riga', 'Daugavpils', 'Liepaja', 'Jelgava', 'Jurmala', 'Ventspils', 'Rezekne', 'Valmiera', 'Ogre', 'Cesis'],
    Lithuania: ['Vilnius', 'Kaunas', 'Klaipeda', 'Siauliai', 'Panevezys', 'Alytus', 'Marijampole', 'Utena', 'Kedainiai', 'Taurage']
  };

  for (const country in cityNames) {
    const countryId = countryMap[country];
    for (const city of cityNames[country]) {
      await connection.query('INSERT INTO cities (country_id, name) VALUES (?, ?)', [countryId, city]);
    }
  }

  const [cityRows] = await connection.query('SELECT id FROM cities');
  const cityIds = cityRows.map(c => c.id);

  console.log('Täidan amenities...');
  const amenitiesList = ['WiFi', 'Air conditioning', 'Kitchen', 'Heating', 'Washer', 'Dryer', 'Free parking', 'Pool', 'TV', 'Gym'];
  for (const name of amenitiesList) {
    await connection.query('INSERT INTO amenities (name) VALUES (?)', [name]);
  }

  const [amenitiesRows] = await connection.query('SELECT id FROM amenities');
  const amenityIds = amenitiesRows.map(a => a.id);

  const USERS_COUNT = 100000;
  console.log(`Täidan users tabelit ${USERS_COUNT} kasutajaga...`);
  for (let i = 0; i < USERS_COUNT; i += BATCH_SIZE) {
    const batch = [];
    for (let j = 0; j < BATCH_SIZE && i + j < USERS_COUNT; j++) {
      const name = faker.name.findName();
      const email = faker.internet.email(name).toLowerCase();
      const password = faker.internet.password(10); 
      batch.push([name, email, password]);
    }
    const placeholders = batch.map(() => '(?,?,?)').join(',');
    const flatValues = batch.flat();
    await connection.query(`INSERT INTO users (name, email, password) VALUES ${placeholders}`, flatValues);
    process.stdout.write(`\rSisestatud kasutajaid: ${Math.min(i + BATCH_SIZE, USERS_COUNT)}/${USERS_COUNT}`);
  }
  console.log('\nKasutajad sisestatud.');

  const [userRows] = await connection.query('SELECT id FROM users');
  const userIds = userRows.map(u => u.id);

  const HOSTS_COUNT = Math.floor(USERS_COUNT * 0.5);
  console.log(`Täidan hosts tabelit ${HOSTS_COUNT} hostiga...`);
  for (let i = 0; i < HOSTS_COUNT; i += BATCH_SIZE) {
    const batch = [];
    for (let j = 0; j < BATCH_SIZE && i + j < HOSTS_COUNT; j++) {
      const userId = userIds[i + j];
      const location = faker.address.city();
      const isSuperhost = faker.datatype.boolean() ? 1 : 0;
      const responseRate = faker.datatype.float({ min: 50, max: 100, precision: 0.01 });
      const since = faker.date.past(5).toISOString().slice(0, 10);
      const profilePic = faker.image.avatar();
      const phoneVerified = faker.datatype.boolean() ? 1 : 0;
      const about = faker.lorem.sentences(2);
      batch.push([userId, location, isSuperhost, responseRate, since, profilePic, phoneVerified, about]);
    }
    const placeholders = batch.map(() => '(?,?,?,?,?,?,?,?)').join(',');
    const flatValues = batch.flat();
    await connection.query(`INSERT INTO hosts (user_id, location, is_superhost, response_rate, since, profile_pic, phone_verified, about) VALUES ${placeholders}`, flatValues);
    process.stdout.write(`\rSisestatud hoste: ${Math.min(i + BATCH_SIZE, HOSTS_COUNT)}/${HOSTS_COUNT}`);
  }
  console.log('\nHostid sisestatud.');

  const [hostRows] = await connection.query('SELECT id FROM hosts');
  const hostIds = hostRows.map(h => h.id);

  const LISTINGS_COUNT = 200000;
  console.log(`Täidan listings tabelit ${LISTINGS_COUNT} listinguga...`);
  for (let i = 0; i < LISTINGS_COUNT; i += BATCH_SIZE) {
    const batch = [];
    for (let j = 0; j < BATCH_SIZE && i + j < LISTINGS_COUNT; j++) {
      const name = faker.company.name() + ' ' + faker.address.streetName() + ' ' + faker.datatype.uuid().slice(0, 6);
      const hostId = hostIds[(i + j) % hostIds.length];
      const cityId = cityIds[(i + j) % cityIds.length];
      const price = faker.datatype.float({ min: 20, max: 500, precision: 0.01 });
      const roomTypeId = roomTypeIds[(i + j) % roomTypeIds.length];
      const accommodates = faker.datatype.number({ min: 1, max: 10 });
      const bedrooms = faker.datatype.number({ min: 1, max: 5 });
      const beds = faker.datatype.number({ min: 1, max: 10 });
      batch.push([name, hostId, cityId, price, roomTypeId, accommodates, bedrooms, beds]);
    }
    const placeholders = batch.map(() => '(?,?,?,?,?,?,?,?)').join(',');
    const flatValues = batch.flat();
    await connection.query(`INSERT INTO listings (name, host_id, city_id, price, room_type_id, accommodates, bedrooms, beds) VALUES ${placeholders}`, flatValues);
    process.stdout.write(`\rSisestatud listinguid: ${Math.min(i + BATCH_SIZE, LISTINGS_COUNT)}/${LISTINGS_COUNT}`);
  }
  console.log('\nListings sisestatud.');

  const [listingRows] = await connection.query('SELECT id FROM listings');
  const listingIds = listingRows.map(l => l.id);

  console.log('Täidan listing_amenities seoseid...');
  for (let i = 0; i < listingIds.length; i += BATCH_SIZE) {
    const batch = [];
   
    for (let j = 0; j < BATCH_SIZE && i + j < listingIds.length; j++) {
      const listingId = listingIds[i + j];
      const amenityCount = faker.datatype.number({ min: 2, max: 5 });
      const usedAmenityIds = new Set();
      for (let k = 0; k < amenityCount; k++) {
        let aId;
        do {
          aId = amenityIds[faker.datatype.number({ min: 0, max: amenityIds.length - 1 })];
        } while (usedAmenityIds.has(aId));
        usedAmenityIds.add(aId);
        batch.push([listingId, aId]);
      }
    }
    const placeholders = batch.map(() => '(?,?)').join(',');
    const flatValues = batch.flat();
    await connection.query(`INSERT INTO listing_amenities (listing_id, amenity_id) VALUES ${placeholders}`, flatValues);
    process.stdout.write(`\rSisestatud amenities listing_amenities tabelisse: ${Math.min(i + BATCH_SIZE, listingIds.length)}/${listingIds.length}`);
  }
  console.log('\nListing amenities sisestatud.');

  const REVIEWS_COUNT = 500000;
  console.log(`Täidan reviews tabelit ${REVIEWS_COUNT} arvustusega...`);
  for (let i = 0; i < REVIEWS_COUNT; i += BATCH_SIZE) {
    const batch = [];
    for (let j = 0; j < BATCH_SIZE && i + j < REVIEWS_COUNT; j++) {
      const listingId = listingIds[(i + j) % listingIds.length];
      const reviewerId = userIds[(i + j) % userIds.length];
      const reviewedAt = faker.date.past(3).toISOString().slice(0, 10);
      const rating = faker.datatype.float({ min: 0, max: 5, precision: 0.01 });
      const comment = faker.lorem.sentences(faker.datatype.number({ min: 1, max: 3 }));
      const accuracy = faker.datatype.float({ min: 0, max: 5, precision: 0.01 });
      const cleanliness = faker.datatype.float({ min: 0, max: 5, precision: 0.01 });
      batch.push([listingId, reviewerId, reviewedAt, rating, comment, accuracy, cleanliness]);
    }
    const placeholders = batch.map(() => '(?,?,?,?,?,?,?)').join(',');
    const flatValues = batch.flat();
    await connection.query(`INSERT INTO reviews (listing_id, reviewer_id, reviewed_at, rating, comment, accuracy, cleanliness) VALUES ${placeholders}`, flatValues);
    process.stdout.write(`\rSisestatud arvustusi: ${Math.min(i + BATCH_SIZE, REVIEWS_COUNT)}/${REVIEWS_COUNT}`);
  }
  console.log('\nArvustused sisestatud.');

  const BOOKINGS_COUNT = 2000000;
  console.log(`Täidan bookings tabelit ${BOOKINGS_COUNT} broneeringuga...`);

  for (let i = 0; i < BOOKINGS_COUNT; i += BATCH_SIZE) {
    const batch = [];
    for (let j = 0; j < BATCH_SIZE && i + j < BOOKINGS_COUNT; j++) {
      const userId = userIds[faker.datatype.number({ min: 0, max: userIds.length - 1 })];
      const listingId = listingIds[faker.datatype.number({ min: 0, max: listingIds.length - 1 })];

      const checkInDate = faker.date.between('2020-01-01', '2025-12-31');
      const stayLength = faker.datatype.number({ min: 1, max: 14 });
      const checkOutDate = new Date(checkInDate);
      checkOutDate.setDate(checkOutDate.getDate() + stayLength);

      const guests = faker.datatype.number({ min: 1, max: 10 });
      const statusOptions = ['pending', 'confirmed', 'cancelled'];
      const status = statusOptions[faker.datatype.number({ min: 0, max: 2 })];

      batch.push([
        userId,
        listingId,
        checkInDate.toISOString().slice(0, 10),
        checkOutDate.toISOString().slice(0, 10),
        guests,
        status
      ]);
    }
    const placeholders = batch.map(() => '(?,?,?,?,?,?)').join(',');
    const flatValues = batch.flat();
    await connection.query(`INSERT INTO bookings (user_id, listing_id, check_in, check_out, guests, status) VALUES ${placeholders}`, flatValues);
    process.stdout.write(`\rSisestatud broneeringuid: ${Math.min(i + BATCH_SIZE, BOOKINGS_COUNT)}/${BOOKINGS_COUNT}`);
  }
  console.log('\nBroneeringud sisestatud.');

  console.log('Taastan indeksid ja võtmed...');
  await connection.query(`
    ALTER TABLE bookings ENABLE KEYS;
    ALTER TABLE reviews ENABLE KEYS;
    ALTER TABLE listings ENABLE KEYS;
    ALTER TABLE hosts ENABLE KEYS;
    ALTER TABLE listing_amenities ENABLE KEYS;
  `).catch(() => {});

  await connection.end();
  console.log('Seemneskript lõpetatud edukalt.');
}

main().catch(e => {
  console.error('Viga seemneskriptis:', e);
});

