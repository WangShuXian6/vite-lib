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
