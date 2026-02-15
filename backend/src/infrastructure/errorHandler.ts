import type { DomainError, ErrorContext } from '../domain/types/errors';
import { toErrorContext } from '../domain/types/errors';

interface SocketLike {
  emit(event: string, data: unknown): void;
}

export function handleError(socket: SocketLike, error: DomainError, traceId: string): void {
  const context = toErrorContext(error, traceId);

  logStructured(context);

  socket.emit('error', {
    code: context.code,
    message: context.userMessage,
    retryable: context.retryable,
  });
}

function logStructured(context: ErrorContext): void {
  const entry = {
    timestamp: new Date().toISOString(),
    level: 'error',
    category: context.category,
    code: context.code,
    message: context.message,
    traceId: context.traceId,
  };
  console.error(JSON.stringify(entry));
}

export async function retryWithBackoff<T>(
  operation: () => Promise<T>,
  maxRetries: number,
  baseDelay = 1000
): Promise<T> {
  let lastError: unknown;
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;
      if (attempt < maxRetries) {
        const delay = baseDelay * 2 ** attempt;
        await sleep(delay);
      }
    }
  }
  throw lastError;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
