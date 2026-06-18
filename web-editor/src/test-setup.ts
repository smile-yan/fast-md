
// Vitest setup: replace broken Node.js v25 native localStorage proxy
// with a working in-memory implementation
class InMemoryStorage {
  private _store: Map<string, string> = new Map()

  get length(): number {
    return this._store.size
  }

  key(index: number): string | null {
    return [...this._store.keys()][index] ?? null
  }

  getItem(key: string): string | null {
    return this._store.has(key) ? this._store.get(key)! : null
  }

  setItem(key: string, value: string): void {
    this._store.set(key, String(value))
  }

  removeItem(key: string): void {
    this._store.delete(key)
  }

  clear(): void {
    this._store.clear()
  }
}

Object.defineProperty(globalThis, 'localStorage', {
  value: new InMemoryStorage(),
  writable: true,
  configurable: true,
})

Object.defineProperty(globalThis, 'sessionStorage', {
  value: new InMemoryStorage(),
  writable: true,
  configurable: true,
})
