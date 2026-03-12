interface ErrorContext {
  component?: string
  action?: string
  provider?: string
  [key: string]: unknown
}

interface ErrorEntry {
  timestamp: number
  message: string
  stack?: string
  context: ErrorContext
}

const MAX_ERRORS = 50
const errorLog: ErrorEntry[] = []

export function trackError(error: unknown, context: ErrorContext = {}): void {
  const entry: ErrorEntry = {
    timestamp: Date.now(),
    message: error instanceof Error ? error.message : String(error),
    stack: error instanceof Error ? error.stack : undefined,
    context,
  }

  errorLog.push(entry)
  if (errorLog.length > MAX_ERRORS) {
    errorLog.shift()
  }

  console.error(`[WordGPT+] ${entry.message}`, context, error)
}

export function getRecentErrors(count = 10): ErrorEntry[] {
  return errorLog.slice(-count)
}

export function clearErrors(): void {
  errorLog.length = 0
}

export function installGlobalErrorHandler(): void {
  window.addEventListener('error', event => {
    trackError(event.error || event.message, {
      component: 'global',
      action: 'uncaughtError',
    })
  })

  window.addEventListener('unhandledrejection', event => {
    trackError(event.reason, {
      component: 'global',
      action: 'unhandledRejection',
    })
  })
}
