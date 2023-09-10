import request from '@/utils/request'


export interface accountData {
  "Bonus": {
    "bonus_to_mb_rate": number
  },
  "AdMining": {
    "limit_per_day": number
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
export async function signin(auth: string): Promise<string> {
  const { data } = await request({
    url: '/v1/signin',
    method: 'POST',
    data: {
      user_authz: { auth }
    }
  })
  return data
}
