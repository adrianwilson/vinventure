const { RDSDataClient, ExecuteStatementCommand } = require('@aws-sdk/client-rds-data');

const rds = new RDSDataClient({ region: process.env.AWS_REGION });

const DB_CLUSTER_ARN = process.env.DB_CLUSTER_ARN;
const DB_SECRET_ARN = process.env.DB_SECRET_ARN;

// Helper function to execute database queries
async function executeQuery(sql, parameters = []) {
  const command = new ExecuteStatementCommand({
    resourceArn: DB_CLUSTER_ARN,
    secretArn: DB_SECRET_ARN,
    database: 'vinventure',
    sql,
    parameters
  });
  
  try {
    const result = await rds.send(command);
    return result;
  } catch (error) {
    console.error('Database query error:', error);
    throw error;
  }
}

// Helper function to format booking data
function formatBookingData(record) {
  return {
    id: record.id,
    bookingDate: record.booking_date,
    guestCount: record.guest_count,
    totalAmount: record.total_amount,
    status: record.status,
    stripePaymentId: record.stripe_payment_id,
    paidAt: record.paid_at,
    guestName: record.guest_name,
    guestEmail: record.guest_email,
    guestPhone: record.guest_phone,
    specialRequests: record.special_requests,
    createdAt: record.created_at,
    updatedAt: record.updated_at,
    userId: record.user_id,
    wineryId: record.winery_id,
    experienceId: record.experience_id
  };
}

// Helper function to format booking with related data
function formatBookingWithDetails(record) {
  return {
    id: record.id,
    bookingDate: record.booking_date,
    guestCount: record.guest_count,
    totalAmount: record.total_amount,
    status: record.status,
    stripePaymentId: record.stripe_payment_id,
    paidAt: record.paid_at,
    guestName: record.guest_name,
    guestEmail: record.guest_email,
    guestPhone: record.guest_phone,
    specialRequests: record.special_requests,
    createdAt: record.created_at,
    updatedAt: record.updated_at,
    user: {
      id: record.user_id,
      name: record.user_name,
      email: record.user_email
    },
    winery: {
      id: record.winery_id,
      name: record.winery_name,
      city: record.winery_city,
      region: record.winery_region
    },
    experience: {
      id: record.experience_id,
      title: record.experience_title,
      type: record.experience_type,
      duration: record.experience_duration,
      price: record.experience_price
    }
  };
}

// Check availability for a booking
async function checkAvailability(experienceId, bookingDate, guestCount) {
  try {
    // Get experience details
    const experienceQuery = `
      SELECT e.id, e.title, e.max_guests, e.available_days, e.start_time, e.end_time,
             w.id as winery_id, w.name as winery_name
      FROM experiences e
      JOIN wineries w ON e.winery_id = w.id
      WHERE e.id = :experienceId AND e.is_active = true
    `;
    
    const experienceResult = await executeQuery(experienceQuery, [
      { name: 'experienceId', value: { stringValue: experienceId } }
    ]);
    
    if (experienceResult.records.length === 0) {
      return {
        success: false,
        error: 'Experience not found or not active'
      };
    }
    
    const experience = experienceResult.records[0];
    
    // Check if guest count exceeds max capacity
    if (guestCount > experience.max_guests) {
      return {
        success: false,
        error: `Maximum ${experience.max_guests} guests allowed for this experience`
      };
    }
    
    // Check if booking date is in the past
    const bookingDateObj = new Date(bookingDate);
    const now = new Date();
    if (bookingDateObj < now) {
      return {
        success: false,
        error: 'Cannot book for past dates'
      };
    }
    
    // Check day of week availability
    const dayOfWeek = bookingDateObj.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
    const availableDays = experience.available_days || [];
    
    if (availableDays.length > 0 && !availableDays.includes(dayOfWeek)) {
      return {
        success: false,
        error: `Experience not available on ${dayOfWeek}s`
      };
    }
    
    // Check existing bookings for the same date
    const existingBookingsQuery = `
      SELECT SUM(guest_count) as total_guests
      FROM bookings
      WHERE experience_id = :experienceId 
        AND DATE(booking_date) = DATE(:bookingDate)
        AND status IN ('PENDING', 'CONFIRMED')
    `;
    
    const existingBookingsResult = await executeQuery(existingBookingsQuery, [
      { name: 'experienceId', value: { stringValue: experienceId } },
      { name: 'bookingDate', value: { stringValue: bookingDate } }
    ]);
    
    const existingGuests = existingBookingsResult.records[0]?.total_guests || 0;
    const remainingCapacity = experience.max_guests - existingGuests;
    
    if (guestCount > remainingCapacity) {
      return {
        success: false,
        error: `Only ${remainingCapacity} spots remaining for this date`
      };
    }
    
    return {
      success: true,
      experience: {
        id: experience.id,
        title: experience.title,
        maxGuests: experience.max_guests,
        remainingCapacity,
        winery: {
          id: experience.winery_id,
          name: experience.winery_name
        }
      }
    };
    
  } catch (error) {
    console.error('Check availability error:', error);
    return {
      success: false,
      error: 'Failed to check availability'
    };
  }
}

