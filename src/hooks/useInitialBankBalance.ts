import { Coins, Denom } from "@terra-money/terra.js"
/* queryKey */
const mirror = (obj: any, parentKey?: string): any => {
  return Object.entries(obj).reduce((acc, [key, value]) => {
    const next = value
      ? mirror(value, key)
      : [parentKey, key].filter(Boolean).join(".")

    return { ...acc, [key]: next }
  }, {})
}

export const queryKey = mirror({
  /* assets */
  TerraAssets: "",
  MintingAPI: "",
  TerraAPI: "",
  History: "",

  /* lcd */
  auth: { accountInfo: "" },
  bank: { balance: "", supply: "" },
  distribution: {
    rewards: "",
    communityPool: "",
    validatorCommission: "",
    withdrawAddress: "",
  },
  gov: {
    votingParams: "",
    depositParams: "",
    tallyParams: "",
    proposals: "",
    proposal: "",
    deposits: "",
    votes: "",
    tally: "",
  },
  ibc: { denomTrace: "" },
  market: { params: "" },
  oracle: { activeDenoms: "", exchangeRates: "", params: "" },
  tendermint: { nodeInfo: "" },
  staking: {
    validators: "",
    validator: "",
    delegations: "",
    delegation: "",
    unbondings: "",
    pool: "",
  },
  slashing: {
    signingInfos: "",
    signingInfo: "",
  },
  minting: {
    annualProvisions: "",
    inflation: "",
    parameters: "",
  },
  tx: { txInfo: "", create: "" },
  wasm: { contractInfo: "", contractQuery: "" },

  /* external */
  Anchor: { TotalDeposit: "", APY: "", MarketEpochState: "" },
  TNS: "",
})

  /* coin */
export const getAmount = (coins: Coins, denom: Denom, fallback = "0") => {
  if(!coins) return fallback;
  return coins.get(denom)?.amount.toString() ?? fallback
}
