FROM node:18-alpine

WORKDIR /app

COPY package*.json ./

RUN npm ci --only=production && npm cache clean --force

COPY . .

RUN npm run build

RUN npm prune --production

RUN addgroup -g 1001 -S nodejs
RUN adduser -S nestjs -u 1001

RUN chown -R nestjs:nodejs /app
USER nestjs

EXPOSE 3000

CMD ["npm", "run", "start:prod"]
