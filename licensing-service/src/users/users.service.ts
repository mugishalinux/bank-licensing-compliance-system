import {
  Injectable,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User } from './entities/user.entity';
import { CreateUserDto } from './dto/create-user.dto';

const BCRYPT_ROUNDS = 12;

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {}

  async create(dto: CreateUserDto): Promise<Omit<User, 'password_hash'>> {
    const existing = await this.userRepository.findOne({
      where: { email: dto.email.toLowerCase() },
    });

    if (existing) {
      throw new ConflictException('A user with this email already exists');
    }

    const password_hash = await bcrypt.hash(dto.password, BCRYPT_ROUNDS);

    const user = this.userRepository.create({
      email: dto.email.toLowerCase(),
      password_hash,
      role: dto.role,
      full_name: dto.full_name,
    });

    const saved = await this.userRepository.save(user);
    const { password_hash: _, ...safeUser } = saved;
    return safeUser as Omit<User, 'password_hash'>;
  }

  async findAll(): Promise<Omit<User, 'password_hash'>[]> {
    const users = await this.userRepository.find({ order: { created_at: 'DESC' } });
    return users.map(({ password_hash: _, ...u }) => u as Omit<User, 'password_hash'>);
  }

  async findOne(id: string): Promise<Omit<User, 'password_hash'>> {
    const user = await this.userRepository.findOne({ where: { id } });
    if (!user) throw new NotFoundException('User not found');
    const { password_hash: _, ...safeUser } = user;
    return safeUser as Omit<User, 'password_hash'>;
  }

  async deactivate(id: string): Promise<void> {
    const user = await this.userRepository.findOne({ where: { id } });
    if (!user) throw new NotFoundException('User not found');
    await this.userRepository.update(id, { is_active: false });
  }

  async activate(id: string): Promise<void> {
    const user = await this.userRepository.findOne({ where: { id } });
    if (!user) throw new NotFoundException('User not found');
    await this.userRepository.update(id, { is_active: true });
  }
}
