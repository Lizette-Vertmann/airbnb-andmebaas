# Airbnb andmebaas

## Ülevaade

See projekt sisaldab Node.js-põhist seemneskripti, mis genereerib ja sisestab suures mahus testandmeid MySQL andmebaasi, mis modelleerib Airbnb-laadset platvormi.

---

## Eeltingimused
Docker ja Docker Compose
Bun (skript kasutab #!/usr/bin/env bun)
MySQL 8.0
- Node.js (v14+ soovitatav)
- MySQL server (InnoDB tabelitega)
- Andmebaasi kasutaja ja parool, kellel on vajalikud õigused andmete loomisel ja kustutamisel

---

## Andmebaasi skeem

Enne seemneskripti käivitamist tuleb luua andmebaas ning tabelid. Minul on selleks `dump.sql` fail.

---
## Docker Compose käivitamine

Kasutage projekti juurkaustas olevat `docker-compose.yml` faili.

1.Käivita MySQL konteiner:
```bash
docker compose up -d db
```
2.Laadi skeem dump.sql failist:
```bash
docker exec -i <container_name> mysql -u root -proot airbnb_db < dump.sql
```
3. Genereeri CSV failid:
```bash
bun run seemneskript.js --out data --listings 2000000 --generate-sql 1
```
4. Laadi CSV failid andmebaasi:
 ```bash  
docker cp data <container_name>:/data
docker exec -i <container_name> mysql -u root -proot airbnb_db < /data/load_data.sql
```

## Oodatud tulemused

- listings ridade arv ≥ 2 000 000, peamine mitte-lookup
- users ridade arv ~500 000, ostjad + hostid
- hosts ridade arv ~100 000, viitavad users
- reviews	ridade arv ≥ 2 000 000,	keskmiselt 1–3 per listing
- bookings	ridade arv ≥ 2 000 000,	~0.6 per listing
- listing_amenities	ridade arv ~6 000 000,	1–4 mugavust per listing
- lookup tabelid	rida<de arv väikesed,	nt room_types, countries, cities, amenities

## Kestus
- CSV genereerimine: ~10–15 minutit (sõltub masinast)
- Andmebaasi laadimine: ~20 minutit

## Ehtsuse kirjeldus

- Kasutajanimed: ees- ja perekonnanimede kombinatsioonid
- E-kirjad: realistlikud formaadid (nimi+ID@example.com)
- Paroolid: räsitud vormis (testiks piisav)
- Listingute nimed: genereeritakse kombinatsioonina (nt “Cozy Apartment in Tallinn”, “Modern Loft in Riga”)
- Hinnad: vahemikus 20–320 €/öö
- Kuupäevad: viimase 3–5 aasta jooksul
- Hostide asukohad: linn + riik kombinatsioonid

## Terviklikkus

- Võõrvõtmed kehtivad, orvukirjeid ei ole
- Sisestusjärjekord loogiline: lookup → users → hosts → listings → reviews/bookings → amenities
- Indeksid taastatakse pärast mass-sisestust
- CSV laadimine toimub partiidena (LOAD DATA INFILE)

## Reprodutseeritavus

- Seemneskript kasutab fikseeritud seemet (default: 42)
- Sama seemne korral genereeritakse identne andmestik

## Kasulikud päringud

Failis queries.sql on 6 äriloogikal põhinevat SELECT-päringut:
1. Aktiivsed kuulutused koos hosti ja asukohaga
2. Populaarseimad kuulutused (enim broneeringuid)
3. Aktiivseimad külalised (kõige rohkem broneeringuid)
4. Linnad, kus keskmine hind on kõrgeim
5. Kuulutused, mille keskmine hinnang < 3
6. Kuulutused, mida pole kordagi broneeritud

## Repo struktuur

airbnb-andmebaas/
- dump.sql
- seemneskript.js
- queries.sql
- Dockerfile
- docker-compose.yml
- package.json
- README.m
