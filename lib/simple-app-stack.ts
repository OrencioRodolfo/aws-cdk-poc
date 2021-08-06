import * as path from "path";
import * as cdk from "@aws-cdk/core";
import * as s3 from "@aws-cdk/aws-s3";
import * as lambdaNodejs from "@aws-cdk/aws-lambda-nodejs";
import * as lambda from "@aws-cdk/aws-lambda";
import { BucketDeployment, Source } from "@aws-cdk/aws-s3-deployment";
import { Policy, PolicyStatement } from "@aws-cdk/aws-iam";
import {
  HttpApi,
  HttpIntegration,
  HttpMethod,
  CorsHttpMethod,
} from "@aws-cdk/aws-apigatewayv2";
import { LambdaProxyIntegration } from "@aws-cdk/aws-apigatewayv2-integrations";

export class SimpleAppStack extends cdk.Stack {
  constructor(scope: cdk.Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    /** *******************************
     *      S3 bucket with photos     *
     **********************************/
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

    /** *************************
     *      Lambda Function     *
     ****************************/
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

    /** ******************************
     *      IAM role permissions     *
     *********************************/
    const bucketContainerPermissions = new PolicyStatement();
    bucketContainerPermissions.addResources(bucket.bucketArn);
    bucketContainerPermissions.addActions("s3:ListBucket");

    const bucketPermissions = new PolicyStatement();
    bucketPermissions.addResources(`${bucket.bucketArn}/*`);
    bucketPermissions.addActions("s3:getObject", "s3:putObject");

    getPhotosLambdaFn.addToRolePolicy(bucketContainerPermissions);
    getPhotosLambdaFn.addToRolePolicy(bucketPermissions);

    /** *************
     *      API     *
     ****************/
    const httpApi = new HttpApi(this, "MySimpleAppHttpApi", {
      corsPreflight: {
        allowOrigins: ["*"],
        allowMethods: [CorsHttpMethod.GET],
      },
      apiName: "photo-api",
      createDefaultStage: true,
    });
    const getPhotosLambdaIntegration = new LambdaProxyIntegration({
      handler: getPhotosLambdaFn,
    });

    httpApi.addRoutes({
      path: "/photos",
      methods: [HttpMethod.GET],
      integration: getPhotosLambdaIntegration,
    });

    new cdk.CfnOutput(this, "MySimpleAppAPI", {
      value: httpApi.url!,
      exportName: "MySimpleAppAPIEndpoint",
    });

    /** *******************************
     *      S3 website bucket     *
     **********************************/
    // const websiteBucket = new s3.Bucket(
    //   this,
    //   "MySimpleAppWebsiteS3BucketName",
    //   {
    //     websiteIndexDocument: "index.html",
    //     publicReadAccess: true,
    //   }
    // );

    // new BucketDeployment(this, "MySimpleAppWebsite", {
    //   sources: [Source.asset(path.join(__dirname, "..", "frontend", "build"))],
    //   destinationBucket: bucket,
    // });
  }
}
