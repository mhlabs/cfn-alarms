const yamlCfn = require("yaml-cfn");
const YAML = require("yaml");
const _ = require("lodash");

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
    return YAML.stringify(obj, { schema: "yaml-1.1" }, 2);
}

function createPseudoSAMResources(template) {
  const samGeneratedResources = getSamGeneratedResources(template);
  template.Resources = _.merge(template.Resources, samGeneratedResources);
}

function getSamGeneratedResources(template) {
  const resources = {};
  for (const resourceEvents of Object.keys(template.Resources)
    .filter((p) => template.Resources[p].Type === "AWS::Serverless::Function")
    .map((q) =>
      Object.keys(template.Resources[q].Properties.Events).map((r) => {
        return {
          Name: q,
          Type: template.Resources[q].Properties.Events[r].Type,
        };
      })
    )) {
    for (const event of resourceEvents)
      if (event.Type === "Api") {
        resources["ServerlessRestApi"] = { Type: "AWS::ApiGateway::RestApi" };
      }
  }
  return resources;
}

module.exports = {
  parse,
  stringify,
  createPseudoSAMResources
};
