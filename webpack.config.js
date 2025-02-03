const path = require('path')
const nodeExternals = require('webpack-node-externals');
module.exports = {
    externals: [nodeExternals()],
    externalsPresets: {
        node: true
    },
    module: {
        rules: [
            {test: /\.js$/, exclude: /node_modules/, loader: 'babel-loader'},
            {
                test: /\.tsx?$/, exclude: /node_modules/, loader: 'ts-loader', options: {
                    transpileOnly: true
                }
            }
        ]
    },
    entry: './src/index.ts',
    resolve: {
        modules: ['src', 'node_modules'],
        extensions: ['.webpack.js', '.web.js', '.ts', '.tsx', '.js'],
    },
    output: {
        path: path.resolve(__dirname, 'dist/'),
        filename: 'index.js',

    },
    target: "node",
    devServer: {
        allowedHosts: 'all', // уберите лишние параметры, если они есть
        open: true,
        static: './dist', // путь к статическим файлам
        hot: true,
        // уберите строку с _assetEmittingPreviousFiles
    }
}
