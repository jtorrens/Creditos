#!/usr/bin/env node
const fs = require('fs');
const https = require('https');
const os = require('os');
const path = require('path');
const { spawnSync } = require('child_process');

const extract = require('extract-zip');
const electronPackage = require('./node_modules/electron/package.json');

const electronDir = path.join(__dirname, 'node_modules', 'electron');
const distDir = path.join(electronDir, 'dist');
const pathFile = path.join(electronDir, 'path.txt');
const platformPath = platformExecutablePath();

delete process.env.ELECTRON_RUN_AS_NODE;
delete process.env.ELECTRON_SKIP_BINARY_DOWNLOAD;

main().catch((error) => {
  console.error(error.stack || error.message);
  process.exit(1);
});

async function main() {
  console.log(`Electron ${electronPackage.version}`);
  console.log(`Platform ${process.platform}, arch ${process.arch}`);

  if (isInstalled()) {
    console.log('Electron ya esta instalado correctamente.');
    return;
  }

  cleanPartialInstall();
  console.log('Ejecutando instalador oficial de Electron...');
  const installResult = spawnSync(process.execPath, [path.join(electronDir, 'install.js')], {
    cwd: __dirname,
    env: {
      ...process.env,
      ELECTRON_RUN_AS_NODE: '',
      ELECTRON_SKIP_BINARY_DOWNLOAD: '',
    },
    stdio: 'inherit',
  });
  console.log(`Instalador oficial termino con codigo: ${installResult.status}`);
  if (installResult.status === 0 && isInstalled()) {
    console.log('Electron instalado correctamente.');
    return;
  }

  console.log('El instalador oficial no completo la instalacion. Descargando ZIP directo...');
  await installFromReleaseZip();

  if (!isInstalled()) {
    printInstallState();
    throw new Error('La reparacion termino, pero Electron sigue sin estar instalado correctamente.');
  }
  console.log('Electron reparado correctamente.');
}

function isInstalled() {
  const executablePath = path.join(distDir, platformPath);
  return fs.existsSync(pathFile) &&
    fs.readFileSync(pathFile, 'utf8') === platformPath &&
    fs.existsSync(executablePath);
}

async function installFromReleaseZip() {
  const version = electronPackage.version;
  const zipName = `electron-v${version}-${releasePlatform()}-${releaseArch()}.zip`;
  const url = `https://github.com/electron/electron/releases/download/v${version}/${zipName}`;
  const zipPath = path.join(os.tmpdir(), zipName);

  console.log(url);
  await download(url, zipPath);
  const stat = fs.statSync(zipPath);
  console.log(`ZIP descargado: ${zipPath} (${stat.size} bytes)`);

  fs.rmSync(distDir, { recursive: true, force: true });
  fs.mkdirSync(distDir, { recursive: true });
  console.log('Descomprimiendo Electron...');
  await extractElectronZip(zipPath, distDir);
  fs.writeFileSync(pathFile, platformPath);
  printInstallState();
}

function download(url, destination) {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(destination);
    https.get(url, (response) => {
      if (response.statusCode >= 300 && response.statusCode < 400 && response.headers.location) {
        file.close();
        fs.rmSync(destination, { force: true });
        download(response.headers.location, destination).then(resolve, reject);
        return;
      }
      if (response.statusCode !== 200) {
        file.close();
        fs.rmSync(destination, { force: true });
        reject(new Error(`Descarga fallida ${response.statusCode}: ${url}`));
        return;
      }
      response.pipe(file);
      file.on('finish', () => file.close(resolve));
    }).on('error', (error) => {
      file.close();
      fs.rmSync(destination, { force: true });
      reject(error);
    });
  });
}

function cleanPartialInstall() {
  fs.rmSync(pathFile, { force: true });
  fs.rmSync(distDir, { recursive: true, force: true });
}

async function extractElectronZip(zipPath, destination) {
  if (process.platform === 'darwin') {
    const result = spawnSync('ditto', ['-x', '-k', zipPath, destination], { stdio: 'inherit' });
    if (result.status !== 0) {
      throw new Error(`ditto fallo al descomprimir Electron con codigo ${result.status}`);
    }
    return;
  }

  await extract(zipPath, { dir: destination });
}

function printInstallState() {
  console.log('Estado de instalacion Electron:');
  console.log(`- path.txt: ${fs.existsSync(pathFile) ? fs.readFileSync(pathFile, 'utf8') : 'no existe'}`);
  console.log(`- ejecutable esperado: ${path.join(distDir, platformPath)}`);
  console.log(`- ejecutable existe: ${fs.existsSync(path.join(distDir, platformPath)) ? 'si' : 'no'}`);
  if (fs.existsSync(distDir)) {
    console.log('- contenido dist:');
    fs.readdirSync(distDir).slice(0, 20).forEach((entry) => console.log(`  ${entry}`));
  } else {
    console.log('- contenido dist: no existe');
  }
}

function releasePlatform() {
  if (process.platform === 'darwin') return 'darwin';
  if (process.platform === 'win32') return 'win32';
  if (process.platform === 'linux') return 'linux';
  return process.platform;
}

function releaseArch() {
  if (process.arch === 'x64') return 'x64';
  if (process.arch === 'arm64') return 'arm64';
  return process.arch;
}

function platformExecutablePath() {
  if (process.platform === 'darwin') return 'Electron.app/Contents/MacOS/Electron';
  if (process.platform === 'win32') return 'electron.exe';
  return 'electron';
}
