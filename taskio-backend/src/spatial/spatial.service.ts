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
  ): Promise<{ inside: boolean }> {
    // 1. Fetch form to verify it exists
    const form = await this.formsService.findOne(dto.formId, user);

    // 2. Check if boundary exists
    if (!form.boundary) {
      return { inside: true };
    }

    // 3. Extract polygon geometry from boundary GeoJSON (FeatureCollection/Feature)
    let coordinates: number[][][] | null = null;
    try {
      const geojson = form.boundary;
      if (
        geojson.type === 'FeatureCollection' &&
        Array.isArray(geojson.features) &&
        geojson.features.length > 0
      ) {
        const feature = geojson.features[0];
        if (feature.geometry && feature.geometry.type === 'Polygon') {
          coordinates = feature.geometry.coordinates;
        }
      } else if (
        geojson.type === 'Feature' &&
        geojson.geometry &&
        geojson.geometry.type === 'Polygon'
      ) {
        coordinates = geojson.geometry.coordinates;
      } else if (geojson.type === 'Polygon') {
        coordinates = geojson.coordinates;
      }
    } catch {
      // If parsing fails, fall back to true
    }

    if (!coordinates) {
      return { inside: true };
    }

    const inside = isPointInPolygon([dto.longitude, dto.latitude], coordinates);
    return { inside };
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

    // Using Haversine formula for distance calculation in PostgreSQL
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
    // Check cache first
    const cached = this.getCachedBoundary(formId);
    if (cached !== null) {
      return cached;
    }

    // Cache miss - retrieve from forms service
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
}
