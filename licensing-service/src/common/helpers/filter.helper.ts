import { Injectable } from '@nestjs/common';
import {
  BaseEntity,
  Between,
  FindOptionsOrder,
  FindOptionsWhere,
  LessThanOrEqual,
  Like,
  MoreThanOrEqual,
} from 'typeorm';

export interface PageOptions<T> {
  page?: number;
  pageSize?: number;
  where?: FindOptionsWhere<T> | FindOptionsWhere<T>[];
  relations?: string[];
  order?: FindOptionsOrder<T>;
  search?: { term?: string; columns?: (keyof T)[] };
  dateRange?: { column: keyof T; from?: Date; to?: Date };
}

export interface Page<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

type EntityClass<T extends BaseEntity> = { new (): T } & typeof BaseEntity;

@Injectable()
export class FilterHelper {
  async paginate<T extends BaseEntity>(
    Entity: EntityClass<T>,
    opts: PageOptions<T> = {},
  ): Promise<Page<T>> {
    const page = Math.max(1, Number(opts.page) || 1);
    const pageSize = Math.min(100, Math.max(1, Number(opts.pageSize) || 10));

    const where = this.buildWhere<T>(opts);

    const [items, total] = (await Entity.findAndCount({
      where: where as FindOptionsWhere<T>,
      relations: opts.relations,
      order: (opts.order ?? { created_at: 'DESC' }) as FindOptionsOrder<T>,
      take: pageSize,
      skip: (page - 1) * pageSize,
    })) as [T[], number];

    const totalPages = Math.max(1, Math.ceil(total / pageSize));
    return {
      items,
      total,
      page,
      pageSize,
      totalPages,
      hasNext: page < totalPages,
      hasPrev: page > 1,
    };
  }

  private buildWhere<T>(opts: PageOptions<T>): FindOptionsWhere<T> | FindOptionsWhere<T>[] | undefined {
    const base: Record<string, unknown> = { ...(opts.where as object) };

    if (opts.dateRange?.column) {
      const { column, from, to } = opts.dateRange;
      if (from && to) base[column as string] = Between(from, to);
      else if (from) base[column as string] = MoreThanOrEqual(from);
      else if (to) base[column as string] = LessThanOrEqual(to);
    }

    const term = opts.search?.term?.trim();
    const cols = opts.search?.columns ?? [];
    if (!term || cols.length === 0) {
      return Object.keys(base).length ? (base as FindOptionsWhere<T>) : undefined;
    }

    return cols.map((c) => ({ ...base, [c]: Like(`%${term}%`) }) as FindOptionsWhere<T>);
  }
}
