const path = require("path");
const HtmlWebpackPlugin = require("html-webpack-plugin");

function resolve(dir) {
  return path.resolve(__dirname, dir)
}

module.exports = {
  // 指定构建环境  
  mode: "development",
  // 入口
  entry: {
    app: "./src/index"
  },
  // 出口
  output: {
    path: resolve("dist"),
    filename: "index.js",
    publicPath: "/" // 打包后的资源的访问路径前缀
  },
  // 模块
  module: {
    rules: [
      {
        test: /\.(js|jsx)$/,
        use: {
          loader: 'babel-loader',
          options: {
            presets: [
              ["@babel/preset-env", { modules: "umd" }],
              "@babel/preset-react",
            ],

            plugins: [
              ["@babel/plugin-transform-runtime", {
                "corejs": 3,
                "helpers": true, // 助手函数是否提取，同babel-plugin-transform
                "regenerator": true, // 同babel-plugin-transform
                "useESModules": true
              }],]
          }
        },
        exclude: /node_modules/
      }
    ]
  },

  plugins: [
    new HtmlWebpackPlugin({
      filename: resolve('./dist/index.html'), // html模板的生成路径
      template: 'index.html',//html模板
      inject: true, // true：默认值，script标签位于html文件的 body 底部
      hash: true, // 在打包的资源插入html会加上hash
      //  html 文件进行压缩
      minify: {
        removeComments: true,               //去注释
        collapseWhitespace: true,           //压缩空格
        removeAttributeQuotes: true         //去除属性引用
      }
    })
  ],
  // 开发环境本地启动的服务配置
  devServer: {

  }
}