import request from '@/utils/request'


export interface accountData {
  "Bonus": {
    "bonus_to_mb_rate": number,
    'min_redeem_bonus_amount': number,
  },
  "AdMining": {
    "limit_per_day": number
  },
  "mb_airdrop": {
    "min_redeem_mis_amount": number
  }
}

/**
 * get system configuration
 */
export async function fetchAccountData(): Promise<accountData> {
  const { data } = await request({
    url: '/v1/mining/config',
  })
  return data
}

/**
 * get user account JWT token
 */
export async function signin(auth: string): Promise<{
  token: string,
  is_created: boolean
}> {
  const { data } = await request({
    url: '/v1/signin',
    method: 'POST',
    data: {
      user_authz: { auth }
    }
  })
  return data
}

/**
 * fetch bonus count for user account
 */
export async function fetchBonusCount(): Promise<{"bonus": string}> {
  const { data } = await request({
    url: '/v1/mining/bonus'
  })
  return data
}

/**
 * redeem bonus count
 */
export async function redeemBonusCount(bonus: number): Promise<boolean> {
  const { data } = await request({
    url: '/v1/mining/redeem_bonus',
    method: 'post',
    data: {
      bonus
    }
  })
  return data
}

export interface checkMBairdropData {
  "misesid": string,
  "total_airdrop_limit": number,
  "current_airdrop_limit": number, 
  "current_airdrop": number 
}

/**
 * check mises account
 */
export async function checkMisesAccount(misesid: string): Promise<checkMBairdropData> {
  const { data } = await request({
    url: `/v1/mb_airdrop/user/${misesid}`
  })
  return data
}

export interface paramsData {
  receive_address: string,
  nonce: string,
  misesid: string,
  pubkey: string,
  sig: string
}
/**
 * claim $MB
 */
export async function claimAirdrop(params: paramsData): Promise<void> {
  const { data } = await request({
    url: `/v1/mb_airdrop/claim`,
    params
  })
  return data
}

