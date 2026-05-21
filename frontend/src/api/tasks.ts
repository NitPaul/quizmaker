import { api } from './client'

export type TaskState =
  | 'PENDING'
  | 'STARTED'
  | 'SUCCESS'
  | 'FAILURE'
  | 'RETRY'
  | 'REVOKED'

export interface TaskStatusResponse<T = unknown> {
  task_id: string
  status: TaskState
  ready: boolean
  result: T | null
  error: string | null
}

export async function fetchTaskStatus<T = unknown>(taskId: string): Promise<TaskStatusResponse<T>> {
  const { data } = await api.get<TaskStatusResponse<T>>(`/tasks/${taskId}/`)
  return data
}

export interface PollOptions {
  intervalMs?: number
  maxAttempts?: number
  onTick?: (status: TaskState) => void
}

export async function pollTask<T>(taskId: string, opts: PollOptions = {}): Promise<T> {
  const { intervalMs = 1500, maxAttempts = 120, onTick } = opts
  for (let i = 0; i < maxAttempts; i++) {
    const status = await fetchTaskStatus<T>(taskId)
    onTick?.(status.status)
    if (status.status === 'SUCCESS' && status.result !== null) {
      return status.result
    }
    if (status.status === 'FAILURE' || status.status === 'REVOKED') {
      throw new Error(status.error ?? 'Task failed')
    }
    await new Promise((r) => setTimeout(r, intervalMs))
  }
  throw new Error('Task timed out')
}
