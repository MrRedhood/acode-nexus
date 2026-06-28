const REGISTRY_URL =
  "https://raw.githubusercontent.com/MrRedhood/acode-nexus/main/model-contexts.json";

const CACHE_KEY =
  "acode_nexus_model_context_cache";

export default class ContextService {
  static loadCache() {
    try {
      const raw =
        localStorage.getItem(
          CACHE_KEY
        );

      if (!raw) {
        return {};
      }

      return JSON.parse(raw);
    } catch (error) {
      console.error(
        "[ContextService] cache load failed",
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
        "[ContextService] cache save failed",
        error
      );
    }
  }

  static async fetchRegistry() {
    const response =
      await fetch(
        REGISTRY_URL
      );

    if (!response.ok) {
      throw new Error(
        `Registry fetch failed: ${response.status}`
      );
    }

    return await response.json();
  }

  static normalizeModelName(
    model
  ) {
    return (
      model || ""
    ).trim();
  }

  static async getContextLimit(
    provider,
    model
  ) {
    provider =
      (provider || "")
        .toLowerCase()
        .trim();

    model =
      this.normalizeModelName(
        model
      );

    if (
      !provider ||
      !model
    ) {
      return 32000;
    }

    const cache =
      this.loadCache();

    if (
      cache[provider] &&
      cache[provider][model]
    ) {
      console.log(
        "[ContextService] cache hit"
      );

      return cache[provider][model];
    }

    console.log(
      "[ContextService] fetching registry"
    );

    const registry =
      await this.fetchRegistry();

    const providerModels =
      registry?.providers?.[
        provider
      ];

    if (
      !providerModels
    ) {
      console.warn(
        "[ContextService] provider not found"
      );

      return 32000;
    }

    const limit =
      providerModels[
        model
      ];

    if (!limit) {
      console.warn(
        "[ContextService] model not found"
      );

      return 32000;
    }

    if (!cache[provider]) {
      cache[provider] = {};
    }

    cache[provider][model] =
      limit;

    this.saveCache(cache);

    return limit;
  }
}