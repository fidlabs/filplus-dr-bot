FROM 'node'
WORKDIR /app
COPY . .
RUN chmod +x /app/entrypoint.sh
RUN npm install && npm run build
# EXPOSE 3000
CMD ["npm", "run", "start"]