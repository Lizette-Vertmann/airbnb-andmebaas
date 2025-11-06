# Airbnb andmebaas

## Ülevaade

See projekt sisaldab Node.js-põhist seemneskripti, mis genereerib ja sisestab suures mahus testandmeid MySQL andmebaasi, mis modelleerib Airbnb-laadset platvormi.

---

## Eeltingimused

- Node.js (v14+ soovitatav)
- MySQL server (InnoDB tabelitega)
- Andmebaasi kasutaja ja parool, kellel on vajalikud õigused andmete loomisel ja kustutamisel

---

## Andmebaasi skeem

Enne seemneskripti käivitamist tuleb luua andmebaas ning tabelid. Minul on selleks `dump.sql` fail.

---
## Docker Compose käivitamine

Kasutage projekti juurkaustas olevat `docker-compose.yml` faili.

Käivitamine:

```bash
docker compose up --build
```
See käsu jooksutab MySQL konteineri, loob andmebaasi dump.sql põhjal ja käivitab seejärel seemneskripti, mis genereerib vajalikud andmed.
