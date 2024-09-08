const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');
const csso = require('csso'); // Minificador de CSS

// Rutas fuente y destino
const dest = 'build/minificado/';
const source = './build/css/';

// Obtiene archivos CSS de la ruta especificada
const files = getFilesFromPath(source, '.css');
let data = [];

if (!files || files.length <= 0) {
  console.log("No se encontraron archivos CSS para purgar");
  return;
}

for (const f of files) {
  // Tamaño del archivo original
  const originalSize = getFilesizeInKiloBytes(path.join(source, f)) + "kb";
  data.push({ file: f, originalSize, newSize: "" });
}

console.log("Ejecutando PurgeCSS...");

exec(`purgecss -css ${source}*.css --content ./index.html build/*.js -o ${dest}`, (error, stdout, stderr) => {
  if (error) {
    console.error(`Error al ejecutar PurgeCSS: ${error}`);
    return;
  }

  console.log("PurgeCSS finalizado");

  // Minificación y actualización de tamaños
  for (let d of data) {
    const filePath = path.join(dest, d.file);

    // Lee el archivo purgado
    let cssContent = fs.readFileSync(filePath, 'utf-8');

    // Minifica el contenido
    const minifiedCss = csso.minify(cssContent).css;

    // Sobrescribe el archivo con el CSS minificado
    fs.writeFileSync(filePath, minifiedCss);

    // Obtiene el nuevo tamaño del archivo
    const newSize = getFilesizeInKiloBytes(filePath) + "kb";
    d.newSize = newSize;
  }

  console.table(data);
});

// Función para obtener el tamaño del archivo en KB
function getFilesizeInKiloBytes(filename) {
  const stats = fs.statSync(filename);
  return (stats.size / 1024).toFixed(2);
}

// Función para obtener archivos con una extensión específica
function getFilesFromPath(dir, extension) {
  const files = fs.readdirSync(dir);
  return files.filter(e => path.extname(e).toLowerCase() === extension);
}
