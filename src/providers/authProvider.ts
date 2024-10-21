import { type AuthProvider, type UserIdentity } from 'ra-core'

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
    logoutUrl = 'http://localhost:8001/api/auth/logout',
    identityUrl = 'http://localhost:8001/api/accounts/who-am-i/',
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
    getIdentity: async () => {
      const authToken = getParsedAuthToken()

      const request = new Request(identityUrl, {
        method: 'GET',
        ...(authToken && {headers: new Headers({ Authorization: `Token ${authToken?.token}` })})
      })
      const response = await fetch(request)
      if (response.ok) {
        const responseJson = await response.json()
        const name = [responseJson.data.attributes.firstName, responseJson.data.attributes.lastName]

        const fullName = name.filter(n => n !== undefined).join(" ")

        const userIdentity: UserIdentity = {
          id: responseJson.data.id,
          fullName: fullName !== " " && fullName || responseJson.data.attributes.username
        }
        return userIdentity
      }
      if (response.headers.get('content-type') !== 'application/json') {
        throw new Error(response.statusText)
      }

      const json = await response.json()
      const error = json.non_field_errors
      throw new Error(error ?? response.statusText)

    }
  }
}

export default tokenAuthProvider
