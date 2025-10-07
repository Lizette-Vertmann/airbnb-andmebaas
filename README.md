# Airbnb andmebaasi seemneskript

## Ülevaade

See projekt sisaldab Node.js-põhist seemneskripti, mis genereerib ja sisestab suures mahus testandmeid MySQL andmebaasi, mis modelleerib Airbnb-laadset platvormi.

---

## Eeltingimused

- Node.js (v14+ soovitatav)
- MySQL server (InnoDB tabelitega)
- Andmebaasi kasutaja ja parool, kellel on vajalikud õigused andmete loomisel ja kustutamisel

---

## Andmebaasi skeem

Enne seemneskripti käivitamist tuleb luua andmebaas ning tabelid vastavalt järgmisele SQL skeemile:

```sql
CREATE DATABASE airbnb_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE airbnb_db;

CREATE TABLE countries (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL UNIQUE
) ENGINE=InnoDB;

CREATE TABLE cities (
  id INT AUTO_INCREMENT PRIMARY KEY,
  country_id INT NOT NULL,
  name VARCHAR(255) NOT NULL,
  FOREIGN KEY (country_id) REFERENCES countries(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE room_types (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL UNIQUE
) ENGINE=InnoDB;

CREATE TABLE amenities (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL UNIQUE
) ENGINE=InnoDB;

CREATE TABLE users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL
) ENGINE=InnoDB;

CREATE TABLE hosts (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL UNIQUE,
  location VARCHAR(255),
  is_superhost TINYINT(1),
  response_rate FLOAT,
  since DATE,
  profile_pic VARCHAR(255),
  phone_verified TINYINT(1),
  about TEXT,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE listings (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  host_id INT NOT NULL,
  city_id INT NOT NULL,
  price DECIMAL(10,2) NOT NULL,
  room_type_id INT NOT NULL,
  accommodates INT NOT NULL,
  bedrooms INT NOT NULL,
  beds INT NOT NULL,
  FOREIGN KEY (host_id) REFERENCES hosts(id) ON DELETE CASCADE,
  FOREIGN KEY (city_id) REFERENCES cities(id) ON DELETE CASCADE,
  FOREIGN KEY (room_type_id) REFERENCES room_types(id)
) ENGINE=InnoDB;

CREATE TABLE listing_amenities (
  listing_id INT NOT NULL,
  amenity_id INT NOT NULL,
  PRIMARY KEY (listing_id, amenity_id),
  FOREIGN KEY (listing_id) REFERENCES listings(id) ON DELETE CASCADE,
  FOREIGN KEY (amenity_id) REFERENCES amenities(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE reviews (
  id INT AUTO_INCREMENT PRIMARY KEY,
  listing_id INT NOT NULL,
  reviewer_id INT NOT NULL,
  reviewed_at DATE NOT NULL,
  rating FLOAT NOT NULL,
  comment TEXT,
  accuracy FLOAT,
  cleanliness FLOAT,
  FOREIGN KEY (listing_id) REFERENCES listings(id) ON DELETE CASCADE,
  FOREIGN KEY (reviewer_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE bookings (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  listing_id INT NOT NULL,
  check_in DATE NOT NULL,
  check_out DATE NOT NULL,
  guests INT NOT NULL,
  status ENUM('pending', 'confirmed', 'cancelled') NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (listing_id) REFERENCES listings(id) ON DELETE CASCADE
) ENGINE=InnoDB;


## Dockeris käivitamine

# Projekti saab täielikult käivitada Docker Compose abil.
# Veendu, et failid dump.sql, seed.js ja docker-compose.yml asuvad samas kaustas.

# docker-compose.yml näidis:

version: "3.8"
services:
  db:
    image: mysql:8
    restart: always
    environment:
      MYSQL_ROOT_PASSWORD: root
      MYSQL_DATABASE: airbnb_db
    ports:
      - "3306:3306"
    volumes:
      - ./dump.sql:/docker-entrypoint-initdb.d/dump.sql

  seed:
    build: .
    depends_on:
      - db
    environment:
      DB_HOST: db
      DB_USER: root
      DB_PASSWORD: root
      DB_NAME: airbnb_db
    command: ["node", "seed.js"]

## Käivitamine nullist:
docker compose up --build

## See käsu jooksutab MySQL konteineri, loob andmebaasi dump.sql põhjal ja käivitab seejärel seemneskripti, mis genereerib vajalikud andmed.


## Projekti kokkuvõte 
| Tabel                                            | Ligikaudne maht | Kirjeldus                                  |
| ------------------------------------------------ | --------------- | ------------------------------------------ |
| `listings`                                       | **2 000 000+**  | Põhitabel, suurim andmehulk                |
| `users`                                          | ~1 000 000      | Hostid ja külalised                        |
| `bookings`                                       | ~2 500 000      | Broneeringud, seotud `users` ja `listings` |
| `reviews`                                        | ~3 000 000      | Tagasiside kuulutustele                    |
| `hosts`                                          | ~500 000        | Hostiprofiilid                             |
| `amenities`, `cities`, `countries`, `room_types` | 50–200 rida     | Lookup-tabelid (fikseeritud väärtused)     |

## Andmete ehtsus ja terviklus

## Ehtsus: Seeder kasutab faker.js või sarnast teeki realistlike väärtuste genereerimiseks:
users.name ja users.email – juhuslikud, aga realistlikud nimed ja e-mailid
listings.price – ööhind vahemikus 25–500 €
bookings.check_in / check_out – ajaliselt loogilised kuupäevad
reviews.rating – hinnangud keskmise jaotusega (~4.2)

## Terviklus:
Kõik FK-seosed on kehtivad, orvukirjeid ei teki
Seeder loob esmalt lookup-tabelid, seejärel parent-tabelid (users, hosts, listings) ja lõpuks sõltuvad tabelid (bookings, reviews)
Võõrvõtmete kontroll toimub sisestuse ajal

## Jõudlus ja indekseering
Mass-sisestus partiidena (nt 10 000 rida korraga), et tagada suure jõudluse ja stabiilsuse
Indeksite loomine lükatakse sisestuse lõpuni:
1. Enne sisestust hoitakse alles ainult PRIMARY KEY ja FK-indeksid
2. Pärast kõigi andmete lisamist taastatakse sekundaarindeksid, näiteks:

ALTER TABLE reviews ADD INDEX idx_reviews_listing_id (listing_id);
ALTER TABLE bookings ADD INDEX idx_bookings_user_id (user_id);

## Seederi keskmine täitmise aeg:
Skeemi laadimine: ~1 minut
Seederi töö (2M+ listings): 7–10 minutit (sõltub partii suurusest ja süsteemi jõudlusest)
Indeksite taastamine: 1–2 minutit
Kokku: ~10–12 minutit
