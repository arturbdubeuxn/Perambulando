FROM node:24-alpine
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .
EXPOSE 8081

ENV CI=1
CMD ["npm", "run", "web", "--", "--port", "8081"]

