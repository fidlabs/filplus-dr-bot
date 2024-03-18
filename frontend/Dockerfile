FROM 'node' AS builder
WORKDIR /app
COPY . .
RUN npm ci
CMD ["npx", "vite",  "--port",  "80"]
