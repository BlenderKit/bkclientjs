import path from 'path';
import { Configuration } from 'webpack';

const config: Configuration = {
  entry: './src/main.ts',  // Path to your main.ts file
  output: {
    filename: 'main.js',  // Output file that will be bundled
    path: path.resolve(__dirname, 'dist'),  // Output directory
    library: 'bkclientjs',  // Name of the global object
    libraryTarget: 'umd',  // UMD ensures compatibility with module systems and the global scope
    globalObject: 'this'   // Ensures `window` is used in browsers
  },
  resolve: {
    extensions: ['.ts', '.js'],  // Resolve both TypeScript and JavaScript files
  },
  module: {
    rules: [
      {
        test: /\.ts$/,  // Test for .ts files
        use: 'ts-loader',
        exclude: /node_modules/,  // Exclude node_modules folder
      },
    ],
  },
  mode: 'production',  // Set mode to development for better debugging
};

export default config;