import tar from 'tar-stream';
import { HttpError } from './HttpError.js';

// Docker copies files in and out of containers as tar archives.

// UID/GID of the "node" user in the official Node images, so the
// container's non-root user can still edit files we write.
const NODE_UID = 1000;
const NODE_GID = 1000;

/** Packs [{ name, content }] into a tar archive buffer. */
export function packFiles(files, { uid = NODE_UID, gid = NODE_GID } = {}) {
  return new Promise((resolve, reject) => {
    const pack = tar.pack();
    const chunks = [];

    pack.on('data', (chunk) => chunks.push(chunk));
    pack.on('end', () => resolve(Buffer.concat(chunks)));
    pack.on('error', reject);

    for (const file of files) {
      pack.entry({ name: file.name, mode: 0o644, uid, gid }, file.content);
    }
    pack.finalize();
  });
}

/** Reads the first regular file out of a tar stream. Resolves null if there is none. */
export function readFirstFile(archiveStream, maxBytes) {
  return new Promise((resolve, reject) => {
    const extract = tar.extract();
    let result = null;

    extract.on('entry', (header, stream, next) => {
      if (result === null && header.type === 'file') {
        if (header.size > maxBytes) {
          stream.resume();
          extract.destroy(new HttpError(413, 'File is too large to open in the editor'));
          return;
        }
        const chunks = [];
        stream.on('data', (chunk) => chunks.push(chunk));
        stream.on('end', () => {
          result = Buffer.concat(chunks);
          next();
        });
      } else {
        stream.on('end', next);
        stream.resume();
      }
    });

    extract.on('finish', () => resolve(result));
    extract.on('error', reject);
    archiveStream.on('error', reject);
    archiveStream.pipe(extract);
  });
}
