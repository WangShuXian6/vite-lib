# 使用 Vite（库模式）、React、TS 和 Sass 构建用户界面 npm 库包 / Building  UI Library Package with Vite(Library Mode), React, TS, Sass

原始链接
>https://github.com/WangShuXian6/blog/issues/127

## 创建 Vite 空项目

>https://vitejs.cn/vite3-cn/guide/#scaffolding-your-first-vite-project
```bash
pnpm create vite
```
>使用 react-ts 模板

>进入项目安装依赖
```bash
pnpm i
```

## 安装 Storybook 用于编写测试和文档
>这将使用 Storybook 初始化  demo，安装相关依赖。
```bash
npx storybook init --builder=vite
```


>如果出现网络问题，可使用 国内npm 源，这样，npx 也将同步使用国内npm源.
>https://npmmirror.com/
```bash
npm config set registry https://registry.npmmirror.com
```

## 安装依赖
>禁止使用依赖 node-gyp 的 node-sass ，会产生网络和跨平台问题
```bash
pnpm i vite-plugin-dts -S
pnpm i sass -D
```

### 同级依赖
>react 和 react-dom 作为库的前置依赖，应该由使用该库的项目提供，将不会打包进库中。
>所以需要移动到 package.json 的 peerDependencies 属性中
```JSON
  "peerDependencies": {
    "react": "^18.3.1",
    "react-dom": "^18.3.1"
  },
```

