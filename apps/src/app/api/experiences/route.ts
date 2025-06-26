import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { verifyFirebaseToken } from '../../../lib/firebase-admin';

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const wineryId = searchParams.get('wineryId');
    const experienceType = searchParams.get('type');
    const minPrice = searchParams.get('minPrice');
    const maxPrice = searchParams.get('maxPrice');
    const minDuration = searchParams.get('minDuration');
    const maxDuration = searchParams.get('maxDuration');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const skip = (page - 1) * limit;

    const where: any = {
      isActive: true,
      winery: {
        status: 'APPROVED',
      },
    };

    if (wineryId) {
      where.wineryId = wineryId;
    }

    if (experienceType) {
      where.experienceType = experienceType;
    }

    if (minPrice) {
      where.price = { ...where.price, gte: parseFloat(minPrice) };
    }

    if (maxPrice) {
      where.price = { ...where.price, lte: parseFloat(maxPrice) };
    }

    if (minDuration) {
      where.duration = { ...where.duration, gte: parseInt(minDuration) };
    }

    if (maxDuration) {
      where.duration = { ...where.duration, lte: parseInt(maxDuration) };
    }

    const [experiences, total] = await Promise.all([
      prisma.experience.findMany({
        where,
        include: {
          winery: {
            select: {
              id: true,
              name: true,
              city: true,
              state: true,
              rating: true,
            },
          },
          bookings: {
            select: {
              date: true,
              timeSlot: true,
              guests: true,
            },
          },
        },
        orderBy: [
          { rating: 'desc' },
          { createdAt: 'desc' },
        ],
        skip,
        take: limit,
      }),
      prisma.experience.count({ where }),
    ]);

    return NextResponse.json({
      experiences,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Get experiences error:', error);
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
      include: {
        winery: true,
      },
    });

    if (!user || !user.winery || user.role !== 'WINERY_ADMIN') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      );
    }

    const {
      title,
      description,
      experienceType,
      price,
      duration,
      maxGuests,
      includes,
      availableTimeSlots,
      cancellationPolicy,
      requirements,
    } = await request.json();

    if (!title || !description || !experienceType || !price || !duration || !maxGuests) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const experience = await prisma.experience.create({
      data: {
        title,
        description,
        experienceType,
        price: parseFloat(price),
        duration: parseInt(duration),
        maxGuests: parseInt(maxGuests),
        includes: includes || [],
        availableTimeSlots: availableTimeSlots || [],
        cancellationPolicy,
        requirements: requirements || [],
        wineryId: user.winery.id,
        isActive: true,
      },
    });

    return NextResponse.json({ experience }, { status: 201 });
  } catch (error) {
    console.error('Create experience error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}