FROM node:14 AS deps
WORKDIR /app
COPY package.json ./
COPY package-lock.json ./
RUN npm ci

FROM node:14 AS builder
ARG filecoin_coin_type=461
ARG number_of_wallet_accounts=5
ARG api_url=/api
ARG verify_api_url=https://api.node.glif.io/rpc/v0
ARG verify_api_token


WORKDIR /app
COPY . .
COPY --from=deps /app/node_modules ./node_modules
RUN echo FILECOIN_COIN_TYPE=$filecoin_coin_type
RUN cat > .env <<EOF
FILECOIN_COIN_TYPE=$filecoin_coin_type
NUMBER_OF_WALLET_ACCOUNTS=$number_of_wallet_accounts
API_URL=$api_url
VERIFY_API_URL=$verify_api_url
VERIFY_API_TOKEN=$verify_api_token
EOF
RUN npm run build

FROM nginx as app
COPY --from=builder /app/dist /usr/share/nginx/html
COPY --from=builder /app/public /usr/share/nginx/html
