const webpack = require('webpack')
const path = require('path')
const CopyPlugin = require('copy-webpack-plugin')
const packageJson = require('./package.json')
const ESLintPlugin = require('eslint-webpack-plugin')
// const BundleAnalyzerPlugin = require('webpack-bundle-analyzer').BundleAnalyzerPlugin

const isDevelopment = process.env.NODE_ENV === 'development'
const isProduction = process.env.NODE_ENV === 'production'
const targetElectron = process.env.BUILD_TARGET === 'electron'
const alchemyApiKey = process.env.ALCHEMY_KEY
const walletConnectKey = process.env.WALLET_CONNECT_KEY

if (isProduction && (!alchemyApiKey || !walletConnectKey)) {
  throw new Error('Alchemy and WalletConnect key env vars must be set')
}

console.log(`Building with webpack. isProduction:${isProduction}, targetElectron:${targetElectron}`)

const config = {
  entry: './src/index.tsx',
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: 'bundle.js',
    chunkFilename: 'bundle-[name].js',
  },
  optimization: {
    splitChunks: {
      minChunks: 3, // Prevents the ledger dynamic bundle from getting split up into separate vendors + local
      minSize: 90000, // Prevent a fourth bundle with walletconnect + ledger common libs
      enforceSizeThreshold: 100000,
    },
  },
  externals: {
    'node-hid': 'commonjs node-hid', // Exclude node-hid as it gets included in electron separately
    ws: 'ws', // Exclude WS to work around walletconnect client bundling issue
  },
  target: targetElectron ? 'electron-renderer' : 'browserslist',
  module: {
    rules: [
      // Run JS files through babel
      {
        test: /\.(js|jsx)$/,
        use: [
          {
            loader: 'babel-loader',
            options: { cacheDirectory: true },
          },
        ],
        exclude: /node_modules/,
      },
      // Run TS files through TS-loader then babel
      {
        test: /\.ts(x)?$/,
        exclude: /node_modules/,
        use: [
          {
            loader: 'babel-loader',
            options: { cacheDirectory: true },
          },
          {
            loader: 'ts-loader',
          },
        ],
      },
      // Enable style loader (though most styles are from CSS-in-JS)
      {
        test: /\.css$/,
        use: [
          'style-loader',
          {
            loader: 'css-loader',
            options: {
              importLoaders: 0,
              modules: false,
            },
          },
        ],
        exclude: /node_modules/,
      },
      // Inline fonts and svgs
      {
        test: /\.(woff|woff2|eot|ttf|otf|svg|)$/,
        type: 'asset/inline',
      },
    ],
  },
  resolve: {
    // Set up file switching for certain features that differ on electron vs web
    alias: {
      'src/features/storage/storageProvider$': targetElectron
        ? 'src/features/storage/storageProvider-electron.ts'
        : 'src/features/storage/storageProvider.ts',
      'src/features/ledger/ledgerTransport$': targetElectron
        ? 'src/features/ledger/ledgerTransport-electron.ts'
        : 'src/features/ledger/ledgerTransport.ts',
      'src/app/update$': targetElectron ? 'src/app/update-electron.ts' : 'src/app/update.ts',
      'src/app/deepLink$': targetElectron ? 'src/app/deepLink-electron.ts' : 'src/app/deepLink.ts',
    },
    extensions: ['.js', '.jsx', '.tsx', '.ts'],
    modules: [
      './node_modules', // First check relative node_modules
      path.resolve('./node_modules'), // Then check root node_modules
      path.resolve('./'), // Finally check root dir (i.e. for src)
    ],
  },
  // Note about react fast refresh: I tried to enable this but it doesn't seem to work with webpack 5 yet.
  plugins: [
    new ESLintPlugin({
      extensions: ['js', 'ts', 'jsx', 'tsx'],
      emitError: true,
      emitWarning: true,
      failOnError: true,
      failOnWarning: true,
    }),
    // Copy over static files
    new CopyPlugin(
      targetElectron
        ? {
            patterns: [
              { from: './package-electron.json', to: 'package.json' },
              { from: './src/index.html', to: 'index.html' },
              { from: './electron/main.js', to: 'main.js' },
              { from: './static/*', to: 'static/[name][ext]' },
            ],
          }
        : {
            patterns: [
              { from: './src/index.html', to: 'index.html' },
              { from: './netlify/*', to: '[name][ext]' },
              { from: './static/*', to: 'static/[name][ext]' },
            ],
          }
    ),
    // Inject some constants into the built code
    new webpack.DefinePlugin({
      __VERSION__: JSON.stringify(packageJson.version),
      __DEBUG__: isDevelopment,
      __IS_ELECTRON__: targetElectron,
      __ALCHEMY_KEY__: JSON.stringify(alchemyApiKey),
      __WALLET_CONNECT_KEY__: JSON.stringify(walletConnectKey),
    }),
    // Bundle analyzer, don't leave enabled
    // new BundleAnalyzerPlugin(),
  ],
  devServer: {
    historyApiFallback: true,
    hot: true,
    open: { target: '/', app: 'Google Chrome' },
  },
  // Show some extra info during build
  stats: {
    assets: true,
    assetsSort: 'size',
    nestedModules: true,
    chunks: true,
    chunkGroups: true,
    chunkModules: true,
    chunkOrigins: true,
    modules: true,
    modulesSort: 'size',
    assetsSpace: 200,
    modulesSpace: 200,
    nestedModulesSpace: 50,
  },
}

module.exports = config
