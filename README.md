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
  // ここから
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview"
  },
  // ここまで
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
mkdir -p src/{js,css,imgs,components,public}
touch src/{index.html,js/main.js,css/style.css,components/{head.html,header.html,footer.html}}
```

手動でもよいので次の様にファイルとフォルダを作る。

```bash
.
├── package.json
├── src/
│   ├── second.html
│   ├── imgs/
│   ├── public/
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

### ディレクトリの説明

- imgs : 画像ファイルを入れる。ただし、html 等から読み込まれていなければビルドされない(distに出力されない)。
- public : ここに置かれたファイルやディレクトリは、ビルド時、同じ構造のまま dist 直下に出力される。

### src/css/style.css

ビルド時に tailwindcss が出力されるように次を記述。

main.js から import することでビルドの依存関係に巻き込むので、
html ファイルから link タグでこのcssを読み込む必要はない。

```css
@tailwind base;
@tailwind components;
@tailwind utilities;
```

### src/js/main.js

css を import して、ビルドに巻き込む。
他にも必要な外部ファイルはどんどん import する。

window.addEventListener のコールバック関数内に、フロント側で必要な処理を書いていく。
もちろん、別ファイルに関数を書いてimportし、それを呼び出す方法がおすすめ。

```js
import '../css/style.css';

window.addEventListener('DOMContentLoaded', function () {
  // 処理を書く
});
```

### index.html

handlebars では、`{{}}`で、context の変数や、外部のhtmlを読み込む。

外部htmlの読み込みは、`{{> ファイルパス}}` と書く。

変数の読み込みは `{{変数名}}` と書く。

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

### second.html

second.html のように、任意の html ファイルを作ってよい。
vite.config.js の rollupOptions.input の設定により、src 内に作った html ファイルは、自動的にエントリーポイントとして追加される。

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

### head.html

script タグで、js の起点ファイルとなる main.js を読み込み、ビルドの依存関係に巻き込む。
ビルド全体のエントリーポイントは、vite.config.js の rollupOptions.inputo に設定された html ファイル群。
html から読み込まれればビルドに巻き込まれるし、html から読み込まれた js ファイルから import されているファイルもビルドに巻き込まれ、そうやって import された css ファイルから @import されたファイルもビルドに巻き込まれる。
逆に、上記の巻き込みの連鎖から外れているファイルはビルドされない。

もしも、依存関係に巻き込めていないけどビルドに含めたいファイルがあれば(例えばfavicon)、src/public/ ディレクトリの中に置いておく。

```html
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<script type="module" src="./js/main.js"></script>
```

### header.html

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

### footer.html

```html
<footer>
  <p>&copy; HogeCorp. 2024</p>
</footer>
```

## 開発サーバーを立てて開発

```bash
bun run dev
```

コーディングして保存すると、開発サーバーを閲覧するブラウザが自動的に更新される。
それを見ながらコーディングを進める。

## 本番用のファイルをビルド

```bash
bun run build
```

## 本番用のファイルを手元で確認

```bash
bun run preview
```

## rsync によるアップロード

upload_script.sh などという何らかの名前で sh ファイルを作り、そこにシェルスクリプトを書く。
.gitignore で無視しておき、公開リポジトリに git push しないよう注意。

```bash
touch upload_script.sh
chmod 700 upload_script.sh
```

シェルスクリプト。念のため dry-run にしてある。いちど実行し、結果が良好なら外して使う。

```sh
#!/bin/bash

rsync -avz --dry-run dist/ ~/.ssh/configのHost名:/path/to/webusite/documentroot/
```

実行

```bash
upload_script.sh
```

鍵のパスフレーズを求められるので入力

なお、前提となる ~/.ssh/config の記述は次のような様式。

```bash
Host any_setting_name # なんでもよい。ssh や rsync から設定を呼び出すときの名前
  HostName hoge.huga.jp # ホスト名。あるいは ip アドレス。
  User user_name # サーバーでのユーザー名, 例通りならば接続先に /home/user_name/ ディレクトリがあるということ。
  Port 22 # ssh ポート番号。規定値は22だが大抵は別の番号が割り当てられる。
  IdentityFile /path/to/ssh/secret/key # 対応する ssh 秘密鍵のフルパス。接続先の .ssh ディレクトリに対応する公開鍵が登録されているということ。
  ForwardAgent yes # この接続先から、さらに別のリモートサーバーに ssh 接続する場合は yes
```

package.json の scripts に次のように書くと、build 後に上記のスクリプトが自動実行されて、ちょっと便利。鍵を ssh-add すればもっと便利に。

```json
{
  "scripts": {
    "build" : "vite build",
    "postbuild" : "sh upload_script.sh"
  }
}
```
