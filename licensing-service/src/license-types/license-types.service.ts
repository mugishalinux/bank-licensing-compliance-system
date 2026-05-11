import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { LicenseType } from './entities/license-type.entity';
import { Department } from '../departments/entities/department.entity';
import {
  CreateLicenseTypeDto,
  ListLicenseTypesDto,
  UpdateLicenseTypeDto,
} from './dto/license-type.dto';
import { FilterHelper } from '../common/helpers/filter.helper';
import { RedisHelper } from '../common/helpers/redis.helper';
import { LOOKUP_TTL, cacheKeys } from '../common/helpers/cache-keys';

@Injectable()
export class LicenseTypesService {
  constructor(
    private filter: FilterHelper,
    private cache: RedisHelper,
  ) {}

  async create(dto: CreateLicenseTypeDto) {
    const dept = await Department.findOne({ where: { id: dto.department_id } });
    if (!dept) throw new BadRequestException('Department not found');
    if (!dept.is_active) throw new BadRequestException('Department is not active');

    if (await LicenseType.findOne({ where: { name: dto.name } })) {
      throw new BadRequestException('License type with that name already exists');
    }
    if (dto.is_paid && !dto.fee_amount) {
      throw new BadRequestException('fee_amount is required when is_paid is true');
    }

    const lt = new LicenseType();
    Object.assign(lt, dto);
    if (!dto.is_paid) lt.fee_amount = null;
    return lt.save();
  }

  list(q: ListLicenseTypesDto) {
    const where: Record<string, unknown> = {};
    if (q.department_id) where.department_id = q.department_id;
    if (q.is_active !== undefined) where.is_active = q.is_active;
    return this.filter.paginate(LicenseType, {
      page: q.page,
      pageSize: q.pageSize,
      where: Object.keys(where).length ? where : undefined,
      relations: ['department'],
      search: { term: q.search, columns: ['name'] },
    });
  }

  async getOne(id: string) {
    const cached = await this.cache.get<LicenseType>(cacheKeys.licenseType(id));
    if (cached) return cached;

    const lt = await this.findEntity(id);
    await this.cache.set(cacheKeys.licenseType(id), lt, LOOKUP_TTL);
    return lt;
  }

  async update(id: string, dto: UpdateLicenseTypeDto) {
    const lt = await this.findEntity(id);

    if (dto.name && dto.name !== lt.name) {
      const dup = await LicenseType.findOne({ where: { name: dto.name } });
      if (dup) throw new BadRequestException('Name already in use');
    }
    if (dto.department_id && dto.department_id !== lt.department_id) {
      const dept = await Department.findOne({ where: { id: dto.department_id } });
      if (!dept) throw new BadRequestException('Department not found');
      if (!dept.is_active) throw new BadRequestException('Department is not active');
    }
    const willBePaid = dto.is_paid ?? lt.is_paid;
    const fee = dto.fee_amount ?? lt.fee_amount;
    if (willBePaid && !fee) {
      throw new BadRequestException('fee_amount is required when is_paid is true');
    }

    Object.assign(lt, dto);
    if (willBePaid === false) lt.fee_amount = null;
    const saved = await lt.save();
    await this.cache.del(cacheKeys.licenseType(id));
    return saved;
  }

  async deactivate(id: string) {
    const lt = await this.findEntity(id);
    if (!lt.is_active) return lt;
    lt.is_active = false;
    const saved = await lt.save();
    await this.cache.del(cacheKeys.licenseType(id));
    return saved;
  }

  private async findEntity(id: string) {
    const lt = await LicenseType.findOne({
      where: { id },
      relations: ['department', 'requirements'],
    });
    if (!lt) throw new NotFoundException('License type not found');
    return lt;
  }
}
