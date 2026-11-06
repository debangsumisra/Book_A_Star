import { useQuery } from './useQuery.js'
import { fetchAccount } from '../lib/account.js'

export function useAccount(userId) {
  return useQuery(() => fetchAccount(userId), [userId], { enabled: Boolean(userId) })
}
