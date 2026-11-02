import { createApiInterceptor } from "./api-interceptor.js";
import { UberEatsApiService } from "./api.services.js";

export function createApiClient(localeCode, fetcher = globalThis.fetch.bind(globalThis)) {
  return new UberEatsApiService(undefined, { fetch: createApiInterceptor(localeCode, fetcher) });
}
