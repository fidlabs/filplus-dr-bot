FROM 'node' AS builder
WORKDIR /app
COPY . .
RUN npm install
RUN npm i -g vite
EXPOSE 8000
CMD [ "vite", "dev" ]
