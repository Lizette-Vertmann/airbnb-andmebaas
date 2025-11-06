FROM node:18

WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .

CMD ["node", "seeds/seemneskript.js", "--out", "data", "--listings", "1000"]
