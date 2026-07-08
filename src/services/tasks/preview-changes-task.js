export default class PreviewChangesTask {
  static async execute(
    task,
    plan,
    context
  ) {
    console.log(
      "PreviewChangesTask"
    );

    return {
      success: true,
      previewed: true
    };
  }
}