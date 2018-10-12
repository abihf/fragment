module.exports = (source) => {
  const normalized = source
    .replace(
      /(isomorphic\s*\(\s*['"].+?['"]\s*,\s*)import(\s*\()/gm,
      "$1require$2",
    )
    .replace(
      /loadFragmentPage\s*\(\s*import\s*\(.*?['"]([^'"]+)['"]\s*\)\s*,?\s*\)/gm,
      (match, file) => {
        if (!file) return match;
        return `{component:require("${file}"),chunkName:"${file
          .replace(/.*\/([^\/]+)\.page$/, "$1")
          .replace(/([a-z])([A-Z])/g, "$1-$2")
          .toLowerCase()}"}`;
      },
    );

  return normalized;
};
