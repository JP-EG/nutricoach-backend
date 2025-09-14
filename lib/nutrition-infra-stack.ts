import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as sns from 'aws-cdk-lib/aws-sns';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as api from 'aws-cdk-lib/aws-apigateway';
import { AssetCode } from 'aws-cdk-lib/aws-lambda';

export class NutritionInfraStack extends cdk.Stack {
  public readonly ingestBucket: s3.Bucket;
  public readonly table: dynamodb.Table;
  public readonly notificationTopic: sns.Topic;
  public readonly ingestDocumentLambda: lambda.Function;
  public readonly api: api.RestApi;

  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // assign to the class property so other stacks can read it
    this.ingestBucket = new s3.Bucket(this, 'IngestBucket', {
      versioned: true,
      encryption: s3.BucketEncryption.S3_MANAGED,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
    });

    this.ingestDocumentLambda = new lambda.Function(this, 'IngestDocumentLambda', {
      runtime: lambda.Runtime.NODEJS_LATEST,
      handler: 'src/lambdas/ingestDocument/index.handler',
      code: new AssetCode(`dist/ingestDocument`),
      environment: {
        BUCKET_NAME: this.ingestBucket.bucketName,
      },
    });

    this.ingestBucket.grantReadWrite(this.ingestDocumentLambda);

    this.api = new api.RestApi(this, 'NutritionApi', {
      restApiName: 'NutritionApi',
      description: 'This service serves nutrition data.',
      binaryMediaTypes: ['image/png', 'image/jpeg', 'image/*', 'multipart/form-data'],
      defaultCorsPreflightOptions: {
        allowOrigins: api.Cors.ALL_ORIGINS,
        allowMethods: api.Cors.ALL_METHODS,
      },
    });

    const ingestResource = this.api.root.addResource('ingest');
    const ingestIntegration = new api.LambdaIntegration(this.ingestDocumentLambda);
    ingestResource.addMethod('POST', ingestIntegration);

    this.table = new dynamodb.Table(this, 'NutritionTable', {
      partitionKey: { name: 'PK', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'SK', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    this.notificationTopic = new sns.Topic(this, 'NutritionNotificationTopic');
  }
}