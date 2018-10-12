module.exports = (source) => {
  const normalized = source
    .replace(
      /(isomorphic\s*\(\s*['"].+?['"]\s*,\s*)import(\s*\()/gm,
      "$1require$2",
    )
    .replace(
      /loadFragmentPage\s*\(\s*import\s*\(.*?['"]([^'"]+)['"]\s*\)\s*,?\s*\)/gm,
      (region) => {
        const re = /loadFragmentPage\s*\(\s*import\s*\(.*?['"]([^'"]+)['"]\s*\)\s*,?\s*\)/m;
        const m = re.exec(region);
        if (!m) return region;
        return `{component:require("${m[1]}"),chunkName:"${m[1]
          .replace(/.*\/([^\/]+)\.page$/, "$1")
          .replace(/([a-z])([A-Z])/g, "$1-$2")
          .toLowerCase()}"}`;
      },
    );

  return normalized;
};
