const { CognitoIdentityProviderClient, 
        AdminInitiateAuthCommand,
        AdminCreateUserCommand,
        AdminSetUserPasswordCommand,
        AdminGetUserCommand,
        AdminUpdateUserAttributesCommand } = require('@aws-sdk/client-cognito-identity-provider');
const { RDSDataClient, ExecuteStatementCommand } = require('@aws-sdk/client-rds-data');
const jwt = require('jsonwebtoken');

const cognito = new CognitoIdentityProviderClient({ region: process.env.AWS_REGION });
const rds = new RDSDataClient({ region: process.env.AWS_REGION });

const USER_POOL_ID = process.env.COGNITO_USER_POOL_ID;
const CLIENT_ID = process.env.COGNITO_CLIENT_ID;
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

// Helper function to create user in database
async function createUserInDatabase(cognitoUid, email, name, role = 'GUEST') {
  const sql = `
    INSERT INTO users (id, cognito_uid, email, name, role, created_at, updated_at)
    VALUES (gen_random_uuid(), :cognitoUid, :email, :name, :role, NOW(), NOW())
    RETURNING id, cognito_uid, email, name, role, created_at
  `;
  
  const parameters = [
    { name: 'cognitoUid', value: { stringValue: cognitoUid } },
    { name: 'email', value: { stringValue: email } },
    { name: 'name', value: { stringValue: name || '' } },
    { name: 'role', value: { stringValue: role } }
  ];
  
  const result = await executeQuery(sql, parameters);
  return result.records[0];
}

// Helper function to get user from database
async function getUserFromDatabase(cognitoUid) {
  const sql = `
    SELECT id, cognito_uid, email, name, role, avatar_url, preferences, created_at, updated_at
    FROM users 
    WHERE cognito_uid = :cognitoUid
  `;
  
  const parameters = [
    { name: 'cognitoUid', value: { stringValue: cognitoUid } }
  ];
  
  const result = await executeQuery(sql, parameters);
  return result.records[0];
}

// Register new user
async function registerUser(email, password, name) {
  try {
    // Create user in Cognito
    const createUserCommand = new AdminCreateUserCommand({
      UserPoolId: USER_POOL_ID,
      Username: email,
      MessageAction: 'SUPPRESS', // Don't send welcome email
      TemporaryPassword: password,
      UserAttributes: [
        { Name: 'email', Value: email },
        { Name: 'name', Value: name || '' },
        { Name: 'email_verified', Value: 'true' }
      ]
    });
    
    const cognitoUser = await cognito.send(createUserCommand);
    
    // Set permanent password
    const setPasswordCommand = new AdminSetUserPasswordCommand({
      UserPoolId: USER_POOL_ID,
      Username: email,
      Password: password,
      Permanent: true
    });
    
    await cognito.send(setPasswordCommand);
    
    // Create user in our database
    const dbUser = await createUserInDatabase(cognitoUser.User.Username, email, name);
    
    return {
      success: true,
      user: {
        id: dbUser.id,
        cognitoUid: cognitoUser.User.Username,
        email: email,
        name: name,
        role: 'GUEST'
      }
    };
    
  } catch (error) {
    console.error('Registration error:', error);
    
    if (error.name === 'UsernameExistsException') {
      return {
        success: false,
        error: 'User already exists with this email'
      };
    }
    
    return {
      success: false,
      error: 'Registration failed'
    };
  }
}

// Login user
async function loginUser(email, password) {
  try {
    const authCommand = new AdminInitiateAuthCommand({
      UserPoolId: USER_POOL_ID,
      ClientId: CLIENT_ID,
      AuthFlow: 'ADMIN_NO_SRP_AUTH',
      AuthParameters: {
        USERNAME: email,
        PASSWORD: password
      }
    });
    
    const authResult = await cognito.send(authCommand);
    
    if (authResult.AuthenticationResult) {
      const { AccessToken, IdToken, RefreshToken } = authResult.AuthenticationResult;
      
      // Decode the ID token to get user info
      const decodedToken = jwt.decode(IdToken);
      
      // Get user from our database
      const dbUser = await getUserFromDatabase(decodedToken.sub);
      
      return {
        success: true,
        tokens: {
          accessToken: AccessToken,
          idToken: IdToken,
          refreshToken: RefreshToken
        },
        user: dbUser ? {
          id: dbUser.id,
          cognitoUid: dbUser.cognito_uid,
          email: dbUser.email,
          name: dbUser.name,
          role: dbUser.role,
          avatarUrl: dbUser.avatar_url,
          preferences: dbUser.preferences
        } : null
      };
    }
    
    return {
      success: false,
      error: 'Authentication failed'
    };
    
  } catch (error) {
    console.error('Login error:', error);
    
    if (error.name === 'NotAuthorizedException') {
      return {
        success: false,
        error: 'Invalid email or password'
      };
    }
    
    return {
      success: false,
      error: 'Login failed'
    };
  }
}

