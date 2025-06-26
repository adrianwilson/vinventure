import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { verifyFirebaseToken } from '../../../lib/firebase-admin';

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search');
    const region = searchParams.get('region');
    const wineType = searchParams.get('wineType');
    const sustainable = searchParams.get('sustainable');
    const featured = searchParams.get('featured');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const skip = (page - 1) * limit;

    const where: any = {
      status: 'APPROVED',
    };

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { region: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (region) {
      where.region = { contains: region, mode: 'insensitive' };
    }

    if (wineType) {
      where.wineTypes = { has: wineType };
    }

    if (sustainable === 'true') {
      where.sustainablePractices = true;
    }

    if (featured === 'true') {
      where.featured = true;
    }

    const [wineries, total] = await Promise.all([
      prisma.winery.findMany({
        where,
        include: {
          experiences: {
            where: { isActive: true },
            select: {
              id: true,
              title: true,
              price: true,
              duration: true,
              rating: true,
            },
          },
          _count: {
            select: {
              reviews: true,
            },
          },
        },
        orderBy: [
          { featured: 'desc' },
          { rating: 'desc' },
          { createdAt: 'desc' },
        ],
        skip,
        take: limit,
      }),
      prisma.winery.count({ where }),
    ]);

    return NextResponse.json({
      wineries,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Get wineries error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Missing or invalid authorization header' },
        { status: 401 }
      );
    }

    const token = authHeader.split('Bearer ')[1];
    const decodedToken = await verifyFirebaseToken(token);
    
    const user = await prisma.user.findUnique({
      where: { firebaseUid: decodedToken.uid },
    });

    if (!user || user.role !== 'WINERY_ADMIN') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      );
    }

    const {
      name,
      description,
      address,
      city,
      state,
      country,
      postalCode,
      latitude,
      longitude,
      phone,
      email,
      website,
      wineTypes,
      sustainablePractices,
      businessHours,
    } = await request.json();

    if (!name || !description || !address || !city || !state || !country) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const winery = await prisma.winery.create({
      data: {
        name,
        description,
        address,
        city,
        state,
        country,
        postalCode,
        latitude,
        longitude,
        phone,
        email,
        website,
        wineTypes: wineTypes || [],
        sustainablePractices: sustainablePractices || false,
        businessHours: businessHours || {},
        status: 'PENDING',
        ownerId: user.id,
      },
    });

    return NextResponse.json({ winery }, { status: 201 });
  } catch (error) {
    console.error('Create winery error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}