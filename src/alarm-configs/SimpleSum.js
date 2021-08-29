const jp = require("jsonpath");
const _ = require("lodash");

function generate(alarm, template, type, alarmResources) {
  const alarmConfig = alarm.Metadata.AlarmConfig;
  const name = alarm.Metadata.AlarmSuffix;
  const path = alarmConfig.Path;
  const metricTemplate = alarmConfig.MetricTemplate;
  const list = [];
  for (const resourceName of Object.keys(template.Resources).filter(
    (p) => template.Resources[p].Type === type
  )) {
    delete alarm.Metadata;
    jp.value(alarm, path, metricTemplate);
    alarmResources[`${resourceName}ErrorRateAlarm`] = JSON.parse(
      JSON.stringify(alarm).replace(
        /ResourceNameIterator/g,
        resourceName
      )
    );
  }

  list.push({
    Id: "expression",
    Expression: list.map((p) => p.Id).join("+"),
  });
}

module.exports = {
  generate,
};
