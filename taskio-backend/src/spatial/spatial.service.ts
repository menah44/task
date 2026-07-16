import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Response } from '../forms/entities/response.entity';
import { FormsService } from '../forms/forms.service';
import { ValidateGeofenceDto } from './dto/validate-geofence.dto';
import { ContainsDto } from './dto/contains.dto';
import { NearbyDto } from './dto/nearby.dto';
import { User } from '../auth/entities/user.entity';
import {
  isPointInPolygon,
  validateGeoJsonPolygon,
  isPointInBoundary,
  haversineDistance,
} from './utils/spatial-helpers';

interface CacheEntry {
  boundary: any;
  expiresAt: number;
}

@Injectable()
export class SpatialService {
  private boundaryCache = new Map<number, CacheEntry>();
  private readonly TTL_MS = 5 * 60 * 1000; // 5 minutes cache TTL

  constructor(
    @InjectRepository(Response)
    private readonly responseRepository: Repository<Response>,
    private readonly formsService: FormsService,
  ) {}

  /**
   * Check if a coordinate point lies inside a form's boundary.
   */
  async validateGeofence(
    dto: ValidateGeofenceDto,
    user: User,
  ): Promise<any> {
    const form = await this.formsService.findOne(dto.formId, user);
    const settings = (form.settings || {}) as any;

    console.log('\n======= VALIDATE GEOFENCE DEBUG =======');
    console.log('[1] Full settings from DB:', JSON.stringify(settings, null, 2));
    console.log('[2] restrictByLocation:', settings.restrictByLocation);
    console.log('[3] validationMode:', settings.validationMode);
    console.log('[4] allowedRadius:', settings.allowedRadius, '| type:', typeof settings.allowedRadius);
    console.log('[5] graceRadius:', settings.graceRadius, '| type:', typeof settings.graceRadius);
    console.log('[6] location:', settings.location);
    console.log('[7] Has boundary in DB:', !!form.boundary);
    console.log('[8] User coords: lat=', dto.latitude, 'lng=', dto.longitude);
    console.log('========================================\n');

    if (!settings.restrictByLocation && !form.boundary) {
      console.log('[RESULT] No restriction configured => AVAILABLE');
      return { inside: true, status: 'AVAILABLE' };
    }

    const lat = dto.latitude;
    const lng = dto.longitude;

    // 1. Point + Radius check (preferred, more precise)
    if (settings.location && settings.allowedRadius) {
      const distance = haversineDistance(lat, lng, settings.location.lat, settings.location.lng);
      const mode = (settings.validationMode as string) || 'STRICT';
      const allowedRadius = Number(settings.allowedRadius);
      const graceRadius = settings.graceRadius ? Number(settings.graceRadius) : null;

      console.log('[CALC] distance:', distance.toFixed(1), 'm');
      console.log('[CALC] mode:', mode, '| allowedRadius:', allowedRadius, '| graceRadius:', graceRadius);

      let status = 'AVAILABLE';
      let inside = true;

      if (distance > allowedRadius) {
        if (mode === 'ALLOW_NEARBY' && graceRadius && distance <= graceRadius) {
          status = 'NEARBY';
          console.log('[RESULT] NEARBY — outside allowedRadius but inside graceRadius');
        } else if (mode === 'DIRECTIONS') {
          status = 'BLOCKED_DIRECTIONS';
          inside = false;
          console.log('[RESULT] BLOCKED_DIRECTIONS');
        } else {
          status = 'BLOCKED';
          inside = false;
          console.log('[RESULT] BLOCKED — outside allowedRadius in STRICT mode');
        }
      } else {
        console.log('[RESULT] AVAILABLE — inside allowedRadius');
      }

      return {
        inside,
        distance: Math.round(distance),
        validationMode: mode,
        status,
        location: settings.location,
        allowedRadius,
        graceRadius,
      };
    }

    // 2. Fallback: GeoJSON polygon boundary
    if (!form.boundary) {
      console.log('[RESULT] No location config and no boundary => AVAILABLE');
      return { inside: true, status: 'AVAILABLE' };
    }

    const inside = isPointInBoundary([lng, lat], form.boundary);
    console.log('[RESULT] GeoJSON boundary check => inside:', inside);
    return {
      inside,
      status: inside ? 'AVAILABLE' : 'BLOCKED',
    };
  }

  /**
   * Check if point is inside the supplied polygon.
   */
  async contains(dto: ContainsDto): Promise<{ inside: boolean }> {
    if (!validateGeoJsonPolygon(dto.polygon)) {
      throw new BadRequestException('Invalid GeoJSON Polygon structure');
    }

    const inside = isPointInPolygon(
      [dto.point.longitude, dto.point.latitude],
      dto.polygon.coordinates,
    );
    return { inside };
  }

  /**
   * Find response locations within radius meters of a target coordinate using the Haversine formula.
   */
  async nearby(dto: NearbyDto): Promise<Response[]> {
    if (dto.radiusMeters < 0) {
      throw new BadRequestException('Radius must be a non-negative number');
    }

    const responses = await this.responseRepository
      .createQueryBuilder('response')
      .where(
        `
        (6371000 * acos(
          cos(radians(:latitude)) * 
          cos(radians(response.latitude)) * 
          cos(radians(response.longitude) - radians(:longitude)) + 
          sin(radians(:latitude)) * 
          sin(radians(response.latitude))
        )) <= :radiusMeters
        `,
        {
          latitude: dto.latitude,
          longitude: dto.longitude,
          radiusMeters: dto.radiusMeters,
        },
      )
      .getMany();

    return responses;
  }

  /**
   * Retrieve the form boundary, proxying the request and utilizing local cache.
   */
  async getFormBoundary(formId: number, user: User): Promise<any> {
    const cached = this.getCachedBoundary(formId);
    if (cached !== null) {
      return cached;
    }

    const boundary = await this.formsService.getBoundary(formId, user);
    this.setCachedBoundary(formId, boundary);
    return boundary;
  }

  private getCachedBoundary(formId: number): any | null {
    const entry = this.boundaryCache.get(formId);
    if (!entry) return null;
    if (Date.now() > entry.expiresAt) {
      this.boundaryCache.delete(formId);
      return null;
    }
    return entry.boundary;
  }

  private setCachedBoundary(formId: number, boundary: any): void {
    this.boundaryCache.set(formId, {
      boundary,
      expiresAt: Date.now() + this.TTL_MS,
    });
  }

  async reverseGeocode(lat: number, lng: number): Promise<any> {
    const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`;
    const response = await fetch(url, {
      headers: { 'User-Agent': 'taskio-app/1.0' },
    });
    if (!response.ok) {
      throw new BadRequestException('Reverse geocoding failed');
    }
    const data = await response.json() as any;
    return { address: data.display_name || null };
  }
}
