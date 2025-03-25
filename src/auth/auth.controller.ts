import { Body, Controller, Get, Post, UseGuards, UsePipes, ValidationPipe } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { JwtAuthGuard } from './jwt-auth.guard';
import { ApiBearerAuth, ApiSecurity } from '@nestjs/swagger';
import { CurrentUser } from 'src/decorators';


@Controller('auth')
export class AuthController {

    constructor (private readonly authService: AuthService) {}

    @Post("login")
    @UsePipes(new ValidationPipe({ whitelist: true, transform: true }))
    async login(@Body() loginDto: LoginDto) {
        return await this.authService.login(loginDto.wallet_address, loginDto.signature, loginDto.message)
    }

}
