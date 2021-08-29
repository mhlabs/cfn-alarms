const jp = require("jsonpath");
const _ = require("lodash");
const stringUtil = require("../shared/stringUtil");
const cfnUtil = require("../shared/cloudFormationUtil");

function generate(alarm, template, type, alarmResources) {
  const alarmConfig = alarm.Metadata.AlarmConfig;
  const iterator = alarmConfig.Iterator;
  const node = jp.query(alarm, iterator);
  const metricTemplate = alarmConfig.MetricTemplate;
  const list = [];
  for (const resourceName of Object.keys(template.Resources).filter(
    (p) => template.Resources[p].Type === type
  )) {
    const metricItem = JSON.parse(
      JSON.stringify(metricTemplate).replace(
        "ResourceNameIterator",
        resourceName
      )
    );
    metricItem.Id = resourceName.toLowerCase();
    list.push(metricItem);
  }

  list.push({
    Id: "expression",
    Expression: list.map((p) => p.Id).join("+"),
  });
  jp.value(alarm, iterator, list);
  delete alarm.Metadata;
  const cfnType = cfnUtil.samToCfn(type);

  alarmResources[
    `${stringUtil.pluralise(cfnType.replace("AWS::", "").replace("::", ""))}Alarm`
  ] = alarm;
}

module.exports = {
  generate,
};
