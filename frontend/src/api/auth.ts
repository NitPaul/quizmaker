import { api } from './client'
import type { User } from '../store/auth'

export interface LoginPayload {
  email: string
  password: string
}

export interface RegisterPayload {
  email: string
  password: string
  first_name?: string
  last_name?: string
}

export interface TokenPair {
  access: string
  refresh: string
}

export async function login(payload: LoginPayload): Promise<TokenPair> {
  const { data } = await api.post<TokenPair>('/auth/login/', payload)
  return data
}

export async function register(payload: RegisterPayload): Promise<User> {
  const { data } = await api.post<User>('/auth/register/', payload)
  return data
}

export async function fetchMe(): Promise<User> {
  const { data } = await api.get<User>('/auth/me/')
  return data
}
