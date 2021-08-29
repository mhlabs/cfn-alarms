const samToCfMap = {
  "AWS::Serverless::Function": "AWS::Lambda::Function",
  "AWS::Serverless::Api": "AWS::ApiGateway::RestApi",
  "AWS::Serverless::SimpleTable": "AWS::DynamoDB::Table",
};

function samToCfn(type) {
    return samToCfMap[type] || type;
}

module.exports = {
    samToCfn
}