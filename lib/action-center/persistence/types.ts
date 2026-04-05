export interface ActionCenterRecord {
  id: string
  type: string
  payload: any
  createdAt: string
}

export type ReadOptions = {
  limit?: number
  afterId?: string
  cursor?: string
}

export type ReadPageResult = {
  records: ActionCenterRecord[]
  nextCursor: string | null
}

export interface ActionCenterPersistenceAdapter {
  write(records: ActionCenterRecord[]): Promise<{ written: number }>
  readAll(options?: ReadOptions): Promise<ActionCenterRecord[]>
  readPage?(options?: ReadOptions): Promise<ReadPageResult>
}