// Get user profile
async function getUserProfile(cognitoUid) {
  try {
    const dbUser = await getUserFromDatabase(cognitoUid);
    
    if (!dbUser) {
      return {
        success: false,
        error: 'User not found'
      };
    }
    
    return {
      success: true,
      user: {
        id: dbUser.id,
        cognitoUid: dbUser.cognito_uid,
        email: dbUser.email,
        name: dbUser.name,
        role: dbUser.role,
        avatarUrl: dbUser.avatar_url,
        preferences: dbUser.preferences,
        createdAt: dbUser.created_at,
        updatedAt: dbUser.updated_at
      }
    };
    
  } catch (error) {
    console.error('Get profile error:', error);
    return {
      success: false,
      error: 'Failed to get user profile'
    };
  }
}

// Update user profile
async function updateUserProfile(cognitoUid, updates) {
  try {
    const updateFields = [];
    const parameters = [{ name: 'cognitoUid', value: { stringValue: cognitoUid } }];
    
    if (updates.name) {
      updateFields.push('name = :name');
      parameters.push({ name: 'name', value: { stringValue: updates.name } });
    }
    
    if (updates.phone) {
      updateFields.push('phone = :phone');
      parameters.push({ name: 'phone', value: { stringValue: updates.phone } });
    }
    
    if (updates.avatarUrl) {
      updateFields.push('avatar_url = :avatarUrl');
      parameters.push({ name: 'avatarUrl', value: { stringValue: updates.avatarUrl } });
    }
    
    if (updates.preferences) {
      updateFields.push('preferences = :preferences');
      parameters.push({ name: 'preferences', value: { stringValue: JSON.stringify(updates.preferences) } });
    }
    
    if (updateFields.length === 0) {
      return {
        success: false,
        error: 'No fields to update'
      };
    }
    
    const sql = `
      UPDATE users 
      SET ${updateFields.join(', ')}, updated_at = NOW()
      WHERE cognito_uid = :cognitoUid
      RETURNING id, cognito_uid, email, name, phone, role, avatar_url, preferences, updated_at
    `;
    
    const result = await executeQuery(sql, parameters);
    
    if (result.records.length === 0) {
      return {
        success: false,
        error: 'User not found'
      };
    }
    
    const user = result.records[0];
    return {
      success: true,
      user: {
        id: user.id,
        cognitoUid: user.cognito_uid,
        email: user.email,
        name: user.name,
        phone: user.phone,
        role: user.role,
        avatarUrl: user.avatar_url,
        preferences: user.preferences,
        updatedAt: user.updated_at
      }
    };
    
  } catch (error) {
    console.error('Update profile error:', error);
    return {
      success: false,
      error: 'Failed to update user profile'
    };
  }
}

// Verify JWT token
async function verifyToken(token) {
  try {
    const decodedToken = jwt.decode(token);
    
    if (!decodedToken || !decodedToken.sub) {
      return {
        success: false,
        error: 'Invalid token'
      };
    }
    
    // Get user from database
    const dbUser = await getUserFromDatabase(decodedToken.sub);
    
    if (!dbUser) {
      return {
        success: false,
        error: 'User not found'
      };
    }
    
    return {
      success: true,
      user: {
        id: dbUser.id,
        cognitoUid: dbUser.cognito_uid,
        email: dbUser.email,
        name: dbUser.name,
        role: dbUser.role
      }
    };
    
  } catch (error) {
    console.error('Token verification error:', error);
    return {
      success: false,
      error: 'Token verification failed'
    };
  }
}

module.exports = {
  registerUser,
  loginUser,
  getUserProfile,
  updateUserProfile,
  verifyToken
};