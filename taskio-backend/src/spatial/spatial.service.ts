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
    console.log("Incoming DTO:", dto);

    // 1. Fetch form to verify it exists
    const form = await this.formsService.findOne(dto.formId, user);

    // 2. Check if boundary exists
    if (!form.boundary) {
      return { inside: true };
    }

    console.log("Boundary from DB:", form.boundary);
    console.log("Latitude:", dto.latitude);
    console.log("Longitude:", dto.longitude);

    // 3. Evaluate point intersection using the shared helper
    const inside = isPointInBoundary([dto.longitude, dto.latitude], form.boundary);
    
    console.log("Validation result:", inside);
    
    if (!inside) {
      const boundary = form.boundary;
      const geojson = boundary?.geojson ?? boundary;
      console.log("User:", dto.latitude, dto.longitude);
      console.log("Polygon:", geojson);
      console.log("Inside:", inside);
    }
    
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

  async reverseGeocode(lat: number, lng: number): Promise<{ address: string }> {
    try {
      const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`;
      const response = await fetch(url, {
        headers: {
          'Accept-Language': 'en',
          'User-Agent': 'Taskio-Backend/1.0 (contact@taskio.example.com)',
        },
      });

      if (!response.ok) {
        console.error(`[Reverse Geocoding] Nominatim failed with status: ${response.status}`);
        return { address: '' };
      }

      const data = await response.json();
      if (data && data.display_name) {
        return { address: data.display_name };
      }
      return { address: '' };
    } catch (error) {
      console.error('[Reverse Geocoding] Error:', error);
      return { address: '' };
    }
  }
}
