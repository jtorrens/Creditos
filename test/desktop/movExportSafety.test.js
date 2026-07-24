const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const os = require('node:os');
const path = require('node:path');
const test = require('node:test');

const {
  assertOutputAvailable,
} = require('../../apps/desktop/native/movExport');

test('acepta una versión ausente y rechaza sobrescribirla después', async () => {
  const directory = await fs.mkdtemp(
    path.join(os.tmpdir(), 'creditos-output-safety-'),
  );
  const filePath = path.join(directory, 'render_v001.mov');
  try {
    await assert.doesNotReject(assertOutputAvailable(filePath));
    await fs.writeFile(filePath, 'existing');
    await assert.rejects(
      assertOutputAvailable(filePath),
      /versión oficial ya existe/,
    );
  } finally {
    await fs.rm(directory, { recursive: true, force: true });
  }
});

test('rechaza una carpeta oficial simbólica', {
  skip: process.platform === 'win32',
}, async () => {
  const directory = await fs.mkdtemp(
    path.join(os.tmpdir(), 'creditos-output-symlink-'),
  );
  const realDirectory = path.join(directory, 'real');
  const linkedDirectory = path.join(directory, 'linked');
  try {
    await fs.mkdir(realDirectory);
    await fs.symlink(realDirectory, linkedDirectory);
    await assert.rejects(
      assertOutputAvailable(
        path.join(linkedDirectory, 'render_v001.mov'),
      ),
      /no es una carpeta segura/,
    );
  } finally {
    await fs.rm(directory, { recursive: true, force: true });
  }
});
