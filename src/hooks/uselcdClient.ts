import { LCDClient } from "@terra-money/terra.js"

export const useLCDClient = () => {
  const network = {
    name: "mainnet",
    chainID: "mainnet",
    lcd: "https://rest.gw.mises.site",
    walletconnectID: 1,
  }
  const lcdClient = new LCDClient({ ...network, URL: network.lcd })

  return lcdClient
}
