# Airbnb andmebaas

## Ülevaade

See projekt sisaldab Node.js-põhist seemneskripti, mis genereerib ja sisestab suures mahus testandmeid MySQL andmebaasi, mis modelleerib Airbnb-laadset platvormi.

---

## Eeltingimused

- Node.js (v14+ soovitatav)
- MySQL server (InnoDB tabelitega)
- Andmebaasi kasutaja ja parool, kellel on vajalikud õigused andmete loomisel ja kustutamisel

---

# Andmebaasi skeem

Enne seemneskripti käivitamist tuleb luua andmebaas ning tabelid.
Minul on selleks dump.sql fail

# Dockeris käivitamine

Projekti saab täielikult käivitada Docker Compose abil.
Veendu, et failid dump.sql, seed.js ja docker-compose.yml asuvad samas kaustas.

docker-compose.yml näidis:

```
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
```
# Käivitamine nullist:
```docker compose up --build```

See käsu jooksutab MySQL konteineri, loob andmebaasi dump.sql põhjal ja käivitab seejärel seemneskripti, mis genereerib vajalikud andmed.
