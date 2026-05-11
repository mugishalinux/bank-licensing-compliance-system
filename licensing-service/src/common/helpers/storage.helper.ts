import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GetObjectCommand, PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { Readable } from 'stream';

@Injectable()
export class StorageHelper implements OnModuleInit {
  private internal!: S3Client;
  private presigner!: S3Client;
  private bucket!: string;
  private readonly log = new Logger(StorageHelper.name);

  constructor(private cfg: ConfigService) {}

  onModuleInit() {
    const ssl = this.cfg.get<string>('MINIO_USE_SSL') === 'true';
    const internalHost = this.cfg.get<string>('MINIO_ENDPOINT', 'localhost');
    const internalPort = this.cfg.get<string>('MINIO_PORT', '9001');
    const publicHost = this.cfg.get<string>('MINIO_PUBLIC_ENDPOINT', internalHost);
    const publicPort = this.cfg.get<string>('MINIO_PUBLIC_PORT', internalPort);

    const internalEndpoint = `${ssl ? 'https' : 'http'}://${internalHost}:${internalPort}`;
    const publicEndpoint = `${ssl ? 'https' : 'http'}://${publicHost}:${publicPort}`;

    this.bucket = this.cfg.get<string>('MINIO_BUCKET', 'bnr-documents');

    const creds = {
      accessKeyId: this.cfg.get<string>('MINIO_ACCESS_KEY', 'minioadmin'),
      secretAccessKey: this.cfg.get<string>('MINIO_SECRET_KEY', 'minioadmin'),
    };

    this.internal = new S3Client({
      endpoint: internalEndpoint,
      region: 'us-east-1',
      forcePathStyle: true,
      credentials: creds,
    });
    this.presigner = new S3Client({
      endpoint: publicEndpoint,
      region: 'us-east-1',
      forcePathStyle: true,
      credentials: creds,
    });

    this.log.log(`storage internal=${internalEndpoint} public=${publicEndpoint} bucket=${this.bucket}`);
  }

  async presignUpload(key: string, contentType: string, expiresInSeconds = 600) {
    const cmd = new PutObjectCommand({
      Bucket: this.bucket,
      Key: key,
      ContentType: contentType,
    });
    return getSignedUrl(this.presigner, cmd, { expiresIn: expiresInSeconds });
  }

  async presignDownload(key: string, filename: string, expiresInSeconds = 600) {
    const cmd = new GetObjectCommand({
      Bucket: this.bucket,
      Key: key,
      ResponseContentDisposition: `attachment; filename="${filename.replace(/"/g, '')}"`,
    });
    return getSignedUrl(this.presigner, cmd, { expiresIn: expiresInSeconds });
  }

  async fetchHead(key: string, byteRange = 4100): Promise<Buffer> {
    const out = await this.internal.send(
      new GetObjectCommand({
        Bucket: this.bucket,
        Key: key,
        Range: `bytes=0-${byteRange - 1}`,
      }),
    );
    const body = out.Body as Readable;
    const chunks: Buffer[] = [];
    for await (const c of body) chunks.push(typeof c === 'string' ? Buffer.from(c) : (c as Buffer));
    return Buffer.concat(chunks);
  }
}
