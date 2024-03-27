FROM node:18
WORKDIR /app
COPY . .
RUN npm install && npm run build
# EXPOSE 3000
CMD ["npm", "run", "monitor"]
# CMD ["/bin/sh", "-c", "npm run start && npm run server"]       
