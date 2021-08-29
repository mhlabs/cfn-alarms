const jp = require("jsonpath");
const _ = require("lodash");
const stringUtil = require("../shared/stringUtil");
const inputUtil = require("../shared/inputUtil");
const path = require("path");
const cfnUtil = require("../shared/cloudFormationUtil");
async function generate(alarm, template, type, alarmResources, apiName) {
  apiName = apiName || await inputUtil.text(
    "Api name",
    process.cwd().split("/").slice(-1)[0].replace(/_/g, "-")
  );
  const alarmConfig = alarm.Metadata.AlarmConfig;
  const iterator = alarmConfig.Iterator;

  jp.value(alarm, iterator, alarmConfig.MetricTemplate);
  delete alarm.Metadata;
  alarm = JSON.parse(
    JSON.stringify(alarm).replace(/ResourceNameIterator/g, apiName)
  );
  const cfnType = cfnUtil.samToCfn(type);

  alarmResources[
    `${stringUtil.pluralise(
      cfnType.replace("AWS::", "").replace("::", "")
    )}Alarm`
  ] = alarm;
}

module.exports = {
  generate,
};
