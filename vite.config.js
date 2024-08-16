import { defineConfig } from 'vite';
import * as path from 'path';
import * as glob from 'glob';
import handlebars from 'vite-plugin-handlebars';
import context from './handlebarsContext.json';

export default defineConfig({
  root: path.resolve(__dirname, 'src'),
  build: {
    outDir: path.resolve(__dirname, 'dist'),
    emptyOutDir: true,
    minify: true,
    sourcemap: false,
    rollupOptions: {
      input: entryPoints(),
    }
  },
  plugins: [
    handlebars({
      partialDirectory: path.resolve(__dirname, 'src/components'),
      context,
    }),
  ],

});

function entryPoints() {
  const entryPoints = glob.sync(path.resolve(__dirname, 'src/**/*.html'), {
    ignore: path.resolve(__dirname, 'src/components/**/*.html')
  }).reduce((array, file) => {
    const { dir, name } = path.parse(file);
    const key = path.join(dir.replace(path.resolve(__dirname, 'src'), ''), name);
    array[key] = file;
    return array;
  }, {});
  console.log(entryPoints);
  return entryPoints;
}
