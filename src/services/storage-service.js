const STORAGE_KEY = "acode_nexus_settings";

export default class StorageService {
  static loadSettings() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return {};

      return JSON.parse(raw);
    } catch (error) {
      console.error("Failed loading settings", error);
      return {};
    }
  }

  static saveSettings(settings) {
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify(settings)
      );
      return true;
    } catch (error) {
      console.error("Failed saving settings", error);
      return false;
    }
  }

  static get(key) {
    const settings = this.loadSettings();
    return settings[key];
  }

  static set(key, value) {
    const settings = this.loadSettings();
    settings[key] = value;
    this.saveSettings(settings);
  }
}