const path = require("path");

module.exports = function withFragment(base) {
  return Object.assign({}, base, {
    modify(config, env, webpack) {
      config.resolveLoader.modules.push(path.join(__dirname, "./loaders"));
      config.module.rules.push({
        test: /\.(ts|tsx|js|jsx)$/,
        loaders: "fragment-normalizer",
        include: path.resolve("./src"),
      });

      if (base) {
        return base.modify(config, env, webpack);
      }
      return config;
    },
  });
};
