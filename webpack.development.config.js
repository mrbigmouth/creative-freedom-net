const path = require('path');
/* eslint-disable import/no-extraneous-dependencies */
const webpack = require('webpack');
const CleanWebpackPlugin = require('clean-webpack-plugin');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const eslintFormatter = require('eslint-friendly-formatter');
/* eslint-enable import/no-extraneous-dependencies */

const libPath = path.resolve(__dirname, 'lib');
const sourcePath = path.resolve(__dirname, 'client', 'source');
const destPath = path.resolve(__dirname, 'client', 'dest');
module.exports = {
  watch: true,
  context: sourcePath,
  mode: 'development',
  entry: {
    index: path.join(sourcePath, 'index.js'),
  },
  output: {
    filename: '[name].js',
    path: destPath,
    publicPath: '/',
  },
  resolve: {
    extensions: ['.js', '.vue', '.json'],
    alias: {
      vue$: 'vue/dist/vue.esm.js',
      lib: libPath,
      '@': sourcePath,
    },
  },
  module: {
    rules: [
      {
        test: /\.(js|vue)$/,
        loader: 'eslint-loader',
        enforce: 'pre',
        include: [sourcePath],
        options: {
          formatter: eslintFormatter,
          emitWarning: true,
        },
      },
      {
        test: /\.vue$/,
        loader: 'vue-loader',
        options: {
          loaders: {},
          cssSourceMap: false,
          cacheBusting: true,
          transformToRequire: {
            video: 'src',
            source: 'src',
            img: 'src',
            image: 'xlink:href',
          },
        },
      },
      {
        test: /\.css$/,
        use: ['style-loader', 'css-loader'],
      },
      {
        test: /\.(png|jpe?g|gif|svg)(\?.*)?$/,
        loader: 'url-loader',
        options: {
          limit: 10000,
          name: 'img/[name].[hash:7].[ext]',
        },
      },
      {
        test: /\.(mp4|webm|ogg|mp3|wav|flac|aac)(\?.*)?$/,
        loader: 'url-loader',
        options: {
          limit: 10000,
          name: 'media/[name].[hash:7].[ext]',
        },
      },
      {
        test: /\.(woff2?|eot|ttf|otf)(\?.*)?$/,
        loader: 'url-loader',
        options: {
          limit: 10000,
          name: 'fonts/[name].[hash:7].[ext]',
        },
      },
    ],
  },
  plugins: [
    new webpack.DefinePlugin({
      DEVELOP_MODE: true,
    }),
    new CleanWebpackPlugin(['./client/dest/**/*'], {
      watch: true,
    }),
    new HtmlWebpackPlugin({
      template: 'index.html',
      filename: 'index.html',
      inject: 'body',
    }),
  ],
};
