import { type AuthProvider } from 'ra-core'
import { type Dispatch, type SetStateAction } from 'react'

export interface Options {
  token: string
  tokenSetter: Dispatch<SetStateAction<any>>
  loginUrl?: string
  logoutUrl?: string

}

export interface LoginParams {
  username: string
  password: string
}

export const TOKENNAME = 'token'

const tokenAuthProvider = (
  {
    token,
    tokenSetter,
    loginUrl = 'http://localhost:8001/api/auth/login',
    logoutUrl = 'http://localhost:8001/api/auth/logout'
  }: Options
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
        tokenSetter(JSON.stringify(responseJson))
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
      tokenSetter(undefined)
      await Promise.resolve()
    },
    checkAuth: async () => {
      const authToken = (token !== undefined) ? JSON.parse(token) : undefined
      const validAuth = (authToken !== undefined) && !(new Date(authToken.tokenExpiry) > new Date())

      validAuth
        ? await Promise.resolve()
        : await Promise.reject(new Error('Your Session has expired. Please authenticate again.'))
    },
    checkError: async error => {
      const status = error.status
      if (status === 401 || status === 403) {
        localStorage.removeItem('token')
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
