import * as path from "path";
import * as cdk from "@aws-cdk/core";
import * as s3 from "@aws-cdk/aws-s3";
import * as lambdaNodejs from "@aws-cdk/aws-lambda-nodejs";
import * as lambda from "@aws-cdk/aws-lambda";
import { BucketDeployment, Source } from "@aws-cdk/aws-s3-deployment";
import { Policy, PolicyStatement } from "@aws-cdk/aws-iam";

export class SimpleAppStack extends cdk.Stack {
  constructor(scope: cdk.Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const bucket = new s3.Bucket(this, "MySimpleAppS3BucketName", {
      encryption: s3.BucketEncryption.S3_MANAGED,
    });

    new BucketDeployment(this, "SimpleAppPhotos", {
      sources: [Source.asset(path.join(__dirname, "..", "photos"))],
      destinationBucket: bucket,
    });

    new cdk.CfnOutput(this, "MySimpleAppS3BucketNameExport", {
      value: bucket.bucketName,
      exportName: "MySimpleAppS3BucketName",
    });

    const getPhotosLambdaFn = new lambdaNodejs.NodejsFunction(
      this,
      "MySimpleAppgetPhotosLambdaFn",
      {
        runtime: lambda.Runtime.NODEJS_14_X,
        entry: path.join(__dirname, "..", "api", "get-photos", "index.ts"),
        handler: "getPhotos",
        environment: {
          PHOTO_BUCKET_NAME: bucket.bucketName,
        },
      }
    );

    const bucketContainerPermissions = new PolicyStatement();
    bucketContainerPermissions.addResources(bucket.bucketArn);
    bucketContainerPermissions.addActions("s3:ListBucket");

    const bucketPermissions = new PolicyStatement();
    bucketPermissions.addResources(`${bucket.bucketArn}/*`);
    bucketPermissions.addActions("s3:getObject", "s3:putObject");

    getPhotosLambdaFn.addToRolePolicy(bucketContainerPermissions);
    getPhotosLambdaFn.addToRolePolicy(bucketPermissions);
  }
}
