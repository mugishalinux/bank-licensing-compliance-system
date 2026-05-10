import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GetObjectCommand, PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { Readable } from 'stream';

@Injectable()
export class StorageHelper implements OnModuleInit {
  private s3!: S3Client;
  private bucket!: string;
  private readonly log = new Logger(StorageHelper.name);

  constructor(private cfg: ConfigService) {}

  onModuleInit() {
    const endpoint = `${this.cfg.get<string>('MINIO_USE_SSL') === 'true' ? 'https' : 'http'}://${this.cfg.get<string>('MINIO_ENDPOINT', 'localhost')}:${this.cfg.get<string>('MINIO_PORT', '9001')}`;
    this.bucket = this.cfg.get<string>('MINIO_BUCKET', 'bnr-documents');
    this.s3 = new S3Client({
      endpoint,
      region: 'us-east-1',
      forcePathStyle: true,
      credentials: {
        accessKeyId: this.cfg.get<string>('MINIO_ACCESS_KEY', 'minioadmin'),
        secretAccessKey: this.cfg.get<string>('MINIO_SECRET_KEY', 'minioadmin'),
      },
    });
    this.log.log(`storage: ${endpoint}/${this.bucket}`);
  }

  async presignUpload(key: string, contentType: string, expiresInSeconds = 600) {
    const cmd = new PutObjectCommand({
      Bucket: this.bucket,
      Key: key,
      ContentType: contentType,
    });
    return getSignedUrl(this.s3, cmd, { expiresIn: expiresInSeconds });
  }

  async presignDownload(key: string, filename: string, expiresInSeconds = 600) {
    const cmd = new GetObjectCommand({
      Bucket: this.bucket,
      Key: key,
      ResponseContentDisposition: `attachment; filename="${filename.replace(/"/g, '')}"`,
    });
    return getSignedUrl(this.s3, cmd, { expiresIn: expiresInSeconds });
  }

  async fetchHead(key: string, byteRange = 4100): Promise<Buffer> {
    const out = await this.s3.send(
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
