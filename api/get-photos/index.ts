import {
  APIGatewayProxyEventV2,
  Context,
  APIGatewayProxyResultV2,
} from "aws-lambda";
import { S3 } from "aws-sdk";
import { string } from "yargs";

const s3 = new S3();
const bucketName: string = process.env.PHOTO_BUCKET_NAME || "";

async function generateURL(
  object: S3.Object
): Promise<undefined | { filename: string; url: string }> {
  if (object.Key) {
    const url = await s3.getSignedUrlPromise("getObject", {
      Bucket: bucketName,
      Key: object.Key,
      Expires: 24 * 60 * 60,
    });

    return {
      filename: object.Key,
      url,
    };
  }

  return undefined;
}

export async function getPhotos(
  event: APIGatewayProxyEventV2,
  context: Context
): Promise<APIGatewayProxyResultV2> {
  try {
    const results = await (
      await s3.listObjects({ Bucket: bucketName }).promise()
    ).$response.data;

    if (results && results.Contents) {
      const photos = await Promise.all(
        results.Contents.map((result) => {
          console.log("generateURL(result)", generateURL(result));

          return generateURL(result);
        })
      );
      console.log("results && results.Contents", results?.Contents);
      console.log("photos", photos);

      return {
        statusCode: 200,
        body: JSON.stringify(photos),
      };
    }

    throw new Error("No photos found");
  } catch (error) {
    return {
      statusCode: 500,
      body: error.message,
    };
  }
}
