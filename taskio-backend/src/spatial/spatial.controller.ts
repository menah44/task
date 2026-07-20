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
import axios from 'axios';

@ApiTags('spatial')
@ApiBearerAuth()
@Controller('spatial')
export class SpatialController {
  constructor(private readonly spatialService: SpatialService) {}

  /**
   * TEMPORARY DIAGNOSTIC ENDPOINT – remove after debugging production geocoding.
   * Not behind JwtAuthGuard so we can call it without credentials.
   */
  @Get('diag/nominatim')
  async diagNominatim(
    @Query('lat') lat: string,
    @Query('lng') lng: string,
  ) {
    const latNum = Number(lat) || 29.95878;
    const lngNum = Number(lng) || 31.09750;
    const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latNum}&lon=${lngNum}`;
    try {
      const response = await axios.get(url, {
        headers: { 'User-Agent': 'taskio-app/1.0' },
        timeout: 10000,
      });
      return {
        success: true,
        status: response.status,
        display_name: response.data?.display_name || null,
        nominatim_error: response.data?.error || null,
        raw_data_keys: Object.keys(response.data || {}),
      };
    } catch (error: any) {
      return {
        success: false,
        message: error.message,
        code: error.code,
        status: error.response?.status || null,
        statusText: error.response?.statusText || null,
        responseData: error.response?.data || null,
        responseHeaders: error.response?.headers || null,
      };
    }
  }

  @UseGuards(JwtAuthGuard)
  @Post('geofence/validate')
  validateGeofence(
    @Body() dto: ValidateGeofenceDto,
    @CurrentUser() user: User,
  ) {
    return this.spatialService.validateGeofence(dto, user);
  }

  @UseGuards(JwtAuthGuard)
  @Post('contains')
  contains(@Body() dto: ContainsDto) {
    return this.spatialService.contains(dto);
  }

  @UseGuards(JwtAuthGuard)
  @Post('nearby')
  nearby(@Body() dto: NearbyDto) {
    return this.spatialService.nearby(dto);
  }

  @UseGuards(JwtAuthGuard)
  @Get('forms/:formId/boundary')
  getFormBoundary(
    @Param('formId', ParseIntPipe) formId: number,
    @CurrentUser() user: User,
  ) {
    return this.spatialService.getFormBoundary(formId, user);
  }

  @UseGuards(JwtAuthGuard)
  @Get('reverse-geocode')
  reverseGeocode(@Query('lat') lat: string, @Query('lng') lng: string) {
    console.log(
      `[PROD-DEBUG] SpatialController.reverseGeocode called with lat: ${lat}, lng: ${lng}`,
    );
    return this.spatialService.reverseGeocode(Number(lat), Number(lng));
  }
}
