import { type AuthProvider } from 'ra-core'

export interface Options {
  loginUrl?: string
  logoutUrl?: string

}

export interface LoginParams {
  username: string
  password: string
}

const tokenAuthProvider = (options: Options = {}): AuthProvider => {
  const opts = {
    loginUrl: 'https://mrmap.geospatial-interoperability-solutions.eu/api/auth/login',
    logoutUrl: 'https://mrmap.geospatial-interoperability-solutions.eu/api/auth/logout',
    ...options
  }
  return {
    login: async ({ username, password }: LoginParams) => {
      const request = new Request(opts.loginUrl, {
        method: 'POST',
        headers: new Headers({ Authorization: 'Basic ' + btoa(username + ':' + password) })
      })
      const response = await fetch(request)
      if (response.ok) {
        localStorage.setItem('token', (await response.json()).token)
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
      localStorage.removeItem('token')
      await Promise.resolve()
    },
    checkAuth: async () => { (localStorage.getItem('token') != null) ? await Promise.resolve() : await Promise.reject(new Error('No token found')) },
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
