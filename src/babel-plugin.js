// @ts-check

/** @typedef {import("@babel/core")} Babel */
/** @typedef {import("@babel/core").PluginObj} PluginObj */
/** @typedef {import("@babel/types").ClassDeclaration} ClassDeclaration */
/** @typedef {import("@babel/types").ClassExpression} ClassExpression */
/** @typedef {import("@babel/types").ClassProperty} ClassProperty */
/** @typedef {import("@babel/types").ClassMethod} ClassMethod */
/** @typedef {import("@babel/types").Identifier} Identifier */
/** @typedef {import("@babel/types").Expression} Expression */

/**
 * @returns {never}
 */
function syntaxError() {
  throw new SyntaxError();
}

/**
 * @param {ClassMethod | ClassProperty} prop
 * @param {Babel["types"]} t
 * @returns {Expression}
 */
function staticPropName(prop, t) {
  if (!prop.computed && prop.key.type === "Identifier") {
    return t.stringLiteral(`static ${prop.key.name}`);
  } else if (
    prop.key.type === "StringLiteral" ||
    prop.key.type === "NumericLiteral"
  ) {
    return t.stringLiteral(`static ${prop.key.value}`);
  } else if (prop.key.type === "TemplateLiteral") {
    const head = (prop.key.quasis[0] ?? syntaxError()).value;
    return t.templateLiteral(
      [
        t.templateElement({
          raw: `static ${head.raw}`,
          // This must be defined because it's not tagged
          cooked: `static ${head.cooked}`,
        }),
        ...prop.key.quasis.slice(1),
      ],
      prop.key.expressions,
    );
  }
  return t.templateLiteral(
    [
      t.templateElement({ raw: "static ", cooked: "static " }),
      t.templateElement({ raw: "", cooked: "" }, true),
    ],
    [prop.key],
  );
}

/**
 * @param {ClassDeclaration | ClassExpression | Identifier} node
 * @param {Babel["types"]} t
 * @returns {Expression}
 */
function buildKlass(node, t) {
  if (node.type === "Identifier") return node;
  const klass = node.id
    ? t.callExpression(t.identifier("klass"), [t.stringLiteral(node.id.name)])
    : t.identifier("klass");
  const withExtends = node.superClass
    ? t.callExpression(t.memberExpression(klass, t.identifier("extends")), [
        node.superClass.type === "ClassExpression"
          ? buildKlass(node.superClass, t)
          : node.superClass,
      ])
    : klass;
  return t.callExpression(withExtends, [
    t.objectExpression(
      node.body.body.map((prop) => {
        switch (prop.type) {
          case "ClassMethod": {
            return t.objectMethod(
              prop.kind === "constructor" ? "method" : prop.kind,
              prop.static ? staticPropName(prop, t) : prop.key,
              prop.params.map((p) =>
                p.type === "TSParameterProperty" ? syntaxError() : p,
              ),
              prop.body,
              prop.computed,
              prop.generator,
              prop.async,
            );
          }
          case "ClassProperty": {
            return t.objectProperty(
              prop.static ? staticPropName(prop, t) : prop.key,
              prop.value ?? t.identifier("undefined"),
              prop.computed,
            );
          }
          default:
            throw new SyntaxError();
        }
      }),
    ),
  ]);
}

/**
 * @param {Babel} param0
 * @returns {PluginObj}
 */
export default function plugin({ types: t }) {
  return {
    visitor: {
      ClassExpression(path) {
        path.replaceWith(buildKlass(path.node, t));
      },
      ClassDeclaration(path) {
        path.replaceWith(
          t.variableDeclaration("const", [
            t.variableDeclarator(path.node.id, buildKlass(path.node, t)),
          ]),
        );
      },
    },
  };
}
