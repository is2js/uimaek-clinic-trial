export function createClinicGuideRequests() {
  let current = null;

  function cancel() {
    const request = current;
    if (!request) return;
    current = null;
    clearTimeout(request.timer);
    request.controller.abort(new DOMException("Guide request cancelled", "AbortError"));
    request.finish?.();
  }

  async function run(load, { timeoutMs = 10_000, start, apply, error, finish } = {}) {
    cancel();
    const controller = new AbortController();
    const request = { controller, finish, timer: null };
    current = request;
    const cancelled = new Promise((resolve, reject) => {
      controller.signal.addEventListener("abort", () => reject(controller.signal.reason), { once: true });
    });
    request.timer = setTimeout(() => {
      controller.abort(new DOMException("Guide request timed out", "TimeoutError"));
    }, timeoutMs);
    try {
      start?.();
      const value = await Promise.race([
        Promise.resolve().then(() => {
          controller.signal.throwIfAborted();
          return load(controller.signal);
        }),
        cancelled,
      ]);
      if (current === request) apply?.(value);
    } catch (cause) {
      if (current === request) error?.(cause);
    } finally {
      clearTimeout(request.timer);
      if (current === request) {
        current = null;
        finish?.();
      }
    }
  }

  return { run, cancel };
}
