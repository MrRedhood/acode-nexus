const DB_NAME =
  "acode_nexus_db";

const DB_VERSION = 1;

const STORE_NAME =
  "attachments";

export default class AttachmentStorage {
  static db = null;

  static async init() {
    if (this.db) {
      return this.db;
    }

    return new Promise(
      (resolve, reject) => {
        const request =
          indexedDB.open(
            DB_NAME,
            DB_VERSION
          );

        request.onerror =
          () => {
            reject(
              request.error ||
                new Error(
                  "IndexedDB open failed"
                )
            );
          };

        request.onupgradeneeded =
          event => {
            const db =
              event.target.result;

            if (
              !db.objectStoreNames.contains(
                STORE_NAME
              )
            ) {
              db.createObjectStore(
                STORE_NAME,
                {
                  keyPath: "id"
                }
              );
            }
          };

        request.onsuccess =
          () => {
            this.db =
              request.result;

            resolve(this.db);
          };
      }
    );
  }

  static async getStore(
    mode = "readonly"
  ) {
    const db =
      await this.init();

    const transaction =
      db.transaction(
        STORE_NAME,
        mode
      );

    return transaction.objectStore(
      STORE_NAME
    );
  }

    static async saveAttachment(
    attachment
  ) {
    const store =
      await this.getStore(
        "readwrite"
      );

    return new Promise(
      (resolve, reject) => {
        const request =
          store.put(
            attachment
          );

        request.onsuccess =
          () =>
            resolve(
              attachment.id
            );

        request.onerror =
          () =>
            reject(
              request.error
            );
      }
    );
  }

  static async getAttachment(
    id
  ) {
    const store =
      await this.getStore();

    return new Promise(
      (resolve, reject) => {
        const request =
          store.get(id);

        request.onsuccess =
          () =>
            resolve(
              request.result ||
                null
            );

        request.onerror =
          () =>
            reject(
              request.error
            );
      }
    );
  }

  static async getAttachments(
    ids = []
  ) {
    const results = [];

    for (const id of ids) {
      const attachment =
        await this.getAttachment(
          id
        );

      if (attachment) {
        results.push(
          attachment
        );
      }
    }

    return results;
  }

  static async deleteAttachment(
    id
  ) {
    const store =
      await this.getStore(
        "readwrite"
      );

    return new Promise(
      (resolve, reject) => {
        const request =
          store.delete(id);

        request.onsuccess =
          () => resolve();

        request.onerror =
          () =>
            reject(
              request.error
            );
      }
    );
  }

  static async cleanupUnused(
    usedIds = []
  ) {
    const used =
      new Set(usedIds);

    const store =
      await this.getStore(
        "readwrite"
      );

    return new Promise(
      (resolve, reject) => {
        const request =
          store.openCursor();

        request.onerror =
          () =>
            reject(
              request.error
            );

        request.onsuccess =
          async event => {
            const cursor =
              event.target.result;

            if (!cursor) {
              resolve();
              return;
            }

            if (
              !used.has(
                cursor.key
              )
            ) {
              cursor.delete();
            }

            cursor.continue();
          };
      }
    );
  }
}