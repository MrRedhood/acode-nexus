const CACHE_KEY =
  "acode_nexus_context_cache";

const REGISTRY_URL =
  "https://raw.githubusercontent.com/MRREDHOOD/acode-nexus/main/model-contexts.json";

export default class ContextService {
  static getCache() {
    try {
      const raw =
        localStorage.getItem(
          CACHE_KEY
        );

      if (!raw) {
        return {};
      }

      const parsed =
        JSON.parse(raw);

      if (
        !parsed ||
        typeof parsed !==
          "object"
      ) {
        return {};
      }

      return parsed;
    } catch (error) {
      console.error(
        "[ContextService] Cache read failed:",
        error
      );

      return {};
    }
  }

  static saveCache(cache) {
    try {
      localStorage.setItem(
        CACHE_KEY,
        JSON.stringify(cache)
      );
    } catch (error) {
      console.error(
        "[ContextService] Cache save failed:",
        error
      );
    }
  }

  static getCacheKey(
    provider,
    model
  ) {
    return `${provider}:${model}`;
  }

  static async fetchRegistry() {
    try {
      const response =
        await fetch(
          REGISTRY_URL
        );

      if (!response.ok) {
        throw new Error(
          `Registry fetch failed: ${response.status}`
        );
      }

      const data =
        await response.json();

      if (
        !data ||
        typeof data !==
          "object"
      ) {
        return null;
      }

      return data;
    } catch (error) {
      console.error(
        "[ContextService] Registry fetch failed:",
        error
      );

      return null;
    }
  }

  static async getProviderContextLimit(
    provider,
    model
  ) {
    /*
      Phase 5.2:
      Provider-specific metadata lookup.

      Gemini can later be implemented here
      if we fetch model metadata with
      inputTokenLimit.
    */

    return null;
  }

  static async getContextLimit(
    provider,
    model
  ) {
    if (
      !provider ||
      !model
    ) {
      return 32000;
    }

    const cacheKey =
      this.getCacheKey(
        provider,
        model
      );

    const cache =
      this.getCache();

    if (cache[cacheKey]) {
      console.log(
        "[ContextService] Cache hit:",
        cacheKey,
        cache[cacheKey]
      );

      return cache[cacheKey];
    }

    const providerLimit =
      await this.getProviderContextLimit(
        provider,
        model
      );

    if (providerLimit) {
      cache[cacheKey] =
        providerLimit;

      this.saveCache(
        cache
      );

      console.log(
        "[ContextService] Provider hit:",
        providerLimit
      );

      return providerLimit;
    }

    const registry =
      await this.fetchRegistry();

    const registryLimit =
      registry?.[
        provider
      ]?.[model];

    if (registryLimit) {
      cache[cacheKey] =
        registryLimit;

      this.saveCache(
        cache
      );

      console.log(
        "[ContextService] Registry hit:",
        registryLimit
      );

      return registryLimit;
    }

    const fallback =
      32000;

    cache[cacheKey] =
      fallback;

    this.saveCache(
      cache
    );

    console.log(
      "[ContextService] Fallback:",
      fallback
    );

    return fallback;
  }
}