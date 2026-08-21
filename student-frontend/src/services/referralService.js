import api from './api'
import Cookies from 'js-cookie'

export const referralService = {
  getReferralData: async (userId) => {
    if (!userId && typeof window !== 'undefined') {
      userId = Cookies.get('userId') || localStorage.getItem('userId')
    }

    if (!userId) throw new Error('User ID not found')

    const response = await api.get(`/api/user/referral?userid=${userId}`)
    return response.data
  },
}

export default referralService
