import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { Department } from './entities/department.entity';
import {
  CreateDepartmentDto,
  ListDepartmentsDto,
  UpdateDepartmentDto,
} from './dto/department.dto';
import { FilterHelper } from '../common/helpers/filter.helper';
import { RedisHelper } from '../common/helpers/redis.helper';
import { LOOKUP_TTL, cacheKeys } from '../common/helpers/cache-keys';

@Injectable()
export class DepartmentsService {
  constructor(
    private filter: FilterHelper,
    private cache: RedisHelper,
  ) {}

  async create(dto: CreateDepartmentDto) {
    if (await Department.findOne({ where: [{ name: dto.name }, { code: dto.code }] })) {
      throw new BadRequestException('Department with that name or code already exists');
    }
    const d = new Department();
    Object.assign(d, dto);
    return d.save();
  }

  list(q: ListDepartmentsDto) {
    return this.filter.paginate(Department, {
      page: q.page,
      pageSize: q.pageSize,
      where: q.is_active === undefined ? undefined : { is_active: q.is_active },
      search: { term: q.search, columns: ['name', 'code'] },
    });
  }

  async getOne(id: string) {
    const cached = await this.cache.get<Department>(cacheKeys.dept(id));
    if (cached) return cached;

    const d = await this.findEntity(id);
    await this.cache.set(cacheKeys.dept(id), d, LOOKUP_TTL);
    return d;
  }

  async update(id: string, dto: UpdateDepartmentDto) {
    const d = await this.findEntity(id);

    if (dto.name && dto.name !== d.name) {
      const dup = await Department.findOne({ where: { name: dto.name } });
      if (dup) throw new BadRequestException('Name already in use');
    }
    if (dto.code && dto.code !== d.code) {
      const dup = await Department.findOne({ where: { code: dto.code } });
      if (dup) throw new BadRequestException('Code already in use');
    }

    Object.assign(d, dto);
    const saved = await d.save();
    await this.cache.del(cacheKeys.dept(id));
    return saved;
  }

  async deactivate(id: string) {
    const d = await this.findEntity(id);
    if (!d.is_active) return d;
    d.is_active = false;
    const saved = await d.save();
    await this.cache.del(cacheKeys.dept(id));
    return saved;
  }

  private async findEntity(id: string) {
    const d = await Department.findOne({ where: { id } });
    if (!d) throw new NotFoundException('Department not found');
    return d;
  }
}
