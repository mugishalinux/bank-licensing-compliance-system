import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { User } from './entities/user.entity';
import { Department } from '../departments/entities/department.entity';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { ListUsersDto } from './dto/list-users.dto';
import { UserRole } from '../common/enums/user-role.enum';
import { ApplicantType } from '../common/enums/applicant-type.enum';
import { FilterHelper } from '../common/helpers/filter.helper';

const STAFF_ROLES = new Set<UserRole>([UserRole.REVIEWER, UserRole.APPROVER]);
const BCRYPT_ROUNDS = 12;

@Injectable()
export class UsersService {
  constructor(private filter: FilterHelper) {}

  async create(dto: CreateUserDto) {
    if (await User.findOne({ where: { email: dto.email } })) {
      throw new ConflictException('A user with this email already exists');
    }
    if (STAFF_ROLES.has(dto.role)) {
      if (!dto.department_id) throw new BadRequestException('department_id is required for staff roles');
      const dept = await Department.findOne({ where: { id: dto.department_id, is_active: true } });
      if (!dept) throw new BadRequestException('Department not found or inactive');
    }

    const u = new User();
    u.email = dto.email;
    u.password_hash = await bcrypt.hash(dto.password, BCRYPT_ROUNDS);
    u.role = dto.role;
    u.full_name = dto.full_name;
    u.phone = dto.phone ?? null;
    u.department_id = STAFF_ROLES.has(dto.role) ? (dto.department_id ?? null) : null;
    u.applicant_type = dto.role === UserRole.APPLICANT ? (dto.applicant_type ?? null) : null;
    u.institution_name =
      dto.applicant_type === ApplicantType.ORGANIZATION ? (dto.institution_name ?? null) : null;
    return u.save();
  }

  list(q: ListUsersDto) {
    const where: Record<string, unknown> = {};
    if (q.role) where.role = q.role;
    if (q.department_id) where.department_id = q.department_id;
    if (q.is_active !== undefined) where.is_active = q.is_active;
    return this.filter.paginate(User, {
      page: q.page,
      pageSize: q.pageSize,
      where: Object.keys(where).length ? where : undefined,
      relations: ['department'],
      search: { term: q.search, columns: ['email', 'full_name', 'institution_name'] },
    });
  }

  async getOne(id: string) {
    const u = await User.findOne({ where: { id }, relations: ['department'] });
    if (!u) throw new NotFoundException('User not found');
    return u;
  }

  async update(id: string, dto: UpdateUserDto) {
    const u = await this.getOne(id);

    if (dto.department_id !== undefined && dto.department_id !== null) {
      const dept = await Department.findOne({ where: { id: dto.department_id, is_active: true } });
      if (!dept) throw new BadRequestException('Department not found or inactive');
    }

    if (dto.full_name !== undefined) u.full_name = dto.full_name;
    if (dto.phone !== undefined) u.phone = dto.phone;
    if (dto.department_id !== undefined) u.department_id = dto.department_id;
    if (dto.applicant_type !== undefined) u.applicant_type = dto.applicant_type;
    if (dto.institution_name !== undefined) u.institution_name = dto.institution_name;
    if (dto.is_active !== undefined) u.is_active = dto.is_active;

    return u.save();
  }

  async deactivate(id: string) {
    const u = await this.getOne(id);
    if (!u.is_active) return u;
    u.is_active = false;
    return u.save();
  }

  async activate(id: string) {
    const u = await this.getOne(id);
    if (u.is_active) return u;
    u.is_active = true;
    return u.save();
  }
}
