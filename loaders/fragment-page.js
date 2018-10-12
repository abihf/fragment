const acorn = require("acorn-loose");
const walk = require("acorn-walk");

const moduleName = "@traveloka/fragment";
const defaultFunctionName = "isomorphic";

module.exports = function(source) {
  const chunks = [];

  let functionName = defaultFunctionName;
  const ast = acorn.parse(source);
  walk.simple(ast, {
    ImportDeclaration(node) {
      if (node.source.value !== moduleName) {
        return;
      }
      node.specifiers.forEach((specifier) => {
        if (
          specifier.type === "ImportSpecifier" &&
          specifier.imported.name === defaultFunctionName
        ) {
          functionName = specifier.local.name;
        }
      });
    },
    CallExpression(node) {
      const callee = node.callee;
      if (
        callee.type !== "Identifier" ||
        callee.name !== functionName ||
        node.arguments.length !== 2
      ) {
        return;
      }

      const args = node.arguments.map((argNode) =>
        source.substring(argNode.start, argNode.end),
      );
      const moduleRequire = args[1].replace(/import\s*\(/, "require(");
      chunks.push(`{id: ${args[0]}, module: ${moduleRequire}}`);
    },
  });

  return `module.exports = [ ${chunks.join(", ")} ];`;
};
