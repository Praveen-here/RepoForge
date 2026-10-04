import fs from 'node:fs/promises';
import path from 'node:path';
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

/** Reads every regular file out of a tar stream: [{ name, content }]. */
export function readAllFiles(archiveStream, maxBytesTotal) {
  return new Promise((resolve, reject) => {
    const extract = tar.extract();
    const files = [];
    let total = 0;

    extract.on('entry', (header, stream, next) => {
      if (header.type !== 'file') {
        stream.on('end', next);
        stream.resume();
        return;
      }
      total += header.size;
      if (total > maxBytesTotal) {
        stream.resume();
        extract.destroy(new HttpError(413, 'Archive is too large'));
        return;
      }
      const chunks = [];
      stream.on('data', (chunk) => chunks.push(chunk));
      stream.on('end', () => {
        files.push({ name: header.name, content: Buffer.concat(chunks) });
        next();
      });
    });

    extract.on('finish', () => resolve(files));
    extract.on('error', reject);
    archiveStream.on('error', reject);
    archiveStream.pipe(extract);
  });
}

/**
 * Packs a folder from this machine into a tar archive whose entries start with
 * `prefix/` (e.g. "src/..."), ready for container.putArchive().
 */
export async function packDirectory(dir, prefix, { uid = NODE_UID, gid = NODE_GID } = {}) {
  const pack = tar.pack();
  const chunks = [];
  pack.on('data', (chunk) => chunks.push(chunk));
  const done = new Promise((resolve, reject) => {
    pack.on('end', resolve);
    pack.on('error', reject);
  });

  const walk = async (current, entryPath) => {
    pack.entry({ name: `${entryPath}/`, type: 'directory', mode: 0o755, uid, gid });
    for (const item of await fs.readdir(current, { withFileTypes: true })) {
      const full = path.join(current, item.name);
      const name = `${entryPath}/${item.name}`;
      if (item.isDirectory()) await walk(full, name);
      else if (item.isFile()) pack.entry({ name, mode: 0o644, uid, gid }, await fs.readFile(full));
    }
  };

  await walk(dir, prefix);
  pack.finalize();
  await done;
  return Buffer.concat(chunks);
}
