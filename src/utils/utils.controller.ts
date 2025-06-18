import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { UtilsService } from './utils.service';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiSecurity } from '@nestjs/swagger';
import { User } from '@prisma/client';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { CurrentUser } from 'src/decorators';
import { CollectMailDto } from './dto/collect-mail.dto';

@Controller('utils')
export class UtilsController {

    constructor(private readonly utilsService: UtilsService) { }

    @Post("mail-collector")
    async collectMail(@Body() collectMailDto: CollectMailDto) {
        return this.utilsService.collectMail(collectMailDto);
    }

}