import { type AuthProvider } from 'ra-core'

export interface LoginParams {
  username: string
  password: string
}

export interface AuthToken {
  token: string
  expiry: string
}

export const getParsedAuthToken = (): AuthToken | undefined => {
  const tokenObjectString= window.localStorage.getItem(TOKENNAME)
  if (tokenObjectString !== null) {
      return JSON.parse(tokenObjectString)
  }
  return undefined
}

export const TOKENNAME = 'mrmap.token'

const tokenAuthProvider = (
    loginUrl = 'http://localhost:8001/api/auth/login',
    logoutUrl = 'http://localhost:8001/api/auth/logout'
): AuthProvider => {
  return {
    login: async ({ username, password }: LoginParams) => {
      const request = new Request(loginUrl, {
        method: 'POST',
        headers: new Headers({ Authorization: 'Basic ' + btoa(username + ':' + password) })
      })
      const response = await fetch(request)
      if (response.ok) {
        const responseJson = await response.json()
        window.localStorage.setItem(TOKENNAME, JSON.stringify(responseJson))
        return
      }
      if (response.headers.get('content-type') !== 'application/json') {
        throw new Error(response.statusText)
      }

      const json = await response.json()
      const error = json.non_field_errors
      throw new Error(error ?? response.statusText)
    },
    logout: async () => {
      // TODO: call logoutUrl with token
      window.localStorage.removeItem(TOKENNAME)
      await Promise.resolve()
    },
    checkAuth: async () => {
      const authToken = getParsedAuthToken()
      const expired = authToken !== undefined ? new Date(authToken.expiry) < new Date(): true
      expired
        ? await Promise.reject(new Error('Your Session has expired. Please authenticate again.'))
        : await Promise.resolve()
    },
    checkError: async error => {
      const status = error.status
      if (status === 401) {
        window.localStorage.removeItem(TOKENNAME)
        await Promise.reject(new Error('unauthorized')); return
      }
      await Promise.resolve()
    },
    getPermissions: async () => {
      await Promise.resolve()
    },
    getIdentity: () => {
      // try {
      //     const { id, fullName, avatar } = JSON.parse(localStorage.getItem('auth'));
      //     return Promise.resolve({ id, fullName, avatar });
      // } catch (error) {
      //     return Promise.reject(error);
      // }
    }
  }
}

export default tokenAuthProvider
