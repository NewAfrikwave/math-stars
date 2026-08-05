export async function retryOperation<T>(
  operation: () => Promise<T>,
  retries = 2,
  wait: (milliseconds: number) => Promise<void> = (milliseconds) => new Promise((resolve) => setTimeout(resolve, milliseconds)),
): Promise<T> {
  let lastError: unknown;
  for (let attempt = 0; attempt <= retries; attempt += 1) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;
      if (attempt < retries) await wait(300 * (attempt + 1));
    }
  }
  throw lastError;
}
