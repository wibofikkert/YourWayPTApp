import React, { createContext, useContext, useReducer, useEffect, useMemo } from 'react'
import axios from 'axios'

const AuthContext = createContext(null)

const BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001/api'

function authReducer(state, action) {
  switch (action.type) {
    case 'LOGIN':
      return { ...state, trainer: action.trainer, token: action.token, loading: false }
    case 'LOGOUT':
      return { trainer: null, token: null, loading: false }
    case 'SET_LOADING':
      return { ...state, loading: action.loading }
    default:
      return state
  }
}

export function AuthProvider({ children }) {
  const [state, dispatch] = useReducer(authReducer, {
    trainer: null,
    token: localStorage.getItem('pt_token'),
    loading: true,
  })

  const api = useMemo(() => {
    const instance = axios.create({ baseURL: BASE_URL })
    if (state.token) {
      instance.defaults.headers.common['Authorization'] = `Bearer ${state.token}`
    }
    return instance
  }, [state.token])

  useEffect(() => {
    const token = localStorage.getItem('pt_token')
    if (!token) {
      dispatch({ type: 'SET_LOADING', loading: false })
      return
    }
    axios.get(`${BASE_URL}/auth/me`, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => dispatch({ type: 'LOGIN', trainer: res.data, token }))
      .catch(() => {
        localStorage.removeItem('pt_token')
        dispatch({ type: 'LOGOUT' })
      })
  }, [])

  function login({ trainer, token }) {
    localStorage.setItem('pt_token', token)
    dispatch({ type: 'LOGIN', trainer, token })
  }

  function logout() {
    localStorage.removeItem('pt_token')
    dispatch({ type: 'LOGOUT' })
  }

  return (
    <AuthContext.Provider value={{
      trainer: state.trainer,
      token: state.token,
      loading: state.loading,
      isAuthenticated: !!state.trainer,
      login,
      logout,
      api,
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider')
  return ctx
}