// Get all bookings with filtering
async function getAllBookings(filters = {}, userId = null, userRole = 'GUEST', page = 1, limit = 20) {
  try {
    const offset = (page - 1) * limit;
    
    let whereClause = "WHERE 1=1";
    const parameters = [];
    
    // Role-based filtering
    if (userRole === 'GUEST') {
      whereClause += " AND b.user_id = :userId";
      parameters.push({ name: 'userId', value: { stringValue: userId } });
    } else if (userRole === 'WINERY_ADMIN') {
      whereClause += " AND w.owner_id = :userId";
      parameters.push({ name: 'userId', value: { stringValue: userId } });
    }
    // PLATFORM_ADMIN can see all bookings
    
    // Add filters
    if (filters.status) {
      whereClause += " AND b.status = :status";
      parameters.push({ name: 'status', value: { stringValue: filters.status } });
    }
    
    if (filters.wineryId) {
      whereClause += " AND b.winery_id = :wineryId";
      parameters.push({ name: 'wineryId', value: { stringValue: filters.wineryId } });
    }
    
    if (filters.experienceId) {
      whereClause += " AND b.experience_id = :experienceId";
      parameters.push({ name: 'experienceId', value: { stringValue: filters.experienceId } });
    }
    
    if (filters.startDate) {
      whereClause += " AND b.booking_date >= :startDate";
      parameters.push({ name: 'startDate', value: { stringValue: filters.startDate } });
    }
    
    if (filters.endDate) {
      whereClause += " AND b.booking_date <= :endDate";
      parameters.push({ name: 'endDate', value: { stringValue: filters.endDate } });
    }
    
    // Add pagination parameters
    parameters.push({ name: 'limit', value: { longValue: limit } });
    parameters.push({ name: 'offset', value: { longValue: offset } });
    
    const sql = `
      SELECT 
        b.id, b.booking_date, b.guest_count, b.total_amount, b.status,
        b.stripe_payment_id, b.paid_at, b.guest_name, b.guest_email, b.guest_phone,
        b.special_requests, b.created_at, b.updated_at,
        b.user_id, u.name as user_name, u.email as user_email,
        b.winery_id, w.name as winery_name, w.city as winery_city, w.region as winery_region,
        b.experience_id, e.title as experience_title, e.type as experience_type,
        e.duration as experience_duration, e.price as experience_price
      FROM bookings b
      JOIN users u ON b.user_id = u.id
      JOIN wineries w ON b.winery_id = w.id
      JOIN experiences e ON b.experience_id = e.id
      ${whereClause}
      ORDER BY b.booking_date DESC
      LIMIT :limit OFFSET :offset
    `;
    
    const result = await executeQuery(sql, parameters);
    
    // Get total count for pagination
    const countSql = `
      SELECT COUNT(*) as total
      FROM bookings b
      JOIN users u ON b.user_id = u.id
      JOIN wineries w ON b.winery_id = w.id
      JOIN experiences e ON b.experience_id = e.id
      ${whereClause}
    `;
    const countResult = await executeQuery(countSql, parameters.slice(0, -2)); // Remove limit/offset
    const total = countResult.records[0].total;
    
    const bookings = result.records.map(formatBookingWithDetails);
    
    return {
      success: true,
      bookings,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasNext: page < Math.ceil(total / limit),
        hasPrev: page > 1
      }
    };
    
  } catch (error) {
    console.error('Get bookings error:', error);
    return {
      success: false,
      error: 'Failed to fetch bookings'
    };
  }
}

