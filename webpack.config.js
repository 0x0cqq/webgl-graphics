const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin')

module.exports = {
  entry: {
    main: './src/index.ts',
    hw1: './src/hw1.ts',
    hw2: './src/hw2.ts',
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
  ]
};