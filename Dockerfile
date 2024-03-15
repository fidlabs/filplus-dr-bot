FROM 'node'
WORKDIR /app
COPY . .
RUN npm install && npm run build
# EXPOSE 3000
CMD ["npm", "run", "start"]
# CMD ["/bin/sh", "-c", "npm run start && npm run server"]       