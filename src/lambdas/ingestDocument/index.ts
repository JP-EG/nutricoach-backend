import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";

const s3 = new S3Client({});

exports.handler = async (event: any) => {
    try {
        const bucket = process.env.BUCKET_NAME;
        if (!bucket) return { statusCode: 500, body: JSON.stringify({ message: "BUCKET_NAME not configured" }) };

        let buffer: Buffer;
        let contentType = "application/octet-stream";
        let key = `ingest/${Date.now()}`;

        // Mode A: API Gateway binary -> event.isBase64Encoded true
        if (event.isBase64Encoded) {
            buffer = Buffer.from(event.body || "", "base64");
            contentType = event.headers?.["content-type"] || event.headers?.["Content-Type"] || contentType;
            // optionally allow client to pass key via query string
            key = event.queryStringParameters?.key || key;
        } else {
            // Mode B: JSON payload with base64 string
            const body = typeof event.body === "string" ? JSON.parse(event.body || "{}") : event.body || {};
            const base64 = body.base64 || body.content;
            if (!base64) {
                return { statusCode: 400, body: JSON.stringify({ message: "base64 content required" }) };
            }
            buffer = Buffer.from(base64, "base64");
            contentType = body.contentType || body.content_type || contentType;
            key = body.key || body.filename || `${key}.bin`;
        }

        const put = new PutObjectCommand({
            Bucket: bucket,
            Key: key,
            Body: buffer,
            ContentType: contentType,
        });

        await s3.send(put);

        return {
            statusCode: 200,
            body: JSON.stringify({ key }),
        };
    } catch (err: any) {
        return { statusCode: 500, body: JSON.stringify({ message: err?.message || "upload error" }) };
    }
};