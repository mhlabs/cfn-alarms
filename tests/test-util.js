const fs = require("fs");
const path = require("path");
const parser = require("../src/shared/parser");

function getConfigurationForType(type) {
  return parser.parse(
    "apigwtest",
    fs.readFileSync(
      path.join(
        __dirname,
        "..",
        "src",
        "configurations",
        "resources",
        type,
        "alarms.yaml"
      ),
      "utf8"
    )
  );
}

function getGeneratorForAlarm(alarm) {
  return require("../src/alarm-configs/" + alarm.Metadata.AlarmConfig.Type);
}

module.exports = {
  getConfigurationForType,
  getGeneratorForAlarm
};
