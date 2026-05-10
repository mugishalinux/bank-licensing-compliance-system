import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InstitutionType } from './entities/institution-type.entity';
import {
  CreateInstitutionTypeDto,
  ListInstitutionTypesDto,
  UpdateInstitutionTypeDto,
} from './dto/institution-type.dto';
import { FilterHelper } from '../common/helpers/filter.helper';

@Injectable()
export class InstitutionTypesService {
  constructor(private filter: FilterHelper) {}

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
    const t = await InstitutionType.findOne({ where: { id } });
    if (!t) throw new NotFoundException('Institution type not found');
    return t;
  }

  async update(id: string, dto: UpdateInstitutionTypeDto) {
    const t = await this.getOne(id);
    if (dto.name && dto.name !== t.name) {
      const dup = await InstitutionType.findOne({ where: { name: dto.name } });
      if (dup) throw new BadRequestException('Name already in use');
    }
    Object.assign(t, dto);
    return t.save();
  }

  async deactivate(id: string) {
    const t = await this.getOne(id);
    if (!t.is_active) return t;
    t.is_active = false;
    return t.save();
  }
}