// Get single booking by ID
async function getBookingById(bookingId, userId = null, userRole = 'GUEST') {
  try {
    let whereClause = "WHERE b.id = :bookingId";
    const parameters = [
      { name: 'bookingId', value: { stringValue: bookingId } }
    ];
    
    // Role-based access control
    if (userRole === 'GUEST') {
      whereClause += " AND b.user_id = :userId";
      parameters.push({ name: 'userId', value: { stringValue: userId } });
    } else if (userRole === 'WINERY_ADMIN') {
      whereClause += " AND w.owner_id = :userId";
      parameters.push({ name: 'userId', value: { stringValue: userId } });
    }
    // PLATFORM_ADMIN can see any booking
    
    const sql = `
      SELECT 
        b.id, b.booking_date, b.guest_count, b.total_amount, b.status,
        b.stripe_payment_id, b.paid_at, b.guest_name, b.guest_email, b.guest_phone,
        b.special_requests, b.created_at, b.updated_at,
        b.user_id, u.name as user_name, u.email as user_email,
        b.winery_id, w.name as winery_name, w.city as winery_city, w.region as winery_region,
        b.experience_id, e.title as experience_title, e.type as experience_type,
        e.duration as experience_duration, e.price as experience_price
      FROM bookings b
      JOIN users u ON b.user_id = u.id
      JOIN wineries w ON b.winery_id = w.id
      JOIN experiences e ON b.experience_id = e.id
      ${whereClause}
    `;
    
    const result = await executeQuery(sql, parameters);
    
    if (result.records.length === 0) {
      return {
        success: false,
        error: 'Booking not found or access denied'
      };
    }
    
    const booking = formatBookingWithDetails(result.records[0]);
    
    return {
      success: true,
      booking
    };
    
  } catch (error) {
    console.error('Get booking error:', error);
    return {
      success: false,
      error: 'Failed to fetch booking'
    };
  }
}

// Create new booking
async function createBooking(bookingData, userId) {
  try {
    const {
      experienceId,
      bookingDate,
      guestCount,
      guestName,
      guestEmail,
      guestPhone,
      specialRequests
    } = bookingData;
    
    // Validate required fields
    if (!experienceId || !bookingDate || !guestCount || !guestName || !guestEmail) {
      return {
        success: false,
        error: 'Missing required fields: experienceId, bookingDate, guestCount, guestName, guestEmail'
      };
    }
    
    // Check availability
    const availabilityResult = await checkAvailability(experienceId, bookingDate, guestCount);
    if (!availabilityResult.success) {
      return availabilityResult;
    }
    
    // Get experience details for pricing
    const experienceQuery = `
      SELECT e.id, e.title, e.price, e.winery_id, w.name as winery_name
      FROM experiences e
      JOIN wineries w ON e.winery_id = w.id
      WHERE e.id = :experienceId
    `;
    
    const experienceResult = await executeQuery(experienceQuery, [
      { name: 'experienceId', value: { stringValue: experienceId } }
    ]);
    
    if (experienceResult.records.length === 0) {
      return {
        success: false,
        error: 'Experience not found'
      };
    }
    
    const experience = experienceResult.records[0];
    const totalAmount = experience.price * guestCount;
    
    // Create booking
    const sql = `
      INSERT INTO bookings (
        id, booking_date, guest_count, total_amount, status,
        guest_name, guest_email, guest_phone, special_requests,
        created_at, updated_at, user_id, winery_id, experience_id
      ) VALUES (
        gen_random_uuid(), :bookingDate, :guestCount, :totalAmount, 'PENDING',
        :guestName, :guestEmail, :guestPhone, :specialRequests,
        NOW(), NOW(), :userId, :wineryId, :experienceId
      )
      RETURNING id, booking_date, guest_count, total_amount, status,
        guest_name, guest_email, guest_phone, special_requests,
        created_at, updated_at, user_id, winery_id, experience_id
    `;
    
    const parameters = [
      { name: 'bookingDate', value: { stringValue: bookingDate } },
      { name: 'guestCount', value: { longValue: guestCount } },
      { name: 'totalAmount', value: { doubleValue: totalAmount } },
      { name: 'guestName', value: { stringValue: guestName } },
      { name: 'guestEmail', value: { stringValue: guestEmail } },
      { name: 'guestPhone', value: { stringValue: guestPhone || '' } },
      { name: 'specialRequests', value: { stringValue: specialRequests || '' } },
      { name: 'userId', value: { stringValue: userId } },
      { name: 'wineryId', value: { stringValue: experience.winery_id } },
      { name: 'experienceId', value: { stringValue: experienceId } }
    ];
    
    const result = await executeQuery(sql, parameters);
    const booking = formatBookingData(result.records[0]);
    
    return {
      success: true,
      booking: {
        ...booking,
        experience: {
          id: experience.id,
          title: experience.title,
          price: experience.price
        },
        winery: {
          id: experience.winery_id,
          name: experience.winery_name
        }
      }
    };
    
  } catch (error) {
    console.error('Create booking error:', error);
    return {
      success: false,
      error: 'Failed to create booking'
    };
  }
}

