export default class Store {
  constructor(initialState = {}) {
    this.state = initialState;
    this.listeners = [];
  }

  getState() {
    return this.state;
  }

  setState(updater) {
    const prev = this.state;

    const next =
      typeof updater === "function"
        ? updater(prev)
        : { ...prev, ...updater };

    this.state = next;

    this.listeners.forEach(listener => {
      listener(this.state, prev);
    });
  }

  subscribe(listener) {
    this.listeners.push(listener);

    return () => {
      this.listeners =
        this.listeners.filter(
          l => l !== listener
        );
    };
  }
}