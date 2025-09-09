import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import {AssetCode} from "aws-cdk-lib/aws-lambda";
import * as cognito from 'aws-cdk-lib/aws-cognito';

export class NutritionAuthenticationStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // Trigger
      const autoVerifyLambda = new lambda.Function(this, 'autoVerifyLambda', {
          runtime: lambda.Runtime.NODEJS_LATEST,
          handler: 'src/lambdas/authentication/index.handler',
          code: new AssetCode(`dist/authentication`),
      });
    // Cognito
      const pool = new cognito.UserPool(this, 'myuserpool', {
          userPoolName: 'auto-verify-userpool',
          selfSignUpEnabled: true,
          removalPolicy: cdk.RemovalPolicy.DESTROY,
          lambdaTriggers: {
              preSignUp: autoVerifyLambda,
          }
      });
    // Client
      const client = pool.addClient('customer-app-client');
      const clientId = client.userPoolClientId;

    // Client ID Output
      new cdk.CfnOutput(this, 'clientIdOutput', {
        key: 'ClientId',
        value: clientId,
      });
  }
}