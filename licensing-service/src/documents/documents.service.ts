import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Application } from '../applications/entities/application.entity';
import { ApplicationDocument } from './entities/document.entity';
import { User } from '../users/entities/user.entity';
import { AuditService } from '../audit/audit.service';
import { UserRole } from '../common/enums/user-role.enum';
import { ApplicationStatus } from '../common/enums/application-status.enum';
import * as path from 'path';
import * as fs from 'fs';

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB
const UPLOAD_DIR = path.join(process.cwd(), 'uploads');

@Injectable()
export class DocumentsService {
  constructor(
    @InjectRepository(ApplicationDocument)
    private docRepository: Repository<ApplicationDocument>,
    @InjectRepository(Application)
    private appRepository: Repository<Application>,
    private auditService: AuditService,
  ) {
    if (!fs.existsSync(UPLOAD_DIR)) {
      fs.mkdirSync(UPLOAD_DIR, { recursive: true });
    }
  }

  async upload(
    applicationId: string,
    file: Express.Multer.File,
    actor: User,
  ): Promise<ApplicationDocument> {
    // Server-side size enforcement (Multer also enforces but this is a belt-and-suspenders check)
    if (file.size > MAX_FILE_SIZE) {
      fs.unlinkSync(file.path);
      throw new BadRequestException('File exceeds maximum allowed size of 5MB');
    }

    const app = await this.appRepository.findOne({ where: { id: applicationId } });
    if (!app) {
      fs.unlinkSync(file.path);
      throw new NotFoundException('Application not found');
    }

    // Applicants can only upload to their own applications
    if (actor.role === UserRole.APPLICANT && app.applicant_id !== actor.id) {
      fs.unlinkSync(file.path);
      throw new ForbiddenException('Access denied');
    }

    // Documents can only be uploaded when application is editable
    const editableStatuses = [
      ApplicationStatus.DRAFT,
      ApplicationStatus.ADDITIONAL_INFO_REQUIRED,
    ];
    if (!editableStatuses.includes(app.status)) {
      fs.unlinkSync(file.path);
      throw new BadRequestException(
        `Cannot upload documents when application is in ${app.status} state`,
      );
    }

    const doc = this.docRepository.create({
      application_id: applicationId,
      original_name: file.originalname,
      stored_name: file.filename,
      size: file.size,
      mime_type: file.mimetype,
      uploader_id: actor.id,
      submission_version: app.submission_version,
    });

    const saved = await this.docRepository.save(doc);

    await this.auditService.log({
      application_id: applicationId,
      actor_id: actor.id,
      action: 'DOCUMENT_UPLOADED',
      metadata: {
        document_id: saved.id,
        original_name: file.originalname,
        size: file.size,
        submission_version: app.submission_version,
      },
    });

    return saved;
  }

  async findByApplication(applicationId: string, actor: User): Promise<ApplicationDocument[]> {
    const app = await this.appRepository.findOne({ where: { id: applicationId } });
    if (!app) throw new NotFoundException('Application not found');

    if (actor.role === UserRole.APPLICANT && app.applicant_id !== actor.id) {
      throw new ForbiddenException('Access denied');
    }

    return this.docRepository.find({
      where: { application_id: applicationId },
      order: { submission_version: 'ASC', uploaded_at: 'ASC' },
      relations: ['uploader'],
    });
  }

  getFilePath(filename: string): string {
    const filePath = path.join(UPLOAD_DIR, filename);
    if (!fs.existsSync(filePath)) {
      throw new NotFoundException('File not found');
    }
    // Prevent path traversal
    const resolved = path.resolve(filePath);
    if (!resolved.startsWith(path.resolve(UPLOAD_DIR))) {
      throw new ForbiddenException('Invalid file path');
    }
    return resolved;
  }

  async findDocumentById(docId: string, actor: User): Promise<ApplicationDocument> {
    const doc = await this.docRepository.findOne({
      where: { id: docId },
      relations: ['application', 'uploader'],
    });

    if (!doc) throw new NotFoundException('Document not found');

    if (actor.role === UserRole.APPLICANT && doc.application.applicant_id !== actor.id) {
      throw new ForbiddenException('Access denied');
    }

    return doc;
  }
}
