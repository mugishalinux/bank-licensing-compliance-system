import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InstitutionType } from './entities/institution-type.entity';
import {
  CreateInstitutionTypeDto,
  ListInstitutionTypesDto,
  UpdateInstitutionTypeDto,
} from './dto/institution-type.dto';
import { FilterHelper } from '../common/helpers/filter.helper';
import { RedisHelper } from '../common/helpers/redis.helper';
import { LOOKUP_TTL, cacheKeys } from '../common/helpers/cache-keys';

@Injectable()
export class InstitutionTypesService {
  constructor(
    private filter: FilterHelper,
    private cache: RedisHelper,
  ) {}

  async create(dto: CreateInstitutionTypeDto) {
    if (await InstitutionType.findOne({ where: { name: dto.name } })) {
      throw new BadRequestException('Institution type with that name already exists');
    }
    const t = new InstitutionType();
    Object.assign(t, dto);
    return t.save();
  }

  list(q: ListInstitutionTypesDto) {
    return this.filter.paginate(InstitutionType, {
      page: q.page,
      pageSize: q.pageSize,
      where: q.is_active === undefined ? undefined : { is_active: q.is_active },
      search: { term: q.search, columns: ['name'] },
    });
  }

  async getOne(id: string) {
    const cached = await this.cache.get<InstitutionType>(cacheKeys.instType(id));
    if (cached) return cached;

    const t = await this.findEntity(id);
    await this.cache.set(cacheKeys.instType(id), t, LOOKUP_TTL);
    return t;
  }

  async update(id: string, dto: UpdateInstitutionTypeDto) {
    const t = await this.findEntity(id);
    if (dto.name && dto.name !== t.name) {
      const dup = await InstitutionType.findOne({ where: { name: dto.name } });
      if (dup) throw new BadRequestException('Name already in use');
    }
    Object.assign(t, dto);
    const saved = await t.save();
    await this.cache.del(cacheKeys.instType(id));
    return saved;
  }

  async deactivate(id: string) {
    const t = await this.findEntity(id);
    if (!t.is_active) return t;
    t.is_active = false;
    const saved = await t.save();
    await this.cache.del(cacheKeys.instType(id));
    return saved;
  }

  private async findEntity(id: string) {
    const t = await InstitutionType.findOne({ where: { id } });
    if (!t) throw new NotFoundException('Institution type not found');
    return t;
  }
}
