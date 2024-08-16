# vite.js + handlebars + tailwindcss で、複数ページから成る静的ウェブサイトをコーディングする環境

**Astro.js を使いましょう...**  
と言いたいところだけど、何らかの理由でそういうわけにもいかない人向けに。

## 前提: bun.js

**bun.js** を導入済みであること。 
[公式サイト](https://bun.sh/)を見ればコマンド一行でインストールできる。 

node.js のインストールにはバージョン管理ツールの使用が望ましいので、伝えるのが面倒くさい。 
もちろん node.js でも良いので、その場合は適宜コマンドを読み替えてください。

```bash
# devDependencies としてパッケージを追加
bun add -D any_package_name
npm i -D any_package_name

# dependencies にとしてパッケージ追加(フロント側で必要なものはバンドルして読み込ませるので、ほぼ使わない)
bun add any_package_name
npm i any_package_name

# package.json の指示どおりにパッケージをインストールする
bun i
npm i

# package.json の scripts 内の短縮コマンド(例ではdev)を実行
bun run dev
npm run dev

# 直接、コマンドを実行
npx any_command
bunx any_command

# bun.js 自らを最新バージョンに
bun upgrade
```

## プロジェクト・ディレクトリを作成

```bash
mkdir any_project_name
cd $_
```

## パッケージを追加

```bash
bun add -D vite vite-plugin-handlebars glob tailwindcss autoprefixer postcss
```

これにより、*package.json* と *bun.lockb* の2ファイルが生成される。

また、*node_modules* というディレクトリが生成され、その中に、上記で明示的にインストールされたパッケージと、それらが依存するパッケージがインストールされる。*node_modules* ディレクトリ内部は、決して編集してはいけない。

なお、上記のうち、編集してよいのは *package.json* のみ。その他は決して編集してはならない。


## package.json の編集

```json
{
  // ↓ここから追加
+ "type": "module",
+ "scripts": {
+   "dev": "vite",
+   "build": "vite build",
+   "preview": "vite preview"
+ },
  // ↑ここまで追加
  "dependencies": {},
  "devDependencies": {
    "autoprefixer": "^10.4.20",
    "postcss": "^8.4.41",
    "tailwindcss": "^3.4.10",
    "vite": "^5.4.1",
    "vite-plugin-handlebars": "^2.0.0"
  }
}
```

package.json で編集する必要があるのはせいぜい `scripts` オブジェクトくらい。 `dependencies` や `devDependencies` オブジェクトは自動出力されるものなので、決して編集してはいけない。


##  tailwindcss 用の設定ファイル

```bash
bunx tailwindcss init -p
```

上記コマンドを実行することで、次の2ファイルが出力される。

- tailwind.config.js
- postcss.config.js

### tailwindcss.config.js の編集

```js
/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "src/**/*.html",// ← 追加
    "src/js/**/*.js"// ← 追加
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}
```

`content` 配列内で指定されたファイルに登場している tailwindcss 用クラスが、ビルド時にcssファイルに収録される。使われていないクラスは収録されないので、ビルド後のcssファイルサイズは最小限にとどまる。


### postcss.config.js は編集不要

css ファイルのビルド時に tailwindcss と autoprefixer が動く、という設定。この後の vite.config.js に組み込むこともでき、そうする場合は postcss.config.js が不要となる。

```js
export default {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
}
```


## vite.js の設定

*vite.config.js* の空ファイルを生成する。

```bash
touch vite.config.js
```

*vite.config.js* を次のように編集

```js
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

// rollupOptions.input の値となる。src内の html を glob で収集し、key: filePath の対が並ぶオブジェクトを生成する。
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
```

- handlebars() の context は外部ファイル化している。vite.config.js 内に書き込んでしまうと、ビルド時にしか参照できない。外部ファイル化しておけば、ビルド時の他、とりわけフロント側で動く js ファイルからも参照できるようになる。


## フォルダやファイルを作る

次のコマンドを実行。

```bash
mkdir -p src/{js,css,imgs,components}
touch src/{index.html,js/main.js,css/style.css,components/{head.html,header.html,footer.html}}
```

手動でもよいので次の様にファイルとフォルダを作る。

```bash
.
├── package.json
├── src/
│   ├── second.html
│   ├── imgs/
│   ├── js/
│   │   └── main.js
│   ├── css/
│   │   └── style.css
│   ├── index.html
│   └── components/
│       ├── footer.html
│       ├── header.html
│       └── head.html
├── handlebarsContext.json
├── README.md
├── tailwind.config.js
├── postcss.config.js
└── vite.config.js
```

## index.html

```html
<!DOCTYPE html>
<html lang="ja">
<head>
  {{> head }}
  <title>{{title}}</title>
</head>
<body>
  {{> header }}
  <main>
    <h2>index</h2>
  </main>
  {{> footer}}
</body>
</html>
```

## second.html

```html
<!DOCTYPE html>
<html lang="ja">
<head>
  {{> head }}
  <title>Second | {{title}}</title>
</head>
<body>
  {{> header }}
  <main>
    <h2>second</h2>
  </main>
  {{> footer}}
</body>
</html>
```

## head.html

```html
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<script type="module" src="./js/main.js"></script>
```

## header.html

```html
<header>
  <h1>{{title}}</h1>
  <nav>
    <ul class="flex flex-row gap-4 [&_a]:text-blue-500">
      <li><a href="/">index</a></li>
      <li><a href="/second.html">second</a></li>
    </ul>
  </nav>
</header>
```

## footer.html

```html
<footer>
  <p>&copy; HogeCorp. 2024</p>
</footer>
```
