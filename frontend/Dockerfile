FROM 'node' AS builder
WORKDIR /app
COPY . .
RUN npm install
RUN npm i -g vite
RUN vite build

FROM 'nginx'
COPY --from=builder /app/dist /usr/share/nginx/html
COPY --from=builder /app/nginx.conf /etc/nginx/nginx.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]