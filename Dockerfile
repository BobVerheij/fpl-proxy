FROM node:18

WORKDIR /app

COPY package*.json ./

RUN npm ci

COPY . .

EXPOSE 8080

CMD [ "npm", "run", "start" ]
