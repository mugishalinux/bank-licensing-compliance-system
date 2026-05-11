import { Injectable, NotFoundException } from '@nestjs/common';
import { LicenseRequirement } from './entities/license-requirement.entity';
import { LicenseType } from './entities/license-type.entity';
import {
  CreateLicenseRequirementDto,
  UpdateLicenseRequirementDto,
} from './dto/license-requirement.dto';
import { RedisHelper } from '../common/helpers/redis.helper';
import { cacheKeys } from '../common/helpers/cache-keys';

@Injectable()
export class LicenseRequirementsService {
  constructor(private cache: RedisHelper) {}

  async listForType(licenseTypeId: string) {
    await this.assertTypeExists(licenseTypeId);
    return LicenseRequirement.find({
      where: { license_type_id: licenseTypeId },
      order: { created_at: 'ASC' },
    });
  }

  async addToType(licenseTypeId: string, dto: CreateLicenseRequirementDto) {
    await this.assertTypeExists(licenseTypeId);
    const r = new LicenseRequirement();
    Object.assign(r, dto);
    r.license_type_id = licenseTypeId;
    const saved = await r.save();
    await this.cache.del(cacheKeys.licenseType(licenseTypeId));
    return saved;
  }

  async update(id: string, dto: UpdateLicenseRequirementDto) {
    const r = await this.getOne(id);
    Object.assign(r, dto);
    const saved = await r.save();
    await this.cache.del(cacheKeys.licenseType(r.license_type_id));
    return saved;
  }

  async remove(id: string) {
    const r = await this.getOne(id);
    const parentId = r.license_type_id;
    await r.remove();
    await this.cache.del(cacheKeys.licenseType(parentId));
    return { id };
  }

  private async getOne(id: string) {
    const r = await LicenseRequirement.findOne({ where: { id } });
    if (!r) throw new NotFoundException('Requirement not found');
    return r;
  }

  private async assertTypeExists(id: string) {
    const lt = await LicenseType.findOne({ where: { id } });
    if (!lt) throw new NotFoundException('License type not found');
  }
}
