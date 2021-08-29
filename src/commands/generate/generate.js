const fs = require("fs");
const path = require("path");
const parser = require("../../shared/parser");
const inputUtil = require("../../shared/inputUtil");
const _ = require("lodash");
const slack = require("../../notifications/Slack");
const cdkDasm = require("cdk-dasm");
async function run(cmd) {
  const templateStr = fs.readFileSync(cmd.template, "utf8");
  let template = parser.parse("template", templateStr);
  const samGeneratedResources = getSamGeneratedResources(template);
  template.Resources = _.merge(template.Resources, samGeneratedResources);
  const resourceTypes = _.uniq(
    Object.keys(template.Resources)
      .filter(
        (p) =>
          template.Resources[p].Type &&
          fs.existsSync(
            path.join(
              __dirname,
              "..",
              "..",
              "configurations",
              "resources",
              template.Resources[p].Type
            )
          )
      )
      .map((p) => template.Resources[p].Type)
  );

  const selectedResourceTypes = await inputUtil.checkbox(
    "Select resource types",
    resourceTypes
  );
  let alarmTemplate = {};
  const alarmResources = {};
  for (const type of selectedResourceTypes) {
    const alarmPath = getResourceTypePath(type);
    if (!fs.existsSync(alarmPath)) {
      console.log(`${alarmPath} does not exist`);
      continue;
    }

    let alarms = parser.parse("alarm", fs.readFileSync(alarmPath, "utf8"));
    if (alarms.AliasFor) {
      alarms = parser.parse("alarm", fs.readFileSync(getResourceTypePath(alarms.AliasFor), "utf8"));
    }
    const selectedAlarms = await inputUtil.checkbox(
      "Select alarm(s)",
      Object.keys(alarms)
    );
    if (fs.existsSync("monitoring.yaml")) {
      alarmTemplate = parser.parse(
        "alarmTemplate",
        fs.readFileSync("monitoring.yaml", "utf8")
      );
    }
    for (const selectedAlarm of selectedAlarms) {
      const alarm = alarms[selectedAlarm];
      const alarmType = alarm.Metadata.AlarmConfig.Type;
      const generator = require("../../alarm-configs/" + alarmType);

      await generator.generate(alarm, template, type, alarmResources);
    }
  }
  const notificationChannels = fs
    .readdirSync(path.join(__dirname, "..", "..", "notifications"))
    .filter((p) => p.endsWith(".js"))
    .map((p) => p.replace(".js", ""));
  const channel = await inputUtil.list("Select notification channel", [
    "None",
    ...notificationChannels,
  ]);
  let notificationResources = {};
  if (channel !== "None") {
    const notificationGenerator = require("../../notifications/" +
      channel +
      ".js");
    _.merge(notificationResources, await notificationGenerator.generate());
  }

  await saveOutput(
    alarmTemplate,
    alarmResources,
    notificationResources,
    template,
    cmd
  );
}

function getResourceTypePath(type) {
  return path.join(
    __dirname,
    "..",
    "..",
    "configurations",
    "resources",
    type,
    "alarms.yaml"
  );
}

async function saveOutput(
  alarmTemplate,
  alarmResources,
  notificationResources,
  template,
  cmd
) {
  const optionsConstants = {
    SeparateFile: "Write to separate file (monitoring.yaml)",
    AppendToTemplate: "Append to " + cmd.template,
    CDK: "Create CDK construct (experimental)",
  };
  const options = [
    optionsConstants.SeparateFile,
    optionsConstants.AppendToTemplate,
    optionsConstants.CDK,
  ];

  const output = await inputUtil.list("Select output", options);
  const originalTemplate = parser.parse("template", fs.readFileSync(cmd.template, "utf8"));
  switch (output) {
    case optionsConstants.SeparateFile:
      saveToFile(
        alarmTemplate,
        alarmResources,
        notificationResources,
        originalTemplate,
        cmd
      );
      break;
    case optionsConstants.AppendToTemplate:
      appendToTemplate(alarmResources, notificationResources, originalTemplate, cmd);
      break;
    case optionsConstants.CDK:
      await saveToCDK(alarmResources, notificationResources, originalTemplate, cmd);
      break;
  }

}

async function saveToCDK(alarmResources, notificationResources, template) {
  template.Resources = _.merge(
    template.Resources,
    alarmResources,
    notificationResources
  );  
  console.log(template.Resources);
  const cdkConstruct = await cdkDasm.dasmTypeScript(template);

  fs.writeFileSync("CloudWatchAlarms.ts", cdkConstruct);
}
function appendToTemplate(alarmResources, notificationResources, template) {
  template.Resources = _.merge(
    template.Resources,
    alarmResources,
    notificationResources
  );

  fs.writeFileSync("template.yaml", parser.stringify("template", template));
}

function saveToFile(
  alarmTemplate,
  alarmResources,
  notificationResources,
  template
) {
  fs.writeFileSync(
    "monitoring.yaml",
    parser.stringify(
      "alarmTemplate",
      _.merge(alarmTemplate, alarmResources, notificationResources)
    )
  );
  template.Resources["Fn::Transform"] = {
    Name: "AWS::Include",
    Parameters: {
      Location: "monitoring.yaml",
    },
  };

  fs.writeFileSync("template.yaml", parser.stringify("template", template));
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
  run,
};
