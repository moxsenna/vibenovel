const HOME_ONBOARDING_FLAG = 'vn_onboarding_done_v1'
const ONBOARDING_FLAG_PREFIX = 'vn_onboarding_'
const ONBOARDING_FLAG_SUFFIX = '_done_v1'

export const getOnboardingFlag = (tourId: string) => {
  if (tourId === 'home') return HOME_ONBOARDING_FLAG
  return `${ONBOARDING_FLAG_PREFIX}${tourId}${ONBOARDING_FLAG_SUFFIX}`
}

export const resetAllOnboardingFlags = () => {
  if (typeof localStorage === 'undefined') return

  localStorage.removeItem(HOME_ONBOARDING_FLAG)

  const keys: string[] = []
  for (let i = 0; i < localStorage.length; i += 1) {
    const key = localStorage.key(i)
    if (
      key &&
      key.startsWith(ONBOARDING_FLAG_PREFIX) &&
      key.endsWith(ONBOARDING_FLAG_SUFFIX)
    ) {
      keys.push(key)
    }
  }

  keys.forEach((key) => localStorage.removeItem(key))
}
