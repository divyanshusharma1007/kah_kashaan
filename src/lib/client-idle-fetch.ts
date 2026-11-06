export function fetchWhenIdle(
  input: RequestInfo | URL,
  init?: RequestInit,
  timeout = 1200,
): Promise<Response> {
  return new Promise((resolve, reject) => {
    let settled = false;
    const run = () => {
      if (settled) return;
      settled = true;
      fetch(input, init).then(resolve, reject);
    };

    if (typeof window !== "undefined" && "requestIdleCallback" in window) {
      window.requestIdleCallback(run, { timeout });
    } else {
      globalThis.setTimeout(run, Math.min(timeout, 250));
    }
  });
}
