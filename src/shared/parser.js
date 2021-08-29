const yamlCfn = require("yaml-cfn");
const YAML = require('yaml');

let format = {
  yaml: "yaml",
};
function parse(identifier, str) {
  try {
    const parsed = JSON.parse(str);
    format[identifier] = "json";
    return parsed;
  } catch {
    const parsed = yamlCfn.yamlParse(str);
    format[identifier] = "yaml";
    return parsed;
  }
}
function stringify(identifier, obj) {
  if (format[identifier] === "json") return JSON.stringify(obj, null, 2);
  if (format[identifier] === "yaml" || !format[identifier]) 
    return YAML.stringify(obj, {schema: "yaml-1.1"}, 2);
}

module.exports = {
  parse,
  stringify,
};
