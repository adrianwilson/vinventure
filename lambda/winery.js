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

// Helper function to format winery data
function formatWineryData(record) {
  return {
    id: record.id,
    name: record.name,
    description: record.description,
    email: record.email,
    phone: record.phone,
    website: record.website,
    status: record.status,
    address: record.address,
    city: record.city,
    region: record.region,
    country: record.country,
    zipCode: record.zip_code,
    latitude: record.latitude,
    longitude: record.longitude,
    logoUrl: record.logo_url,
    bannerUrl: record.banner_url,
    images: record.images || [],
    foundedYear: record.founded_year,
    wineTypes: record.wine_types || [],
    sustainable: record.sustainable,
    sustainablePractices: record.sustainable_practices,
    featured: record.featured,
    rating: record.rating,
    createdAt: record.created_at,
    updatedAt: record.updated_at,
    ownerId: record.owner_id
  };
}

// Get all wineries with filtering and pagination
async function getAllWineries(filters = {}, page = 1, limit = 20) {
  try {
    const offset = (page - 1) * limit;
    
    let whereClause = "WHERE 1=1";
    const parameters = [];
    
    // Add filters
    if (filters.region) {
      whereClause += " AND region ILIKE :region";
      parameters.push({ name: 'region', value: { stringValue: `%${filters.region}%` } });
    }
    
    if (filters.wineType) {
      whereClause += " AND :wineType = ANY(wine_types)";
      parameters.push({ name: 'wineType', value: { stringValue: filters.wineType } });
    }
    
    if (filters.sustainable !== undefined) {
      whereClause += " AND sustainable = :sustainable";
      parameters.push({ name: 'sustainable', value: { booleanValue: filters.sustainable } });
    }
    
    if (filters.featured !== undefined) {
      whereClause += " AND featured = :featured";
      parameters.push({ name: 'featured', value: { booleanValue: filters.featured } });
    }
    
    if (filters.status) {
      whereClause += " AND status = :status";
      parameters.push({ name: 'status', value: { stringValue: filters.status } });
    } else {
      // Default to approved wineries for public listings
      whereClause += " AND status = 'APPROVED'";
    }
    
    if (filters.search) {
      whereClause += " AND (name ILIKE :search OR description ILIKE :search)";
      parameters.push({ name: 'search', value: { stringValue: `%${filters.search}%` } });
    }
    
    // Add pagination parameters
    parameters.push({ name: 'limit', value: { longValue: limit } });
    parameters.push({ name: 'offset', value: { longValue: offset } });
    
    const sql = `
      SELECT 
        id, name, description, email, phone, website, status,
        address, city, region, country, zip_code, latitude, longitude,
        logo_url, banner_url, images, founded_year, wine_types,
        sustainable, sustainable_practices, featured, rating,
        created_at, updated_at, owner_id
      FROM wineries 
      ${whereClause}
      ORDER BY 
        CASE WHEN featured = true THEN 0 ELSE 1 END,
        rating DESC NULLS LAST,
        name ASC
      LIMIT :limit OFFSET :offset
    `;
    
    const result = await executeQuery(sql, parameters);
    
    // Get total count for pagination
    const countSql = `SELECT COUNT(*) as total FROM wineries ${whereClause}`;
    const countResult = await executeQuery(countSql, parameters.slice(0, -2)); // Remove limit/offset
    const total = countResult.records[0].total;
    
    const wineries = result.records.map(formatWineryData);
    
    return {
      success: true,
      wineries,
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
    console.error('Get wineries error:', error);
    return {
      success: false,
      error: 'Failed to fetch wineries'
    };
  }
}

// Get single winery by ID
async function getWineryById(wineryId) {
  try {
    const sql = `
      SELECT 
        id, name, description, email, phone, website, status,
        address, city, region, country, zip_code, latitude, longitude,
        logo_url, banner_url, images, founded_year, wine_types,
        sustainable, sustainable_practices, featured, rating,
        created_at, updated_at, owner_id
      FROM wineries 
      WHERE id = :wineryId
    `;
    
    const parameters = [
      { name: 'wineryId', value: { stringValue: wineryId } }
    ];
    
    const result = await executeQuery(sql, parameters);
    
    if (result.records.length === 0) {
      return {
        success: false,
        error: 'Winery not found'
      };
    }
    
    const winery = formatWineryData(result.records[0]);
    
    return {
      success: true,
      winery
    };
    
  } catch (error) {
    console.error('Get winery error:', error);
    return {
      success: false,
      error: 'Failed to fetch winery'
    };
  }
}

// Create new winery
async function createWinery(wineryData, ownerId) {
  try {
    const sql = `
      INSERT INTO wineries (
        id, name, description, email, phone, website, status,
        address, city, region, country, zip_code, latitude, longitude,
        logo_url, banner_url, images, founded_year, wine_types,
        sustainable, sustainable_practices, featured, rating,
        created_at, updated_at, owner_id
      ) VALUES (
        gen_random_uuid(), :name, :description, :email, :phone, :website, 'PENDING',
        :address, :city, :region, :country, :zipCode, :latitude, :longitude,
        :logoUrl, :bannerUrl, :images, :foundedYear, :wineTypes,
        :sustainable, :sustainablePractices, false, NULL,
        NOW(), NOW(), :ownerId
      )
      RETURNING id, name, description, email, phone, website, status,
        address, city, region, country, zip_code, latitude, longitude,
        logo_url, banner_url, images, founded_year, wine_types,
        sustainable, sustainable_practices, featured, rating,
        created_at, updated_at, owner_id
    `;
    
    const parameters = [
      { name: 'name', value: { stringValue: wineryData.name } },
      { name: 'description', value: { stringValue: wineryData.description || '' } },
      { name: 'email', value: { stringValue: wineryData.email } },
      { name: 'phone', value: { stringValue: wineryData.phone || '' } },
      { name: 'website', value: { stringValue: wineryData.website || '' } },
      { name: 'address', value: { stringValue: wineryData.address } },
      { name: 'city', value: { stringValue: wineryData.city } },
      { name: 'region', value: { stringValue: wineryData.region } },
      { name: 'country', value: { stringValue: wineryData.country } },
      { name: 'zipCode', value: { stringValue: wineryData.zipCode || '' } },
      { name: 'latitude', value: { doubleValue: wineryData.latitude || 0 } },
      { name: 'longitude', value: { doubleValue: wineryData.longitude || 0 } },
      { name: 'logoUrl', value: { stringValue: wineryData.logoUrl || '' } },
      { name: 'bannerUrl', value: { stringValue: wineryData.bannerUrl || '' } },
      { name: 'images', value: { stringValue: JSON.stringify(wineryData.images || []) } },
      { name: 'foundedYear', value: { longValue: wineryData.foundedYear || null } },
      { name: 'wineTypes', value: { stringValue: JSON.stringify(wineryData.wineTypes || []) } },
      { name: 'sustainable', value: { booleanValue: wineryData.sustainable || false } },
      { name: 'sustainablePractices', value: { booleanValue: wineryData.sustainablePractices || false } },
      { name: 'ownerId', value: { stringValue: ownerId } }
    ];
    
    const result = await executeQuery(sql, parameters);
    const winery = formatWineryData(result.records[0]);
    
    return {
      success: true,
      winery
    };
    
  } catch (error) {
    console.error('Create winery error:', error);
    return {
      success: false,
      error: 'Failed to create winery'
    };
  }
}

// Update winery
async function updateWinery(wineryId, wineryData, userId, userRole) {
  try {
    // Check if user has permission to update this winery
    let permissionCheck = "";
    if (userRole !== 'PLATFORM_ADMIN') {
      permissionCheck = "AND owner_id = :userId";
    }
    
    const updateFields = [];
    const parameters = [
      { name: 'wineryId', value: { stringValue: wineryId } }
    ];
    
    if (userRole !== 'PLATFORM_ADMIN') {
      parameters.push({ name: 'userId', value: { stringValue: userId } });
    }
    
    // Build dynamic update query
    if (wineryData.name) {
      updateFields.push('name = :name');
      parameters.push({ name: 'name', value: { stringValue: wineryData.name } });
    }
    
    if (wineryData.description !== undefined) {
      updateFields.push('description = :description');
      parameters.push({ name: 'description', value: { stringValue: wineryData.description } });
    }
    
    if (wineryData.email) {
      updateFields.push('email = :email');
      parameters.push({ name: 'email', value: { stringValue: wineryData.email } });
    }
    
    if (wineryData.phone !== undefined) {
      updateFields.push('phone = :phone');
      parameters.push({ name: 'phone', value: { stringValue: wineryData.phone } });
    }
    
    if (wineryData.website !== undefined) {
      updateFields.push('website = :website');
      parameters.push({ name: 'website', value: { stringValue: wineryData.website } });
    }
    
    if (wineryData.address) {
      updateFields.push('address = :address');
      parameters.push({ name: 'address', value: { stringValue: wineryData.address } });
    }
    
    if (wineryData.city) {
      updateFields.push('city = :city');
      parameters.push({ name: 'city', value: { stringValue: wineryData.city } });
    }
    
    if (wineryData.region) {
      updateFields.push('region = :region');
      parameters.push({ name: 'region', value: { stringValue: wineryData.region } });
    }
    
    if (wineryData.country) {
      updateFields.push('country = :country');
      parameters.push({ name: 'country', value: { stringValue: wineryData.country } });
    }
    
    if (wineryData.zipCode !== undefined) {
      updateFields.push('zip_code = :zipCode');
      parameters.push({ name: 'zipCode', value: { stringValue: wineryData.zipCode } });
    }
    
    if (wineryData.latitude !== undefined) {
      updateFields.push('latitude = :latitude');
      parameters.push({ name: 'latitude', value: { doubleValue: wineryData.latitude } });
    }
    
    if (wineryData.longitude !== undefined) {
      updateFields.push('longitude = :longitude');
      parameters.push({ name: 'longitude', value: { doubleValue: wineryData.longitude } });
    }
    
    if (wineryData.logoUrl !== undefined) {
      updateFields.push('logo_url = :logoUrl');
      parameters.push({ name: 'logoUrl', value: { stringValue: wineryData.logoUrl } });
    }
    
    if (wineryData.bannerUrl !== undefined) {
      updateFields.push('banner_url = :bannerUrl');
      parameters.push({ name: 'bannerUrl', value: { stringValue: wineryData.bannerUrl } });
    }
    
    if (wineryData.images !== undefined) {
      updateFields.push('images = :images');
      parameters.push({ name: 'images', value: { stringValue: JSON.stringify(wineryData.images) } });
    }
    
    if (wineryData.foundedYear !== undefined) {
      updateFields.push('founded_year = :foundedYear');
      parameters.push({ name: 'foundedYear', value: { longValue: wineryData.foundedYear } });
    }
    
    if (wineryData.wineTypes !== undefined) {
      updateFields.push('wine_types = :wineTypes');
      parameters.push({ name: 'wineTypes', value: { stringValue: JSON.stringify(wineryData.wineTypes) } });
    }
    
    if (wineryData.sustainable !== undefined) {
      updateFields.push('sustainable = :sustainable');
      parameters.push({ name: 'sustainable', value: { booleanValue: wineryData.sustainable } });
    }
    
    if (wineryData.sustainablePractices !== undefined) {
      updateFields.push('sustainable_practices = :sustainablePractices');
      parameters.push({ name: 'sustainablePractices', value: { booleanValue: wineryData.sustainablePractices } });
    }
    
    // Only platform admin can update status and featured
    if (userRole === 'PLATFORM_ADMIN') {
      if (wineryData.status !== undefined) {
        updateFields.push('status = :status');
        parameters.push({ name: 'status', value: { stringValue: wineryData.status } });
      }
      
      if (wineryData.featured !== undefined) {
        updateFields.push('featured = :featured');
        parameters.push({ name: 'featured', value: { booleanValue: wineryData.featured } });
      }
    }
    
    if (updateFields.length === 0) {
      return {
        success: false,
        error: 'No fields to update'
      };
    }
    
    const sql = `
      UPDATE wineries 
      SET ${updateFields.join(', ')}, updated_at = NOW()
      WHERE id = :wineryId ${permissionCheck}
      RETURNING id, name, description, email, phone, website, status,
        address, city, region, country, zip_code, latitude, longitude,
        logo_url, banner_url, images, founded_year, wine_types,
        sustainable, sustainable_practices, featured, rating,
        created_at, updated_at, owner_id
    `;
    
    const result = await executeQuery(sql, parameters);
    
    if (result.records.length === 0) {
      return {
        success: false,
        error: 'Winery not found or access denied'
      };
    }
    
    const winery = formatWineryData(result.records[0]);
    
    return {
      success: true,
      winery
    };
    
  } catch (error) {
    console.error('Update winery error:', error);
    return {
      success: false,
      error: 'Failed to update winery'
    };
  }
}

// Delete winery
async function deleteWinery(wineryId, userId, userRole) {
  try {
    let permissionCheck = "";
    const parameters = [
      { name: 'wineryId', value: { stringValue: wineryId } }
    ];
    
    if (userRole !== 'PLATFORM_ADMIN') {
      permissionCheck = "AND owner_id = :userId";
      parameters.push({ name: 'userId', value: { stringValue: userId } });
    }
    
    const sql = `
      DELETE FROM wineries 
      WHERE id = :wineryId ${permissionCheck}
      RETURNING id, name
    `;
    
    const result = await executeQuery(sql, parameters);
    
    if (result.records.length === 0) {
      return {
        success: false,
        error: 'Winery not found or access denied'
      };
    }
    
    return {
      success: true,
      message: 'Winery deleted successfully'
    };
    
  } catch (error) {
    console.error('Delete winery error:', error);
    return {
      success: false,
      error: 'Failed to delete winery'
    };
  }
}

module.exports = {
  getAllWineries,
  getWineryById,
  createWinery,
  updateWinery,
  deleteWinery
};