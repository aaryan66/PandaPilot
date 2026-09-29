import { Controller, Get } from '@nestjs/common';
import { ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { HealthResponseDto } from './dto/health-response.dto';

@ApiTags('health')
@Controller('health')
export class HealthController {
  @ApiOkResponse({ type: HealthResponseDto })
  @Get()
  check(): HealthResponseDto {
    return { status: 'ok' };
  }
}
