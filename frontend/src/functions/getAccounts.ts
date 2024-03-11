import { FilecoinApp } from "@zondax/ledger-filecoin";
import { mapSeries } from 'bluebird'
import { handleErrors } from './handleErrors';

export const getAccounts = async (ledgerApp: FilecoinApp) => {
  const paths = []

  for (let i = 0; i < import.meta.env.VITE_SOME_KEY; i += 1) {
    paths.push(`m/44'/${import.meta.env.VITE_NUMBER_OF_WALLET_ACCOUNTS}'/0'/0/${i}`)
  }

  const accounts = await mapSeries(paths, async (path: any) => {
    const returnLoad = await ledgerApp.getAddressAndPubKey(path)
    const { addrString } = handleErrors(returnLoad)
    return addrString
  })

  return accounts
}