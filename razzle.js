const path = require("path");
const glob = require("glob");

module.exports = function withFragment(base) {
  return Object.assign({}, base, {
    modify(config, env, webpack) {
      const { target, dev } = env;

      config.resolveLoader.modules.push(path.join(__dirname, "./loaders"));
      config.module.rules.push({
        test: /\.(ts|tsx|js|jsx)$/,
        loaders:
          target === "node" ? "fragment-route-server" : "fragment-route-client",
        include: [path.resolve("./src/routes/")],
      });

      if (target === "web") {
        const srcPath = path.resolve("./src");
        const pageFiles = glob.sync("./src/**/*.page.*");
        pageFiles.forEach((pageFile) => {
          const chunkName = pageFile
            .replace(/.*\/([^\/]+)\.page\.(js|jsx|ts|tsx)$/, "$1")
            .replace(/([a-z])([A-Z])/g, "$1-$2")
            .toLowerCase();
          config.entry["page-" + chunkName] = pageFile;
          config.entry["fragment-" + chunkName] = "fragment-page!" + pageFile;
        });
        config.output.filename = config.output.chunkFilename = `static/js/[name]${
          dev ? "" : "-[contenthash]"
        }.js`;

        config.optimization = {
          runtimeChunk: {
            name: "runtime",
          },
          splitChunks: {
            // chunks: "all",
            cacheGroups: {
              commons: {
                name: "commons",
                chunks: "all",
                minChunks: pageFiles.length,
                // test: /\/node_modules\//,
              },
              react: {
                name: "commons",
                chunks: "all",
                test: /[\\/]node_modules[\\/](react|react-dom|@abihf\/fragment)[\\/]/,
              },
            },
          },
        };
      }

      if (base && base.modify) {
        return base.modify(config, env, webpack);
      }
      return config;
    },
  });
};
