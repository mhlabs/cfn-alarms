const jp = require("jsonpath");
const _ = require("lodash");
const stringUtil = require("../shared/stringUtil");
const inputUtil = require("../shared/inputUtil");
const path= require("path");
async function generate(alarm, template, type, alarmResources) {
  const apiName = await inputUtil.text("Api name", process.cwd().split("/").slice(-1)[0].replace(/_/g, "-"));
  const alarmConfig = alarm.Metadata.AlarmConfig;
  const iterator = alarmConfig.Iterator;
  const metricTemplate = alarmConfig.MetricTemplate;
  const list = [];
  for (const resourceName of Object.keys(template.Resources).filter(
    (p) => template.Resources[p].Type === type
  )) {
    const metricItem = JSON.parse(
      JSON.stringify(metricTemplate).replace(
        /ResourceNameIterator/g,
        apiName
      )
    );    
    list.push(metricItem);
  }

  jp.value(alarm, iterator, ...list);
  delete alarm.Metadata;
  alarmResources[
    `${stringUtil.pluralise(type.replace("AWS::", "").replace("::", ""))}Alarm`
  ] = alarm;
}

module.exports = {
  generate,
};
