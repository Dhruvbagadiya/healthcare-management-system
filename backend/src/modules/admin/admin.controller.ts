import {
    Controller,
    Get,
    Patch,
    Delete,
    Body,
    Param,
    Query,
    Request,
    UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../guards/jwt-auth.guard';
import { RolesGuard, Roles } from '../../guards/roles.guard';
import { UserRole, UserStatus } from '../users/entities/user.entity';
import { AdminService } from './admin.service';
import { OrganizationId } from '../../common/decorators/organization-id.decorator';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';

@ApiTags('Admin')
@ApiBearerAuth()
@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles([UserRole.ADMIN])
export class AdminController {
    constructor(private readonly adminService: AdminService) { }

    @Get('stats')
    @ApiOperation({ summary: 'Get organization user statistics' })
    async getStats(@OrganizationId() organizationId: string) {
        return this.adminService.getOrganizationStats(organizationId);
    }

    @Get('users')
    @ApiOperation({ summary: 'List all users in organization' })
    async getUsers(
        @OrganizationId() organizationId: string,
        @Query('search') search?: string,
        @Query('status') status?: string,
        @Query('role') role?: string,
        @Query('page') page?: string,
        @Query('limit') limit?: string,
    ) {
        return this.adminService.getUsers(organizationId, {
            search,
            status,
            role,
            page: page ? parseInt(page, 10) : 1,
            limit: limit ? parseInt(limit, 10) : 10,
        });
    }

    @Get('users/:id')
    @ApiOperation({ summary: 'Get user details with roles and permissions' })
    async getUser(
        @Param('id') id: string,
        @OrganizationId() organizationId: string,
    ) {
        return this.adminService.getUser(id, organizationId);
    }

    @Patch('users/:id/status')
    @ApiOperation({ summary: 'Update user status (activate, suspend, deactivate)' })
    async updateUserStatus(
        @Param('id') id: string,
        @OrganizationId() organizationId: string,
        @Body() body: { status: UserStatus },
        @Request() req: any,
    ) {
        return this.adminService.updateUserStatus(id, organizationId, body.status, req.user.id);
    }

    @Patch('users/:id/roles')
    @ApiOperation({ summary: 'Assign roles to a user' })
    async updateUserRoles(
        @Param('id') id: string,
        @OrganizationId() organizationId: string,
        @Body() body: { roleIds: string[] },
        @Request() req: any,
    ) {
        return this.adminService.updateUserRoles(id, organizationId, body.roleIds, req.user.id);
    }

    @Delete('users/:id')
    @ApiOperation({ summary: 'Soft delete a user' })
    async deleteUser(
        @Param('id') id: string,
        @OrganizationId() organizationId: string,
        @Request() req: any,
    ) {
        return this.adminService.deleteUser(id, organizationId, req.user.id);
    }
}
