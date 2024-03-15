import assert from 'assert/strict';
import { LotusApi } from "./LotusApi.js";

const api = new LotusApi(
    "http://localhost:1234/rpc/v0",
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJBbGxvdyI6WyJyZWFkIiwid3JpdGUiLCJzaWduIiwiYWRtaW4iXX0.wS8xpKJACW3yOqIxusG6S3ZNsncuBu5Zu7a_KemQuF0"
);

console.log(await api.getProposalId('t1hnyroyvycwxwurtox2yauglta5yoqpj25wojypa', 't1uc6ebcxknla4lonkhcujpelsrndmiwok6k6sbta'));