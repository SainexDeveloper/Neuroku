import { useAuth } from '../context/AuthContext'

export function useRequireAuth(openAuthModal) {
  const { isAuth } = useAuth()

  return (action) => {
    if (!isAuth) {
      openAuthModal()
      return false
    }

    action()
    return true
  }
}