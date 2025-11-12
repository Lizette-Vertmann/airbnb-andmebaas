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

