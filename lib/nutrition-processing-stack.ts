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

        // Ingest Lambda
        this.ingestDocumentLambda = new lambda.Function(this, 'IngestDocumentLambda', {
            functionName: 'IngestDocumentLambda',
            runtime: lambda.Runtime.NODEJS_LATEST,
            handler: 'src/lambdas/ingestDocument/index.handler',
            code: new AssetCode(`dist/ingestDocument`),
            environment: {
                TABLE_NAME: table.tableName,
                NOTIFICATION_TOPIC_ARN: notificationTopic.topicArn
            }
        });

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

        // Permissions
        table.grantReadWriteData(this.ingestDocumentLambda);
        notificationTopic.grantPublish(this.ingestDocumentLambda);

        // Trigger ingestLambda on new uploads
        this.ingestDocumentLambda.addPermission('S3InvokePermission', {
            principal: new iam.ServicePrincipal('s3.amazonaws.com'),
            sourceArn: ingestBucketArn,
        });
    }
}
