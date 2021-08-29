const slack = require("./resources/slack.json");
const inputUtil = require("../shared/inputUtil");

async function generate() {
  let channelName = await inputUtil.text("Slack channel: ");
  if (!channelName.startsWith("#")) {
    channelName = `#${channelName}`;
  }

  slack.AlarmEventRule.Properties.Targets[0].InputTransformer.InputTemplate["Fn::Sub"] =
    slack.AlarmEventRule.Properties.Targets[0].InputTransformer.InputTemplate["Fn::Sub"].replace(
      "#channel",
      channelName
    );
  return slack;
}

module.exports = {
  generate,
};
