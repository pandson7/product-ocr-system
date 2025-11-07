#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib';
import { ProductOcrStack110720251818 } from '../lib/cdk-app-stack';

const app = new cdk.App();
new ProductOcrStack110720251818(app, 'ProductOcrStack110720251818', {
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: process.env.CDK_DEFAULT_REGION,
  },
});
