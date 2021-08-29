# cfn-alarms-cli

Tool for creating CloudFormation alarms based on the resources in a CloudFormation/SAM/CDK* stack template.

_*CDK support is pending the outstanding issues in [cdk-dasm](https://github.com/aws/aws-cdk/tree/master/packages/cdk-dasm#wip---this-module-is-still-not-fully-functional). Also read the README's reasons for not using it. However, the output may be used as a starting point for creating your own custom constructs._

## Why?
This is an effort to create a baseline of CloudFormation alarms for CloudFormation stacks. The intention is to save developers' time by providing a fast way to create alarms that follow some good practices so they can focus on building features rather than managing monitors.

## Usage:

### 1. Point the tool at your CloudFormation or SAM template. If you use CDK, point it at the synthesized template of which you want to create alarms.
```
cfn-alarms -t <template.yaml>
```

The tool will list the resource types that it has alarm templates for. It currently supports the following types, with more to follow:
* `AWS::Lambda::Function` / `AWS::Serverless::Function`
  * Error rate and error count
* `AWS::DynamoDB::Table` / `AWS::Serverless::SimpleTable`
  * User and system errors count
* `AWS::ApiGateway::RestApi` / `AWS::Serverless::Api`
  * Apdex score, HTTP error rate and error count
* `AWS::StepFunctions::StateMachine` / `AWS::Serverless::StateMachine`
  * Success rate < 99%
* `AWS::SQS::Queue`
  * Queue depth

```
? Select resource types (Press <space> to select, <a> to toggle all, <i> to invert selection)
❯◯ AWS::Serverless::Function
 ◯ AWS::DynamoDB::Table
 ◯ AWS::SQS::Queue
 ◯ AWS::Serverless::SimpleTable
 ◯ AWS::ApiGateway::RestApi 
```
Select the resources you want to create alarms for.

### 2. Select the alarms you want to create.
The tool will list the available alarms for each resource type selected in step one. Select the ones you want to create.
```
? Select alarm(s) 
 ◯ ErrorsGreaterThanZero
❯◉ ErrorRate
```


### 3. Select how you want to be alerted.
```
? Select notification channel (Use arrow keys)
  None 
❯ Slack
```

If you select 'None' then you can build your own custom notification channel based on the alarm state change [EventBridge events](https://docs.aws.amazon.com/AmazonCloudWatch/latest/monitoring/cloudwatch-and-eventbridge.html).

Selecting Slack will generate resources and permissions for EventBridge API Destinations targeting https://slack.com/api/chat.postMessage. You will need to create a [Slack app](https://api.slack.com/apps) and add its OAUTH2 token to SecretsManager under the key `cfn-alarms-cli/slack-token` like this:
```
{
  "Value": "xoxb-1234567890-your-slack-token-321"
}
```

Example output:

![slack](./images/slack.png)

### 4. Select the desired output format.
```
? Select output (Use arrow keys)
❯ Write to separate file (monitoring.yaml) 
  Append to template.yaml 
  Create CDK construct (experimental) 
```

Selecting 'Write to separate file' will write the generated alarms to a file called `monitoring.yaml` in the current directory which will be included in the main template via `Fn::Transform`

Selecting 'Append to template.yaml' will append the generated alarms to the main template.

Selecting 'Create CDK construct' will create a CDK construct of the alarms. This is experimental and you are likely to have to modify the code to make it work.