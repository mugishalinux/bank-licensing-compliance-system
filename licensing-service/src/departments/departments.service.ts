import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { Department } from './entities/department.entity';
import {
  CreateDepartmentDto,
  ListDepartmentsDto,
  UpdateDepartmentDto,
} from './dto/department.dto';
import { FilterHelper } from '../common/helpers/filter.helper';

@Injectable()
export class DepartmentsService {
  constructor(private filter: FilterHelper) {}

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
    const d = await Department.findOne({ where: { id } });
    if (!d) throw new NotFoundException('Department not found');
    return d;
  }

  async update(id: string, dto: UpdateDepartmentDto) {
    const d = await this.getOne(id);

    if (dto.name && dto.name !== d.name) {
      const dup = await Department.findOne({ where: { name: dto.name } });
      if (dup) throw new BadRequestException('Name already in use');
    }
    if (dto.code && dto.code !== d.code) {
      const dup = await Department.findOne({ where: { code: dto.code } });
      if (dup) throw new BadRequestException('Code already in use');
    }

    Object.assign(d, dto);
    return d.save();
  }

  async deactivate(id: string) {
    const d = await this.getOne(id);
    if (!d.is_active) return d;
    d.is_active = false;
    return d.save();
  }
}
