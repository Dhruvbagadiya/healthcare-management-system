import { Repository, SelectQueryBuilder, ObjectLiteral, EntityManager } from 'typeorm';
import { TenantService } from '../services/tenant.service';
import { PaginationQueryDto, PaginatedResponse } from '../dto/pagination.dto';

export abstract class BaseRepository<T extends ObjectLiteral> extends Repository<T> {
    constructor(
        protected readonly entityTarget: any,
        protected readonly entityManager: EntityManager,
        protected readonly tenantService: TenantService,
    ) {
        super(entityTarget, entityManager);
    }

    /**
     * Automatically adds organizationId filter to the query builder
     */
    protected createTenantQueryBuilder(alias: string): SelectQueryBuilder<T> {
        const organizationId = this.tenantService.getTenantId();
        return this.createQueryBuilder(alias).where(`${alias}.organizationId = :organizationId`, {
            organizationId,
        });
    }

    /**
     * Generic paginated find method with tenant isolation
     */
    async findPaginated(
        queryDto: PaginationQueryDto,
        relations: string[] = [],
        searchFields: string[] = [],
    ): Promise<PaginatedResponse<T>> {
        const { page = 1, limit = 20, search, sortBy = 'createdAt', sortOrder = 'DESC' } = queryDto;
        const skip = (page - 1) * limit;
        const organizationId = this.tenantService.getTenantId();

        const queryBuilder = this.createQueryBuilder('entity');

        // Multi-tenant isolation
        queryBuilder.where('entity.organizationId = :organizationId', { organizationId });

        // Search logic
        if (search && searchFields.length > 0) {
            queryBuilder.andWhere(
                `(${searchFields.map((field) => `entity.${field} ILIKE :search`).join(' OR ')})`,
                { search: `%${search}%` },
            );
        }

        // Relations
        relations.forEach((relation) => {
            const parts = relation.split('.');
            if (parts.length === 1) {
                queryBuilder.leftJoinAndSelect(`entity.${relation}`, relation);
            } else {
                // For nested relations like 'patient.user', join step by step
                let currentAlias = 'entity';
                for (let i = 0; i < parts.length; i++) {
                    const property = parts[i];
                    const parentAlias = currentAlias;
                    currentAlias = parts.slice(0, i + 1).join('_'); // e.g., 'patient', 'patient_user'

                    // Only add the join if it's not already joined
                    // This is a bit complex in QueryBuilder, but we can check the expression map
                    const hasJoin = (queryBuilder as any).expressionMap.joinAttributes.some(
                        (attr: any) => attr.alias.name === currentAlias
                    );

                    if (!hasJoin) {
                        queryBuilder.leftJoinAndSelect(`${parentAlias}.${property}`, currentAlias);
                    }
                }
            }
        });

        // Sorting
        // Check if sortBy contains a dot (for relation sorting, e.g., 'user.firstName')
        if (sortBy.includes('.')) {
            queryBuilder.orderBy(sortBy, sortOrder);
        } else {
            queryBuilder.orderBy(`entity.${sortBy}`, sortOrder);
        }

        // Pagination
        queryBuilder.skip(skip).take(limit);

        const [data, total] = await queryBuilder.getManyAndCount();

        return {
            data,
            meta: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit),
            },
        };
    }
}
