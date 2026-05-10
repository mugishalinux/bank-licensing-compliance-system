import { Injectable, NotFoundException } from '@nestjs/common';
import { LicenseRequirement } from './entities/license-requirement.entity';
import { LicenseType } from './entities/license-type.entity';
import {
  CreateLicenseRequirementDto,
  UpdateLicenseRequirementDto,
} from './dto/license-requirement.dto';

@Injectable()
export class LicenseRequirementsService {
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
    return r.save();
  }

  async update(id: string, dto: UpdateLicenseRequirementDto) {
    const r = await this.getOne(id);
    Object.assign(r, dto);
    return r.save();
  }

  async remove(id: string) {
    const r = await this.getOne(id);
    await r.remove();
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
