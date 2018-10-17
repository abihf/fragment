const path = require("path");
const TerserPlugin = require("terser-webpack-plugin");
const ManifestPlugin = require("webpack-manifest-plugin");

const razzlePaths = require("razzle/config/paths");

/** @typedef {import("webpack-manifest-plugin").Options["reduce"]} ManifestReducer */
/** @typedef {import("webpack").Module} Module */
/** @typedef {import("webpack").Configuration} WebpackConfig */
/** @typedef {typeof import("webpack")} Webpack */
/**
 * @typedef {Object} RazzleEnv
 * @property {"web" | "node"} target
 * @property {boolean} dev
 */
/**
 * @typedef {Object} RazzleConfig
 * @property {(config: WebpackConfig, env: RazzleEnv, webpack: Webpack) => WebpackConfig} modify
 */

module.exports = function withFragment(/** @type {RazzleConfig} */ base) {
  /** @type {RazzleConfig} */
  const razzleConfig = {
    modify(config, env, webpack) {
      config.resolveLoader.modules.push(path.join(__dirname, "./loaders"));
      config.module.rules.push({
        test: /\.(ts|tsx|js|jsx)$/,
        loaders: "fragment-normalizer",
        include: path.resolve("./src"),
      });

      if (env.target === "web") {
        const chunkHash = env.dev ? "" : ".[contenthash]";
        config.output.filename = `static/js/[name]${chunkHash}.js`;
        config.output.chunkFilename = `static/js/[name]${chunkHash}.chunk.js`;

        // do we realy need it?
        const { AggressiveMergingPlugin } = webpack.optimize;
        config.plugins = config.plugins.filter(
          (plugin) => !(plugin instanceof AggressiveMergingPlugin),
        );

        config.plugins.push(
          new ManifestPlugin({
            fileName: path.resolve(
              razzlePaths.appBuild,
              "./fragments.map.json",
            ),
            reduce: createAssetReducer(config.output.publicPath),
            writeToFileEmit: true,
          }),
        );

        config.optimization.runtimeChunk = "single";
        config.optimization.splitChunks = {
          cacheGroups: {
            vendors: false,
          },
        };

        if (!env.dev) {
          config.optimization.minimizer = [
            new TerserPlugin({
              terserOptions: {
                parse: {
                  // we want uglify-js to parse ecma 8 code. However, we don't want it
                  // to apply any minfication steps that turns valid ecma 5 code
                  // into invalid ecma 5 code. This is why the 'compress' and 'output'
                  // sections only apply transformations that are ecma 5 safe
                  // https://github.com/facebook/create-react-app/pull/4234
                  ecma: 8,
                },
                compress: {
                  ecma: 5,
                  warnings: false,
                  // Disabled because of an issue with Uglify breaking seemingly valid code:
                  // https://github.com/facebook/create-react-app/issues/2376
                  // Pending further investigation:
                  // https://github.com/mishoo/UglifyJS2/issues/2011
                  comparisons: false,
                  // Disabled because of an issue with Terser breaking valid code:
                  // https://github.com/facebook/create-react-app/issues/5250
                  // Pending futher investigation:
                  // https://github.com/terser-js/terser/issues/120
                  inline: 2,
                },
                mangle: {
                  safari10: true,
                },
                output: {
                  ecma: 5,
                  comments: false,
                  // Turned on because emoji and regex is not minified properly using default
                  // https://github.com/facebook/create-react-app/issues/2488
                  ascii_only: true,
                },
              },
              // Use multi-process parallel running to improve the build speed
              // Default number of concurrent runs: os.cpus().length - 1
              parallel: true,
              // Enable file caching
              cache: true,
              // @todo add flag for sourcemaps
              sourceMap: true,
            }),
          ];
        }
      }

      if (env.target === "node") {
        // __webpack_require__ is buggy in nodejs when handling react context
        config.resolve.mainFields = ["main"];
      }

      if (base && base.modify) {
        return base.modify(config, env, webpack);
      }
      return config;
    },
  };

  return Object.assign({}, base, razzleConfig);
};

/**
 * @param {string} basePath
 * @returns {ManifestReducer}
 */
function createAssetReducer(basePath) {
  return (manifest, { isInitial, chunk, path }) => {
    if (!isInitial && path.endsWith(".js") && chunk.chunkReason === undefined) {
      chunk.forEachModule((mod) => {
        /** @type {Module} */
        let currentModule = mod;
        if (mod.constructor.name === "ConcatenatedModule") {
          currentModule = mod.rootModule;
        }

        if (currentModule.rawRequest.startsWith("fragment-loader!")) {
          const modRequest = currentModule.rawRequest.replace(/^.*!/, "");
          if (!manifest[modRequest]) {
            manifest[modRequest] = [];
          }
          manifest[modRequest].push(
            ...findChunkDependencies(chunk).map((f) => basePath + f),
          );
        }
      });
    }
    return manifest;
  };
}

function findChunkDependencies(chunk) {
  const files = new Set();
  chunk.files.forEach((f) => files.add(f));
  // files.add(chunk.name || chunk.id);
  chunk._groups.forEach((group) =>
    group.chunks.forEach((c) => c.files.forEach((f) => files.add(f))),
  );
  return Array.from(files).filter((f) => f.endsWith(".js"));
}
