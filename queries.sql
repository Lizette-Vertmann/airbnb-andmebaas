-- ============================================================
--  Airbnb projekti kasulikud SELECT päringud
--  Fail: queries.sql
--  Autor: Lizette Vertmann
--  Kirjeldus: 6 relevantsel äriloogikal põhinevat päringut,
--  mis annavad kasulikku infot Airbnb-laadses süsteemis
-- ============================================================


-- ============================================================
-- 1️⃣ Leia aktiivsed kuulutused koos hosti ja asukohainfo-ga
-- ------------------------------------------------------------
-- Eesmärk: kuvada kasutajale otsingu tulemustes saadavad majutused
-- Oodatav tulemus: nimekiri majutustest koos hinnaga, asukohaga ja hostiga
-- ============================================================

SELECT 
    l.id AS listing_id,
    l.name AS listing_name,
    c.name AS city,
    co.name AS country,
    r.name AS room_type,
    l.price AS price_per_night,
    h.location AS host_location
FROM listings l
JOIN cities c ON l.city_id = c.id
JOIN countries co ON c.country_id = co.id
JOIN hosts h ON l.host_id = h.id
JOIN room_types r ON l.room_type_id = r.id
ORDER BY l.price ASC
LIMIT 20;


-- ============================================================
-- 2️⃣ Leia populaarseimad kuulutused (enim broneeringuid)
-- ------------------------------------------------------------
-- Eesmärk: näidata administraatorile või hostile, millised majutused on kõige populaarsemad
-- Oodatav tulemus: top 10 kuulutust koos broneeringute arvuga ja hosti nimega
-- ============================================================

SELECT 
    l.id AS listing_id,
    l.name AS listing_name,
    u.name AS host_name,
    COUNT(b.id) AS total_bookings
FROM listings l
JOIN hosts h ON l.host_id = h.id
JOIN users u ON h.user_id = u.id
JOIN bookings b ON l.id = b.listing_id
GROUP BY l.id, l.name, u.name
HAVING COUNT(b.id) > 0
ORDER BY total_bookings DESC
LIMIT 10;


-- ============================================================
-- 3️⃣ Leia kasutajad, kes on broneerinud kõige rohkem majutusi
-- ------------------------------------------------------------
-- Eesmärk: tuvastada aktiivseimad külalised (võib kasutada lojaalsusprogrammides)
-- Oodatav tulemus: top 10 kasutajat koos broneeringute arvuga
-- ============================================================

SELECT 
    u.id AS user_id,
    u.name AS user_name,
    COUNT(b.id) AS total_bookings
FROM users u
JOIN bookings b ON u.id = b.user_id
GROUP BY u.id, u.name
ORDER BY total_bookings DESC
LIMIT 10;


-- ============================================================
-- 4️⃣ Leia linnad, kus keskmine majutuse hind on kõige kõrgem
-- ------------------------------------------------------------
-- Eesmärk: analüüsida hinnataset ja turutaset erinevates linnades
-- Oodatav tulemus: linnad koos riigi ja keskmise hinnaga, kallimad eespool
-- ============================================================

SELECT 
    c.name AS city,
    co.name AS country,
    ROUND(AVG(l.price), 2) AS avg_price_per_night,
    COUNT(l.id) AS total_listings
FROM listings l
JOIN cities c ON l.city_id = c.id
JOIN countries co ON c.country_id = co.id
GROUP BY c.id, c.name, co.name
ORDER BY avg_price_per_night DESC;


-- ============================================================
-- 5️⃣ Leia kuulutused, mille keskmine hinnang on alla 3 tärni
-- ------------------------------------------------------------
-- Eesmärk: tuvastada madala kvaliteediga majutused, mida tuleks parendada
-- Oodatav tulemus: kuulutused koos keskmise hinnangu ja arvustuste arvuga
-- ============================================================

SELECT 
    l.id AS listing_id,
    l.name AS listing_name,
    ROUND(AVG(r.rating), 2) AS avg_rating,
    COUNT(r.id) AS total_reviews
FROM listings l
JOIN reviews r ON l.id = r.listing_id
GROUP BY l.id, l.name
HAVING AVG(r.rating) < 3
ORDER BY avg_rating ASC;


-- ============================================================
-- 6️⃣ Leia kuulutused, mida pole kordagi broneeritud
-- ------------------------------------------------------------
-- Eesmärk: kuvada majutused, mis ei ole saanud ühtegi broneeringut (madal nõudlus)
-- Oodatav tulemus: nimekiri kuulutustest, millel puuduvad broneeringud
-- ============================================================

SELECT 
    l.id AS listing_id,
    l.name AS listing_name,
    l.price AS price_per_night,
    c.name AS city,
    co.name AS country
FROM listings l
JOIN cities c ON l.city_id = c.id
JOIN countries co ON c.country_id = co.id
LEFT JOIN bookings b ON l.id = b.listing_id
WHERE b.id IS NULL
ORDER BY l.price DESC;

-- ============================================================
-- 📘 Lõpp
-- Kõik päringud kasutavad sinu andmebaasi tegelikke tabeleid ja annavad kasulikku infot
-- ============================================================

