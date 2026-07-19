import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  UseGuards,
  ParseIntPipe,
  Query,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { SpatialService } from './spatial.service';
import { ValidateGeofenceDto } from './dto/validate-geofence.dto';
import { ContainsDto } from './dto/contains.dto';
import { NearbyDto } from './dto/nearby.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import { User } from '../auth/entities/user.entity';

@ApiTags('spatial')
@ApiBearerAuth()
@Controller('spatial')
@UseGuards(JwtAuthGuard)
export class SpatialController {
  constructor(private readonly spatialService: SpatialService) {}

  @Post('geofence/validate')
  validateGeofence(
    @Body() dto: ValidateGeofenceDto,
    @CurrentUser() user: User,
  ) {
    return this.spatialService.validateGeofence(dto, user);
  }

  @Post('contains')
  contains(@Body() dto: ContainsDto) {
    return this.spatialService.contains(dto);
  }

  @Post('nearby')
  nearby(@Body() dto: NearbyDto) {
    return this.spatialService.nearby(dto);
  }

  @Get('forms/:formId/boundary')
  getFormBoundary(
    @Param('formId', ParseIntPipe) formId: number,
    @CurrentUser() user: User,
  ) {
    return this.spatialService.getFormBoundary(formId, user);
  }

  @Get('reverse-geocode')
  reverseGeocode(
    @Query('lat') lat: string,
    @Query('lng') lng: string,
  ) {
    return this.spatialService.reverseGeocode(Number(lat), Number(lng));
  }
}
