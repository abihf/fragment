module.exports = (source) => {
  const normalized = source
    .replace(
      /(isomorphic\s*\(\s*['"].+?['"]\s*,\s*)import(\s*\()/gm,
      "$1require$2",
    )
    .replace(
      /loadFragmentPage\s*\(\s*import\s*\(.*?['"]([^'"]+)['"]\s*\)\s*,?\s*\)/gm,
      '{loader:()=>import("$1"),fragments:()=>import("fragment-loader!$1")}',
    );

  return normalized;
};
