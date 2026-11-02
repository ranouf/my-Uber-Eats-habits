export class UberEatsApiError extends Error {
  constructor(operation, httpStatus, details) {
    super(
      httpStatus === 401 || httpStatus === 403
        ? "Reconnectez-vous à Uber Eats, puis actualisez les commandes."
        : httpStatus === 200
          ? "Uber Eats n’a pas accepté la demande. Actualisez et réessayez."
          : "Uber Eats ne peut pas traiter la demande pour le moment.",
    );
    this.name = "UberEatsApiError";
    this.operation = operation;
    this.httpStatus = httpStatus;
    this.details = details;
  }
}

export function createApiInterceptor(localeCode, fetcher = globalThis.fetch.bind(globalThis)) {
  return async (input, options) => {
    const url = new URL(input);
    if (url.origin !== "https://www.ubereats.com" || !url.pathname.startsWith("/_p/api/")) {
      return fetcher(input, options);
    }
    url.searchParams.set("localeCode", localeCode);
    const headers = new Headers(options.headers);
    headers.set("x-csrf-token", "x");
    const response = await fetcher(url.href, { ...options, credentials: "same-origin", headers });
    const operation = url.pathname.split("/").at(-1);
    if (!response.ok) throw new UberEatsApiError(operation, response.status, undefined);
    const payload = await response.clone().json();
    if (payload.status !== "success") {
      throw new UberEatsApiError(operation, response.status, payload.data);
    }
    return response;
  };
}