### vite-plugin-dts
https://github.com/qmhc/vite-plugin-dts/blob/HEAD/README.zh-CN.md
>一款用于在 [库模式](https://cn.vitejs.dev/guide/build.html#library-mode) 中从 .ts(x) 或 .vue 源文件生成类型文件（*.d.ts）的 Vite 插件。

## 编写库组件
指定库的目录，例如 `src\components`
这样，既可以直接使用vite 项目调试库组件，也可以仅发布 `src\components` 目录为库

### 示例库组件
>`src\components\Button\index.tsx`
```tsx
import './Button.scss'
export type ButtonProps = {
  label: string;
};
const Button = ({ label }: ButtonProps) => {
  return (
    <>
      <div className="btn">{label}</div>
    </>
  );
};

export default Button
```

>`src\components\Button\Button.scss`
```scss
.btn{
  background-color: aquamarine;
  color: yellow;
}
```

### 库的统一入口
>所有库文件均在此文件导出
`src\index.ts`
```ts
export { default as Button } from "./components/Button";
export type { ButtonProps } from "./components/Button";

```

### 在 Vite 项目中调试库组件
>`src\App.tsx`

```tsx
import "./App.css";
import { Button } from "./index";

function App() {
  return (
    <>
      <Button label="按钮" />
    </>
  );
}

export default App;

```

```bash
npm run dev
```

## 配置 打包

### typescript 配置
>`tsconfig.lib.json`
>拷贝 tsconfig.app.json 为 tsconfig.lib.json 作为vite 打包库的ts配置
>修改  include 属性，仅包含库文件和库目录，移除其他目录和文件

>`tsconfig.lib.json`
```JSON
{
  "compilerOptions": {
    "target": "ES2020",
    "useDefineForClassFields": true,
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "skipLibCheck": true,

    /* Bundler mode */
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "isolatedModules": true,
    "moduleDetection": "force",
    "noEmit": true,
    "jsx": "react-jsx",

    /* Linting */
    "strict": true,
    "noUnusedLocals": false,
    "noUnusedParameters": false,
    "noFallthroughCasesInSwitch": true
  },
  "include": ["./src/index.ts", "./src/components"]
}

```
### Vite 配置
>https://cn.vitejs.dev/guide/build.html#library-mode
`vite.config.ts`
dts 插件将使用 tsconfig.lib.json 用来为库生成类型定义
```ts
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'
import path from "path";
import dts from "vite-plugin-dts";

export default defineConfig({
  build: {
    // 指定构建的输出将是一个库
    lib: {
      // 定义库构建的入口点，解析为 src/index.ts，表明库从这个文件开始
      entry: path.resolve(__dirname, "src/index.ts"),
      name: "vite-lib",
      // 生成不同格式的输出文件名的函数
      fileName: (format) => `index.${format}.js`,
    },
    rollupOptions: {
      external: ["react", "react-dom"],
      output: {
        globals: {
          react: "React",
          "react-dom": "ReactDOM",
        },
      },
    },
    // 为构建后的文件生成源映射，便于调试
    sourcemap: true,
    // 在构建之前清空输出目录
    emptyOutDir: true,
  },
  // react() 启用 React 支持
  // dts() 在构建过程中生成 TypeScript 声明文件 (*.d.ts)
  plugins: [react(), dts({ tsconfigPath: './tsconfig.lib.json' })],
});

```

## package.json 包设置
>正确设置 `"./dist/style.css": "./dist/style.css"`才可以引入库的样式
```JSON
{
  "name": "vite-lib",
  "private": true,
  "version": "0.0.3",
  "type": "module",
  "main": "dist/index.umd.js",
  "module": "dist/index.es.js",
  "types": "dist/index.d.ts",
  "exports": {
    ".": {
      "import": "./dist/index.es.js",
      "require": "./dist/index.umd.js",
      "types": "./dist/index.d.ts"
    },
    "./dist/style.css": "./dist/style.css"
  },
  "files": [
    "/dist"
  ],
  "publishConfig": {
    "access": "public"
  },
  "scripts": {
    "dev": "vite",
    "build": "tsc -b && vite build",
    "lint": "eslint .",
    "preview": "vite preview",
    "storybook": "storybook dev -p 6006",
    "build-storybook": "storybook build"
  },
  "dependencies": {
    "vite-plugin-dts": "^4.2.3"
  },
  "devDependencies": {
    "@chromatic-com/storybook": "^1.9.0",
    "@eslint/js": "^9.11.1",
    "@storybook/addon-essentials": "^8.3.5",
    "@storybook/addon-interactions": "^8.3.5",
    "@storybook/addon-links": "^8.3.5",
    "@storybook/addon-onboarding": "^8.3.5",
    "@storybook/blocks": "^8.3.5",
    "@storybook/react": "^8.3.5",
    "@storybook/react-vite": "^8.3.5",
    "@storybook/test": "^8.3.5",
    "@types/react": "^18.3.10",
    "@types/react-dom": "^18.3.0",
    "@vitejs/plugin-react-swc": "^3.5.0",
    "autoprefixer": "^10.4.20",
    "eslint": "^9.11.1",
    "eslint-plugin-react-hooks": "^5.1.0-rc.0",
    "eslint-plugin-react-refresh": "^0.4.12",
    "eslint-plugin-storybook": "^0.9.0",
    "globals": "^15.9.0",
    "postcss": "^8.4.47",
    "sass": "^1.79.4",
    "storybook": "^8.3.5",
    "typescript": "^5.5.3",
    "typescript-eslint": "^8.7.0",
    "vite": "^5.4.8"
  },
  "peerDependencies": {
    "react": "^18.3.1",
    "react-dom": "^18.3.1"
  },
  "eslintConfig": {
    "extends": [
      "plugin:storybook/recommended"
    ]
  }
}

```
在项目中调试库组件 
`"dev": "vite",`

在 storybook 中测试库组件
`"storybook": "storybook dev -p 6006",`

打包库到dist目录
`"build": "tsc -b && vite build",`
这将生成
![image](https://github.com/user-attachments/assets/b7fdd852-f11b-400f-ab79-dea44c4996b5)


## 本地测试 npm 包

### 打包后链接 npm 包
在库项目中
每次更新库后，需要更新 version 版本号，否则安装不到更新
```bash
npm link
```

### 在另一个项目安装该 npm 包
>使用相对路径即可安装
>如果另一测试项目与库项目目录同级
```bash
pnpm i ../vite-lib
```
>新项目的react 版本需要高于等于库的react版本，如果出现网络问题，可以使用 cnpm 安装库

项目中将出现新的库依赖
```JSON
  "dependencies": {
    "vite-lib": "^0.0.3"
  },
```

### 新项目使用库
>`src\App.tsx`
>需要引入库组件和库样式
```tsx
import { Button } from "vite-lib";
import 'vite-lib/dist/style.css';
```
>完整
```tsx
import "./App.css";
import { Button } from "vite-lib";
import 'vite-lib/dist/style.css';

function App() {
  return (
    <div className="App">
      <h1>Hello Vite + React!</h1>
      <Button label="hahaha"/>
    </div>
  );
}

export default App;

```


# React + TypeScript + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react/README.md) uses [Babel](https://babeljs.io/) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## Expanding the ESLint configuration

If you are developing a production application, we recommend updating the configuration to enable type aware lint rules:

- Configure the top-level `parserOptions` property like this:

```js
export default tseslint.config({
  languageOptions: {
    // other options...
    parserOptions: {
      project: ['./tsconfig.node.json', './tsconfig.app.json'],
      tsconfigRootDir: import.meta.dirname,
    },
  },
})
```

- Replace `tseslint.configs.recommended` to `tseslint.configs.recommendedTypeChecked` or `tseslint.configs.strictTypeChecked`
- Optionally add `...tseslint.configs.stylisticTypeChecked`
- Install [eslint-plugin-react](https://github.com/jsx-eslint/eslint-plugin-react) and update the config:

```js
// eslint.config.js
import react from 'eslint-plugin-react'

export default tseslint.config({
  // Set the react version
  settings: { react: { version: '18.3' } },
  plugins: {
    // Add the react plugin
    react,
  },
  rules: {
    // other rules...
    // Enable its recommended rules
    ...react.configs.recommended.rules,
    ...react.configs['jsx-runtime'].rules,
  },
})
```