// Update booking
async function updateBooking(bookingId, bookingData, userId, userRole) {
  try {
    // Check if user has permission to update this booking
    let permissionCheck = "";
    const parameters = [
      { name: 'bookingId', value: { stringValue: bookingId } }
    ];
    
    if (userRole === 'GUEST') {
      permissionCheck = "AND b.user_id = :userId";
      parameters.push({ name: 'userId', value: { stringValue: userId } });
    } else if (userRole === 'WINERY_ADMIN') {
      permissionCheck = "AND w.owner_id = :userId";
      parameters.push({ name: 'userId', value: { stringValue: userId } });
    }
    // PLATFORM_ADMIN can update any booking
    
    const updateFields = [];
    
    // Build dynamic update query
    if (bookingData.guestCount !== undefined) {
      updateFields.push('guest_count = :guestCount');
      parameters.push({ name: 'guestCount', value: { longValue: bookingData.guestCount } });
    }
    
    if (bookingData.guestName !== undefined) {
      updateFields.push('guest_name = :guestName');
      parameters.push({ name: 'guestName', value: { stringValue: bookingData.guestName } });
    }
    
    if (bookingData.guestEmail !== undefined) {
      updateFields.push('guest_email = :guestEmail');
      parameters.push({ name: 'guestEmail', value: { stringValue: bookingData.guestEmail } });
    }
    
    if (bookingData.guestPhone !== undefined) {
      updateFields.push('guest_phone = :guestPhone');
      parameters.push({ name: 'guestPhone', value: { stringValue: bookingData.guestPhone } });
    }
    
    if (bookingData.specialRequests !== undefined) {
      updateFields.push('special_requests = :specialRequests');
      parameters.push({ name: 'specialRequests', value: { stringValue: bookingData.specialRequests } });
    }
    
    if (bookingData.status !== undefined) {
      // Only winery admin or platform admin can update status
      if (userRole === 'WINERY_ADMIN' || userRole === 'PLATFORM_ADMIN') {
        updateFields.push('status = :status');
        parameters.push({ name: 'status', value: { stringValue: bookingData.status } });
      }
    }
    
    if (bookingData.stripePaymentId !== undefined) {
      updateFields.push('stripe_payment_id = :stripePaymentId');
      parameters.push({ name: 'stripePaymentId', value: { stringValue: bookingData.stripePaymentId } });
      
      if (bookingData.stripePaymentId) {
        updateFields.push('paid_at = NOW()');
        updateFields.push('status = :paidStatus');
        parameters.push({ name: 'paidStatus', value: { stringValue: 'CONFIRMED' } });
      }
    }
    
    if (updateFields.length === 0) {
      return {
        success: false,
        error: 'No fields to update'
      };
    }
    
    const sql = `
      UPDATE bookings b
      SET ${updateFields.join(', ')}, updated_at = NOW()
      FROM wineries w
      WHERE b.id = :bookingId AND b.winery_id = w.id ${permissionCheck}
      RETURNING b.id, b.booking_date, b.guest_count, b.total_amount, b.status,
        b.stripe_payment_id, b.paid_at, b.guest_name, b.guest_email, b.guest_phone,
        b.special_requests, b.created_at, b.updated_at,
        b.user_id, b.winery_id, b.experience_id
    `;
    
    const result = await executeQuery(sql, parameters);
    
    if (result.records.length === 0) {
      return {
        success: false,
        error: 'Booking not found or access denied'
      };
    }
    
    const booking = formatBookingData(result.records[0]);
    
    return {
      success: true,
      booking
    };
    
  } catch (error) {
    console.error('Update booking error:', error);
    return {
      success: false,
      error: 'Failed to update booking'
    };
  }
}

// Cancel booking
async function cancelBooking(bookingId, userId, userRole) {
  try {
    let permissionCheck = "";
    const parameters = [
      { name: 'bookingId', value: { stringValue: bookingId } }
    ];
    
    if (userRole === 'GUEST') {
      permissionCheck = "AND b.user_id = :userId";
      parameters.push({ name: 'userId', value: { stringValue: userId } });
    } else if (userRole === 'WINERY_ADMIN') {
      permissionCheck = "AND w.owner_id = :userId";
      parameters.push({ name: 'userId', value: { stringValue: userId } });
    }
    // PLATFORM_ADMIN can cancel any booking
    
    const sql = `
      UPDATE bookings b
      SET status = 'CANCELLED', updated_at = NOW()
      FROM wineries w
      WHERE b.id = :bookingId AND b.winery_id = w.id ${permissionCheck}
      RETURNING b.id, b.status, b.total_amount, b.stripe_payment_id
    `;
    
    const result = await executeQuery(sql, parameters);
    
    if (result.records.length === 0) {
      return {
        success: false,
        error: 'Booking not found or access denied'
      };
    }
    
    const booking = result.records[0];
    
    return {
      success: true,
      booking: {
        id: booking.id,
        status: booking.status,
        refundRequired: booking.stripe_payment_id ? true : false,
        refundAmount: booking.total_amount
      }
    };
    
  } catch (error) {
    console.error('Cancel booking error:', error);
    return {
      success: false,
      error: 'Failed to cancel booking'
    };
  }
}

module.exports = {
  checkAvailability,
  getAllBookings,
  getBookingById,
  createBooking,
  updateBooking,
  cancelBooking
};