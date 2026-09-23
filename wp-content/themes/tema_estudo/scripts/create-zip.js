import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const { ZipArchive } = require('archiver');

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const themeDir = path.resolve(__dirname, '..');
const outputZip = path.resolve(themeDir, '..', 'tema_estudo.zip');

console.log('\n[ZIP] Gerando tema_estudo.zip limpo para producao...');

// Garante que o arquivo zip antigo seja removido
if (fs.existsSync(outputZip)) {
  fs.unlinkSync(outputZip);
}

const output = fs.createWriteStream(outputZip);
const archive = new ZipArchive({
  zlib: { level: 9 }, // Máxima compressão
});

output.on('close', () => {
  const sizeKb = (archive.pointer() / 1024).toFixed(2);
  console.log(`[ZIP] Sucesso! Arquivo gerado em: ${outputZip}`);
  console.log(`[ZIP] Tamanho total: ${sizeKb} KB\n`);
});

archive.on('warning', (err) => {
  if (err.code === 'ENOENT') {
    console.warn('[ZIP Warning]', err);
  } else {
    throw err;
  }
});

archive.on('error', (err) => {
  throw err;
});

archive.pipe(output);

// Arquivos raiz a incluir
const rootFiles = [
  'style.css',
  'screenshot.png',
  'theme.json',
  'functions.php',
  'index.php',
  'header.php',
  'footer.php',
  'page.php',
  'single.php',
  'archive.php',
  'category.php',
  '404.php',
];

for (const file of rootFiles) {
  const filePath = path.join(themeDir, file);
  if (fs.existsSync(filePath)) {
    archive.file(filePath, { name: `tema_estudo/${file}` });
  }
}

// Diretório assets (contém assets/dist com app.js e app.css)
const assetsDir = path.join(themeDir, 'assets');
if (fs.existsSync(assetsDir)) {
  archive.directory(assetsDir, 'tema_estudo/assets');
}

archive.finalize();
