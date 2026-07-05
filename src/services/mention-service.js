import SearchService from "./search-service.js";

export default class MentionService {
  static parseFileMentions(text) {
    if (!text) {
      return {
        files: [],
        cleanedText: ""
      };
    }

    const matches =
      text.match(
        /@([A-Za-z0-9._\\-\\/]+)/g
      ) || [];

    const files =
      matches.map(
        item => item.slice(1)
      );

    const cleanedText =
      text
        .replace(
          /@([A-Za-z0-9._\\-\\/]+)/g,
          ""
        )
        .trim();

    return {
      files,
      cleanedText
    };
  }

  static async buildMentionContext(
    text
  ) {
    const parsed =
      this.parseFileMentions(text);

    if (!parsed.files.length) {
      return {
        content: text,
        context: ""
      };
    }

    const chunks = [];

    for (const fileName of parsed.files) {
      const content =
        await SearchService.readFullFile(
          fileName
        );

      if (!content) {
        chunks.push(
`FILE: ${fileName}

[Unable to read file]`
        );
        continue;
      }

      chunks.push(
`FILE: ${fileName}

${content}`
      );
    }

    return {
      content:
        parsed.cleanedText ||
        "Explain this file.",
      context:
        chunks.join(
          "\n\n----------------\n\n"
        )
    };
  }
}