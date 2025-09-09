#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib';
import { NutritionInfraStack } from '../lib/nutrition-infra-stack';
import {NutritionProcessingStack} from "../lib/nutrition-processing-stack";
import {NutritionAuthenticationStack} from "../lib/nutrition-authentication-stack";

const app = new cdk.App();
const infra = new NutritionInfraStack(app, 'NutritionInfraStack', {});
new NutritionAuthenticationStack(app, 'NutritionAuthenticationStack', {});
new NutritionProcessingStack(app, 'NutritionProcessingStack', {
    ingestBucketArn: infra.ingestBucket.bucketArn,
    table: infra.table,
    notificationTopic: infra.notificationTopic
});