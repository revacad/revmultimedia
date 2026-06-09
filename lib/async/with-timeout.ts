export class OperationTimeoutError extends Error {
  constructor(label: string, timeoutMs: number) {
    super(`${label} timed out after ${timeoutMs}ms`)
    this.name = 'OperationTimeoutError'
  }
}

export function withTimeout<T>(
  promise: Promise<T>,
  timeoutMs: number,
  label = 'Operation',
): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) => {
      setTimeout(() => reject(new OperationTimeoutError(label, timeoutMs)), timeoutMs)
    }),
  ])
}
