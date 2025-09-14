import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as sns from 'aws-cdk-lib/aws-sns';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import {AssetCode} from "aws-cdk-lib/aws-lambda";
import * as iam from 'aws-cdk-lib/aws-iam';

interface ProcessingStackProps extends cdk.StackProps {
    ingestBucketArn: string;
    table: dynamodb.Table;
    notificationTopic: sns.Topic;
}

export class NutritionProcessingStack extends cdk.Stack {
    public readonly ingestDocumentLambda: lambda.Function;

    constructor(scope: Construct, id: string, props: ProcessingStackProps) {
        super(scope, id, props);

        const { ingestBucketArn, table, notificationTopic } = props;

        // Process Receipt Lambda
        const processDocumentLambda = new lambda.Function(this, 'ProcessDocumentLambda', {
            functionName: 'ProcessDocumentLambda',
            runtime: lambda.Runtime.NODEJS_LATEST,
            handler: 'src/lambdas/processDocument/index.handler',
            code: new AssetCode(`dist/processDocument`),
            environment: {
                TABLE_NAME: table.tableName
            }
        });
    }
}
