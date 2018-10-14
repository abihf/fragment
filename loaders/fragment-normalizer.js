const fragmentPageReplacer = (m, name, mod) => {
  const pageName = name + "-page";
  const fragmentName = name + "-fragment";
  // if (!name || !mod) return m;
  return `{
    fragmentModule: "${mod}",
    loader: ()=>import(/* webpackChunkName: "${pageName}" */ "${mod}"),
    fragments: ()=>import(/* webpackChunkName: "${fragmentName}" */ "fragment-loader!${mod}"),
  }`;
};

module.exports = (source) => {
  const normalized = source
    .replace(
      /(isomorphic\s*\(\s*['"].+?['"]\s*,\s*)import(\s*\()/gm,
      "$1require$2",
    )
    .replace(
      /loadFragmentPage\s*\(\s*['"]([^'"]+)['"]\s*,\s*?\s*import\s*\(.*?['"]([^'"]+)['"]\s*\)\s*,?\s*\)/gm,
      fragmentPageReplacer,
    );

  return normalized;
};
