import Store from "./store.js";

const initialState = {
  ui: {
    panelOpen: false,
    drawerOpen: false,
    loading: false
  },

  sessions: [],

  activeSessionId: null,

  activeRequest: null
};

const store = new Store(initialState);

export default store;