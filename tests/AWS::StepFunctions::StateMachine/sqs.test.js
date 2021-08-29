const parser = require("../../src/shared/parser");
const fs = require("fs");
const path = require("path");
const testUtil = require("../test-util");

const expectedAlarmResources = parser.parse(
  "ddbtest",
  fs.readFileSync(path.join(__dirname, "alarms.yaml"), "utf8")
);
const testTemplate = parser.parse(
  "testtemplate",
  fs.readFileSync(path.join(__dirname, "..", "test-template.yaml"), "utf8")
);
parser.createPseudoSAMResources(testTemplate);

const alarmConfig = testUtil.getConfigurationForType(
  "AWS::StepFunctions::StateMachine"
);

test("Alarms should have a name", () => {
  for (const alarmResource of Object.keys(alarmConfig)) {
    expect(alarmConfig[alarmResource].Metadata.AlarmConfig.Name).toBeDefined();
  }
});

test("Alarms should have a type", () => {
  for (const alarmResource of Object.keys(alarmConfig)) {
    expect(alarmConfig[alarmResource].Metadata.AlarmConfig.Type).toBeDefined();
  }
});

test("Generate alarms test", async () => {
  for (const alarm of Object.keys(alarmConfig).map(
    (p) => alarmConfig[p]
  )) {
    const generator = testUtil.getGeneratorForAlarm(alarm);
    console.log(alarm.Metadata.AlarmConfig.Type)
    const alarmResources = {};    
    await generator.generate(alarm, testTemplate, "AWS::Serverless::StateMachine", alarmResources);
    for (const key of Object.keys(alarmResources)) {
      expect(alarmResources[key]).toEqual(expectedAlarmResources[key]);
    }
  }
});
