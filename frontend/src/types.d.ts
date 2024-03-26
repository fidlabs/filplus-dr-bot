declare module '@filecoin-shipyard/lotus-client-schema';
declare module '@filecoin-shipyard/lotus-client-provider-browser';
declare module '@zondax/filecoin-signing-tools';
declare module '@zondax/ledger-filecoin';

declare module '@zondax/ledger-filecoin' {
  // eslint-disable-next-line
  class FilecoinApp extends any {
    constructor(parametr?: any)
  }
  export = FilecoinApp
}