const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin')
const CopyPlugin = require("copy-webpack-plugin");

module.exports = {
  entry: {
    main: './src/index.ts',
    hw1: './src/hw1.ts',
    hw2: './src/hw2.ts',
    hw3: './src/hw3.ts',
  },
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: 'ts-loader',
        exclude: /node_modules/,
      },
      {
        test: /\.(png|jpe?g|gif|jp2|webp)$/,
        loader: 'file-loader',
        options: {
          name: '[name].[ext]',
        },
      },
      {
        test: /\.(vs|fs)$/i,
        use: 'raw-loader',
      },
      // obj loader, file loader
      {
        test: /\.(obj|mtl|blend)$/,
        loader: 'file-loader',
        options: {
          name: '[name].[ext]',
        },
      },
    ],
  },
  resolve: {
    extensions: ['.tsx', '.ts', '.js'],
  },
  output: {
    filename: '[name].js',
    path: path.resolve(__dirname, 'dist'),
  },
  plugins: [
    new CopyPlugin({
      patterns: [
        { from: "public", to: "." },
      ],
    }),
    new HtmlWebpackPlugin({
        template: './src/index.html',
        filename: 'index.html',
        chunks: ['main']
    }),
    new HtmlWebpackPlugin({
        template: './src/hw1.html',
        filename: 'hw1.html',
        chunks: ['hw1']
    }),
    new HtmlWebpackPlugin({
        template: './src/hw2.html',
        filename: 'hw2.html',
        chunks: ['hw2']
    }),
    new HtmlWebpackPlugin({
        template: './src/hw3.html',
        filename: 'hw3.html',
        chunks: ['hw3']
    }),
  ],
  devServer: {
    // 设置服务入口，localhost:9000就可以直接访问public和dist里面的资源文件了
    static: {
      directory: path.join(__dirname, 'public'),
    },    // 端口
    port:9000,
    // 开启压缩
    compress: true,
    // 打开默认浏览器
    open: true,
    // 模块热更新
    hot:true
  }
};