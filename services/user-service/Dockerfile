FROM node:18-alpine

WORKDIR /app

COPY package*.json ./

# Add error handling for npm install
RUN npm install || (echo "npm install failed, retrying..." && npm install)

COPY . .

EXPOSE 3001

CMD ["node", "index.js"] 