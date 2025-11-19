-- 1) Linnad, kus on kõige rohkem aktiivseid kuulutusi
SELECT 
    c.name AS city,
    co.name AS country,
    COUNT(l.id) AS total_listings,
    AVG(l.price) AS avg_price
FROM cities c
JOIN countries co ON c.country_id = co.id
JOIN listings l ON l.city_id = c.id
GROUP BY c.id, c.name, co.name
ORDER BY total_listings DESC
LIMIT 10;

-- 2) Kõige populaarsemad kuulutused broneeringute arvu järgi
SELECT 
    l.id,
    l.name,
    h.id AS host_id,
    COUNT(b.id) AS booking_count
FROM listings l
JOIN hosts h ON h.id = l.host_id
JOIN bookings b ON b.listing_id = l.id
WHERE b.status = 'confirmed'
GROUP BY l.id, l.name, h.id
ORDER BY booking_count DESC
LIMIT 20;

-- 3) Hostid, kellel on kõige kõrgem keskmine arvustuse hinne
SELECT 
    h.id AS host_id,
    u.name AS host_name,
    COUNT(r.id) AS review_count,
    AVG(r.rating) AS avg_rating
FROM hosts h
JOIN users u ON u.id = h.user_id
JOIN listings l ON l.host_id = h.id
JOIN reviews r ON r.listing_id = l.id
GROUP BY h.id, u.name
HAVING COUNT(r.id) > 50
ORDER BY avg_rating DESC
LIMIT 15;

-- 4) Külalised, kes on teinud kõige rohkem broneeringuid
SELECT 
    u.id,
    u.name,
    u.email,
    COUNT(b.id) AS total_bookings
FROM users u
JOIN bookings b ON b.user_id = u.id
WHERE b.status = 'confirmed'
GROUP BY u.id, u.name, u.email
ORDER BY total_bookings DESC
LIMIT 20;

-- 5) Kuulutused, millel pole mitte ühtegi arvustust
SELECT 
    l.id,
    l.name,
    c.name AS city,
    co.name AS country
FROM listings l
JOIN cities c ON l.city_id = c.id
JOIN countries co ON c.country_id = co.id
LEFT JOIN reviews r ON r.listing_id = l.id
WHERE r.id IS NULL
ORDER BY l.id
LIMIT 50;

-- 6) Majutuse tüüpide populaarsus ja keskmine hind
SELECT 
    rt.name AS room_type,
    COUNT(l.id) AS listings_count,
    AVG(l.price) AS avg_price,
    AVG(l.accommodates) AS avg_capacity
FROM room_types rt
LEFT JOIN listings l ON l.room_type_id = rt.id
GROUP BY rt.id, rt.name
ORDER BY listings_count DESC;
