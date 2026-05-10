import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { v4 as uuid } from 'uuid';
import { fileTypeFromBuffer } from 'file-type';
import { Application } from '../applications/entities/application.entity';
import { ApplicationDocument, DocumentStatus } from './entities/document.entity';
import { LicenseRequirement } from '../license-types/entities/license-requirement.entity';
import { User } from '../users/entities/user.entity';
import { AuditService } from '../audit/audit.service';
import { StorageHelper } from '../common/helpers/storage.helper';
import { UserRole } from '../common/enums/user-role.enum';
import { ApplicationStatus } from '../common/enums/application-status.enum';
import { ALLOWED_MIME_TYPES, PresignUploadDto } from './dto/document.dto';

const EDITABLE_STATUSES = [ApplicationStatus.DRAFT, ApplicationStatus.ADDITIONAL_INFO_REQUIRED];

@Injectable()
export class DocumentsService {
  constructor(
    private storage: StorageHelper,
    private audit: AuditService,
  ) {}

  async presignUpload(applicationId: string, dto: PresignUploadDto, actor: User) {
    if (!ALLOWED_MIME_TYPES.includes(dto.mime_type)) {
      throw new BadRequestException('File type not allowed');
    }
    const app = await this.assertEditable(applicationId, actor);

    if (dto.requirement_id) {
      const req = await LicenseRequirement.findOne({ where: { id: dto.requirement_id } });
      if (!req || req.license_type_id !== app.license_type_id) {
        throw new BadRequestException('Requirement does not belong to this application');
      }
    }

    const ext = this.extOf(dto.original_name);
    const object_key = `apps/${applicationId}/v${app.submission_version}/${uuid()}${ext}`;

    const doc = new ApplicationDocument();
    doc.application_id = app.id;
    doc.requirement_id = dto.requirement_id ?? null;
    doc.original_name = dto.original_name;
    doc.object_key = object_key;
    doc.size = String(dto.size);
    doc.mime_type = dto.mime_type;
    doc.status = DocumentStatus.PENDING_UPLOAD;
    doc.uploader_id = actor.id;
    doc.submission_version = app.submission_version;
    await doc.save();

    const upload_url = await this.storage.presignUpload(object_key, dto.mime_type);
    return {
      document_id: doc.id,
      object_key,
      upload_url,
      expires_in: 600,
    };
  }

  async confirm(docId: string, actor: User) {
    const doc = await this.getOwnedDoc(docId, actor);
    if (doc.status === DocumentStatus.READY) return doc;

    let head: Buffer;
    try {
      head = await this.storage.fetchHead(doc.object_key);
    } catch {
      throw new BadRequestException('Upload not found in storage');
    }

    const detected = await fileTypeFromBuffer(head);
    if (!detected || !ALLOWED_MIME_TYPES.includes(detected.mime)) {
      doc.status = DocumentStatus.REJECTED;
      await doc.save();
      throw new BadRequestException('File content does not match an allowed type');
    }

    doc.mime_type = detected.mime;
    doc.status = DocumentStatus.READY;
    await doc.save();

    await this.audit.log({
      application_id: doc.application_id,
      actor_id: actor.id,
      action: 'DOCUMENT_UPLOADED',
      metadata: { document_id: doc.id, original_name: doc.original_name },
    });

    return doc;
  }

  async listForApplication(applicationId: string, actor: User) {
    const app = await Application.findOne({ where: { id: applicationId } });
    if (!app) throw new NotFoundException('Application not found');
    this.assertVisible(app, actor);

    return ApplicationDocument.find({
      where: { application_id: applicationId, status: DocumentStatus.READY },
      relations: ['uploader'],
      order: { submission_version: 'ASC', created_at: 'ASC' },
    });
  }

  async presignDownload(docId: string, actor: User) {
    const doc = await ApplicationDocument.findOne({
      where: { id: docId },
      relations: ['application'],
    });
    if (!doc) throw new NotFoundException('Document not found');
    if (doc.status !== DocumentStatus.READY) throw new BadRequestException('Document not ready');
    this.assertVisible(doc.application, actor);
    const url = await this.storage.presignDownload(doc.object_key, doc.original_name);
    return { url, expires_in: 600 };
  }

  private async assertEditable(applicationId: string, actor: User) {
    const app = await Application.findOne({ where: { id: applicationId } });
    if (!app) throw new NotFoundException('Application not found');
    if (actor.role !== UserRole.APPLICANT || app.applicant_id !== actor.id) {
      throw new ForbiddenException('Only the applicant can upload documents');
    }
    if (!EDITABLE_STATUSES.includes(app.status)) {
      throw new BadRequestException(`Cannot upload while application is ${app.status}`);
    }
    return app;
  }

  private async getOwnedDoc(docId: string, actor: User) {
    const doc = await ApplicationDocument.findOne({
      where: { id: docId },
      relations: ['application'],
    });
    if (!doc) throw new NotFoundException('Document not found');
    if (actor.role !== UserRole.APPLICANT || doc.application.applicant_id !== actor.id) {
      throw new ForbiddenException('Access denied');
    }
    return doc;
  }

  private assertVisible(app: Application, actor: User) {
    if (actor.role === UserRole.APPLICANT && app.applicant_id !== actor.id) {
      throw new ForbiddenException('Access denied');
    }
    if (
      (actor.role === UserRole.REVIEWER || actor.role === UserRole.APPROVER) &&
      actor.department_id !== app.department_id
    ) {
      throw new ForbiddenException('This application belongs to a different department');
    }
  }

  private extOf(name: string) {
    const i = name.lastIndexOf('.');
    return i >= 0 ? name.slice(i).toLowerCase() : '';
  }
}
