# Airbnb andmebaasi seemneskript (Bun versioon)
FROM oven/bun:latest

WORKDIR /app

# Paigalda sõltuvused
COPY package.json ./
RUN bun install

# Lisa skript ja SQL failid
COPY seemneskript.js ./

# Käivita seemneskript
CMD ["bun", "run", "seemneskript.js"]
