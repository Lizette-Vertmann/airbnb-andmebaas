# Airbnb andmebaasi seemneskript

## Ülevaade

See projekt sisaldab Node.js-põhist seemneskripti, mis genereerib ja sisestab suures mahus testandmeid MySQL andmebaasi, mis modelleerib Airbnb-laadset platvormi.

## Eeltingimused

- Node.js (v14+ soovitatav)
- MySQL server (InnoDB tabelitega)
- Andmebaasi kasutaja ja parool, kellel on vajalikud õigused andmete loomisel ja kustutamisel

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

