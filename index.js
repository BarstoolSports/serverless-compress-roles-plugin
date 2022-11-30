'use strict';

const policyStatements = [{
  Effect: 'Allow',
  Action: ['logs:CreateLogStream', 'logs:CreateLogGroup', 'logs:PutLogEvents'],
  Resource: [
    {
      'Fn::Sub': 'arn:${AWS::Partition}:logs:${AWS::Region}:${AWS::AccountId}:log-group:*'
    }
  ]
}, {
  Effect: 'Allow',
  Action: 'sqs:SendMessage',
  Resource: [
    {
      'Fn::Sub': 'arn:${AWS::Partition}:sqs:${AWS::Region}:${AWS::AccountId}:*'
    }
  ]
}];

class SimplifyDefaultExecRole {
  constructor(serverless) {
    this.hooks = {
      'before:package:finalize': function() {
        simplifyBaseIAMLogGroups(serverless);
      }
    };
  }
}

function simplifyBaseIAMLogGroups(serverless) {
  const resourceSection = serverless.service.provider.compiledCloudFormationTemplate.Resources;

  for (const key in resourceSection) {
    if (key === 'IamRoleLambdaExecution') {
      resourceSection[key].Properties.Policies[0].PolicyDocument.Statement = resourceSection[key].Properties.Policies[0].PolicyDocument.Statement.filter(({ Action }) => {
        const actions = typeof Action === 'string' ? [Action] : [...Action]
        for (const action of actions) {
          if (action.startsWith('logs:')) {
            return false
          }
          if (action.startsWith('sqs:SendMessage')) {
            return false
          }
        }
        return true
      });
      resourceSection[key].Properties.Policies[0].PolicyDocument.Statement.push(...policyStatements)
    }
  }
}

module.exports = SimplifyDefaultExecRole;
