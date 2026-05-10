# pull the base image
FROM node:16-alpine

# Create app directory
WORKDIR /app

# Install app dependencies
COPY package*.json ./

# Resolve conflict with libraries compatibility
RUN npm install --legacy-peer-deps

COPY . .


RUN npm run build
RUN cd dist
# EXPOSE 8080

CMD ["node","./dist/main.js"]
