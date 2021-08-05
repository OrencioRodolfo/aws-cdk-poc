import {
  expect as expectCDK,
  matchTemplate,
  MatchStyle,
} from "@aws-cdk/assert";
import "@aws-cdk/assert/jest";
import * as cdk from "@aws-cdk/core";
import * as SimpleApp from "../lib/simple-app-stack";

test("Simple app Stack", () => {
  const app = new cdk.App();
  // WHEN
  const stack = new SimpleApp.SimpleAppStack(app, "MyTestStack");
  // THEN
  expectCDK(stack).to(
    matchTemplate(
      {
        Resources: {
          MySimpleAppS3BucketNameE7655680: {
            Type: "AWS::S3::Bucket",
            Properties: {
              BucketEncryption: {
                ServerSideEncryptionConfiguration: [
                  {
                    ServerSideEncryptionByDefault: {
                      SSEAlgorithm: "AES256",
                    },
                  },
                ],
              },
            },
            UpdateReplacePolicy: "Retain",
            DeletionPolicy: "Retain",
          },
        },
        Outputs: {
          MySimpleAppS3BucketNameExport: {
            Value: {
              Ref: "MySimpleAppS3BucketNameE7655680",
            },
            Export: {
              Name: "MySimpleAppS3BucketName",
            },
          },
        },
      },
      MatchStyle.EXACT
    )
  );
});

test("Stack create S3 bucket", () => {
  // ARRANGE
  const app = new cdk.App();
  // ACT
  const stack = new SimpleApp.SimpleAppStack(app, "MyTestStack");
  // ASSERT

  expect(stack).toHaveResource("AWS::S3::Bucket");
});
