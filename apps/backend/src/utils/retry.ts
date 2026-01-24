/**
 * Retries a function with exponential backoff.
 * @param fn The function to retry.
 * @param retries Maximum number of retries.
 * @param delay Initial delay in milliseconds.
 * @param backoff Backoff factor (multiplier for delay).
 * @returns The result of the function.
 */
export async function retry<T>(
    fn: () => Promise<T>,
    retries: number = 3,
    delay: number = 1000,
    backoff: number = 2
): Promise<T> {
    try {
        return await fn();
    } catch (error) {
        if (retries <= 0) {
            throw error;
        }
        await new Promise(resolve => setTimeout(resolve, delay));
        return retry(fn, retries - 1, delay * backoff, backoff);
    }
}
