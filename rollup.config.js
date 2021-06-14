import resolve from 'rollup-plugin-node-resolve';
import babel from 'rollup-plugin-babel';
// import json from 'rollup-plugin-json';
// import commonjs from 'rollup-plugin-commonjs';
import commonjs from '@rollup/plugin-commonjs';
import replace from 'rollup-plugin-replace';
// import { eslint } from 'rollup-plugin-eslint';
import { uglify } from 'rollup-plugin-uglify';
// 配置服务
import {liveServer} from 'rollup-plugin-live-server';

const mode = process.env.NODE_ENV;
const isWatch = process.env.ROLLUP_WATCH;

console.log('执行环境：', mode);

const isProd = mode === 'production';

export default {
  input : isWatch ? 'test/index.js' : 'src/index.js',
  output: isWatch ? {
    file   : 'demo/test.js',
    format : 'iife',
    sourcemap: false
  } :
    {
      file   : 'lib/index.js',
      format : 'cjs',
      sourcemap: false
    }
    
  ,
  plugins : [
    // json(),
    // eslint(),
    replace({
      'process.env.NODE_ENV': JSON.stringify(mode)
    }),
    resolve(),
    babel({
      babelrc: false,
      runtimeHelpers: true,
      exclude: ['node_modules/**'],
      presets: [
        ["@babel/preset-env", { modules: false }],
        "@babel/preset-react",
      ],

      plugins: [
        ["@babel/plugin-transform-runtime", {
          "corejs": 3,
          "helpers": true, // 助手函数是否提取，同babel-plugin-transform
          "regenerator": true, // 同babel-plugin-transform
          "useESModules": true
        }],]
    }),
    commonjs(),
    isWatch && liveServer({
      port: 3000,
      root: 'demo',
      file: './index.html',
      open: false,
      wait: 500
    }),
    isProd && uglify({
      compress: {
        pure_getters: true,
        unsafe      : true,
        unsafe_comps: true,
        // warnings    : false
      }
    })
  ]
};
