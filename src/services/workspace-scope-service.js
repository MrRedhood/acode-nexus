export default class WorkspaceScopeService {
  static selectedWorkspace = null;

  static setSelectedWorkspace(workspace) {
    this.selectedWorkspace = workspace;
  }

  static getSelectedWorkspace() {
    return this.selectedWorkspace;
  }

  static clearSelectedWorkspace() {
    this.selectedWorkspace = null;
  }

  static hasWorkspace() {
    return !!this.selectedWorkspace;
  }
}