const jp = require("jsonpath");
const _ = require("lodash");

function generate(alarm, template, type, alarmResources) {
  const alarmConfig = alarm.Metadata.AlarmConfig;
  const path = alarmConfig.Path;
  const metricTemplate = alarmConfig.MetricTemplate;
  for (const resourceName of Object.keys(template.Resources).filter(
    (p) => template.Resources[p].Type === type
  )) {
    delete alarm.Metadata;
    jp.value(alarm, path, metricTemplate);
    alarmResources[`${resourceName}` + alarmConfig.Name || "Alarm"] = JSON.parse(
      JSON.stringify(alarm).replace(
        /ResourceNameIterator/g,
        resourceName
      )
    );
  }
}

module.exports = {
  generate,
};
