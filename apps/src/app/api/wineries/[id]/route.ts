import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { verifyFirebaseToken } from '../../../../lib/firebase-admin';

const prisma = new PrismaClient();

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const winery = await prisma.winery.findUnique({
      where: { id: params.id },
      include: {
        experiences: {
          where: { isActive: true },
          include: {
            bookings: {
              select: {
                date: true,
                timeSlot: true,
                guests: true,
              },
            },
          },
        },
        reviews: {
          include: {
            user: {
              select: {
                name: true,
              },
            },
          },
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
        _count: {
          select: {
            reviews: true,
            experiences: true,
          },
        },
      },
    });

    if (!winery) {
      return NextResponse.json(
        { error: 'Winery not found' },
        { status: 404 }
      );
    }

    if (winery.status !== 'APPROVED') {
      return NextResponse.json(
        { error: 'Winery not available' },
        { status: 404 }
      );
    }

    return NextResponse.json({ winery });
  } catch (error) {
    console.error('Get winery error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    const winery = await prisma.winery.findUnique({
      where: { id: params.id },
    });

    if (!winery) {
      return NextResponse.json(
        { error: 'Winery not found' },
        { status: 404 }
      );
    }

    if (winery.ownerId !== user.id && user.role !== 'PLATFORM_ADMIN') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      );
    }

    const updateData = await request.json();
    
    if (user.role === 'PLATFORM_ADMIN') {
      const updatedWinery = await prisma.winery.update({
        where: { id: params.id },
        data: updateData,
      });
      return NextResponse.json({ winery: updatedWinery });
    } else {
      const { status, featured, ...allowedUpdates } = updateData;
      const updatedWinery = await prisma.winery.update({
        where: { id: params.id },
        data: {
          ...allowedUpdates,
          status: 'PENDING', 
        },
      });
      return NextResponse.json({ winery: updatedWinery });
    }
  } catch (error) {
    console.error('Update winery error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    const winery = await prisma.winery.findUnique({
      where: { id: params.id },
    });

    if (!winery) {
      return NextResponse.json(
        { error: 'Winery not found' },
        { status: 404 }
      );
    }

    if (winery.ownerId !== user.id && user.role !== 'PLATFORM_ADMIN') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      );
    }

    await prisma.winery.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete winery error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}