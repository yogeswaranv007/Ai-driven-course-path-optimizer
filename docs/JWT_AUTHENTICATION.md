# JWT Authentication & Session Management

## Overview

This application implements a comprehensive JWT-based authentication system with proper session management, featuring:

- **Access Tokens** (short-lived, 15 minutes) - For API authentication
- **Refresh Tokens** (long-lived, 30 days) - For session management
- **Token Rotation** - Enhanced security by rotating refresh tokens
- **Multi-Device Sessions** - Track and manage sessions across devices
- **Session Revocation** - Logout from specific devices or all devices

## Architecture

### Token System

```
┌─────────────────┐
│  User Login     │
└────────┬────────┘
         │
         ▼
┌─────────────────────────────────┐
│  Generate Token Pair            │
│  - Access Token (JWT, 15min)    │
│  - Refresh Token (Opaque, 30d)  │
└────────┬────────────────────────┘
         │
         ├──────────────┬──────────────────┐
         ▼              ▼                  ▼
    ┌────────┐    ┌──────────┐    ┌──────────────┐
    │ Cookie │    │ Response │    │   Database   │
    │  (Web) │    │  (JSON)  │    │ (RefreshToken)│
    └────────┘    └──────────┘    └──────────────┘
```

### Session Management Flow

```
1. Login/Register
   ├─> Generate access token (15min expiry)
   ├─> Generate refresh token (30d expiry)
   └─> Store refresh token in DB with device info

2. API Request
   ├─> Extract token from Authorization header or cookie
   ├─> Verify access token
   └─> Attach user to request

3. Access Token Expires
   ├─> Client sends refresh token to /auth/refresh
   ├─> Validate refresh token from DB
   ├─> Generate new token pair
   ├─> Revoke old refresh token (token rotation)
   └─> Store new refresh token in DB

4. Logout
   ├─> Revoke specific refresh token (current session)
   └─> OR revoke all refresh tokens (all devices)
```

## API Endpoints

### Authentication

#### Register User

```http
POST /auth/register
Content-Type: application/json

{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "SecurePassword123!"
}

Response: 201 Created
{
  "user": {
    "_id": "...",
    "name": "John Doe",
    "email": "john@example.com",
    "profile": {...}
  },
  "accessToken": "eyJhbGciOiJIUzI1NiIs...",
  "refreshToken": "a1b2c3d4e5f6..."
}

Cookies Set:
- token (accessToken, httpOnly, 15min)
- refreshToken (refreshToken, httpOnly, 30d, path=/auth/refresh)
```

#### Login

```http
POST /auth/login
Content-Type: application/json

{
  "email": "john@example.com",
  "password": "SecurePassword123!"
}

Response: 200 OK
{
  "user": {...},
  "accessToken": "...",
  "refreshToken": "..."
}
```

#### Refresh Access Token

```http
POST /auth/refresh
Content-Type: application/json

{
  "refreshToken": "a1b2c3d4e5f6..."
}
# OR use cookie (automatic)

Response: 200 OK
{
  "user": {...},
  "accessToken": "...",
  "refreshToken": "..." # New refresh token (rotation)
}
```

#### Logout (Current Session)

```http
POST /auth/logout
Content-Type: application/json

{
  "refreshToken": "a1b2c3d4e5f6..."
}
# OR use cookie (automatic)

Response: 200 OK
{
  "message": "Logged out successfully"
}
```

#### Logout (All Devices)

```http
POST /auth/logout/all
Authorization: Bearer <access-token>

Response: 200 OK
{
  "message": "Logged out from all devices"
}
```

#### Get Current User

```http
GET /auth/me
Authorization: Bearer <access-token>

Response: 200 OK
{
  "user": {
    "_id": "...",
    "name": "John Doe",
    "email": "john@example.com",
    "profile": {...}
  }
}
```

### Session Management

#### Get Active Sessions

```http
GET /auth/sessions
Authorization: Bearer <access-token>

Response: 200 OK
{
  "sessions": [
    {
      "_id": "...",
      "deviceInfo": {
        "device": "Desktop",
        "browser": "Chrome",
        "userAgent": "Mozilla/5.0...",
        "ip": "192.168.1.1"
      },
      "lastUsedAt": "2026-03-10T10:30:00.000Z",
      "createdAt": "2026-03-01T08:00:00.000Z"
    },
    ...
  ]
}
```

#### Revoke Specific Session

```http
DELETE /auth/sessions/:sessionId
Authorization: Bearer <access-token>

Response: 200 OK
{
  "message": "Session revoked successfully"
}
```

## Client Integration

### Web (React/JavaScript)

#### Using Cookies (Recommended for Web)

```javascript
// Login
const login = async (email, password) => {
  const response = await fetch('http://localhost:5000/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
    credentials: 'include', // Important: Include cookies
  });

  const data = await response.json();
  return data.user;
};

// Fetch protected resource
const fetchProtectedData = async () => {
  const response = await fetch('http://localhost:5000/roadmaps', {
    credentials: 'include', // Cookies sent automatically
  });

  // If 401, refresh token and retry
  if (response.status === 401) {
    await refreshAccessToken();
    return fetchProtectedData(); // Retry
  }

  return response.json();
};

// Refresh access token
const refreshAccessToken = async () => {
  const response = await fetch('http://localhost:5000/auth/refresh', {
    method: 'POST',
    credentials: 'include', // Send refresh token cookie
  });

  if (!response.ok) {
    // Refresh token expired, redirect to login
    window.location.href = '/login';
    return;
  }

  return response.json();
};

// Logout
const logout = async () => {
  await fetch('http://localhost:5000/auth/logout', {
    method: 'POST',
    credentials: 'include',
  });

  window.location.href = '/login';
};
```

#### Using Authorization Header (For Mobile/SPA)

```javascript
// Store tokens in memory or secure storage
let accessToken = null;
let refreshToken = null;

const login = async (email, password) => {
  const response = await fetch('http://localhost:5000/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });

  const data = await response.json();
  accessToken = data.accessToken;
  refreshToken = data.refreshToken;

  // Store in secure storage (localStorage, AsyncStorage, etc.)
  localStorage.setItem('refreshToken', refreshToken);

  return data.user;
};

const fetchProtectedData = async () => {
  const response = await fetch('http://localhost:5000/roadmaps', {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (response.status === 401) {
    await refreshAccessToken();
    return fetchProtectedData();
  }

  return response.json();
};

const refreshAccessToken = async () => {
  const storedRefreshToken = localStorage.getItem('refreshToken');

  const response = await fetch('http://localhost:5000/auth/refresh', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refreshToken: storedRefreshToken }),
  });

  if (!response.ok) {
    // Redirect to login
    logout();
    return;
  }

  const data = await response.json();
  accessToken = data.accessToken;
  refreshToken = data.refreshToken;
  localStorage.setItem('refreshToken', refreshToken);
};

const logout = async () => {
  const storedRefreshToken = localStorage.getItem('refreshToken');

  await fetch('http://localhost:5000/auth/logout', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refreshToken: storedRefreshToken }),
  });

  accessToken = null;
  refreshToken = null;
  localStorage.removeItem('refreshToken');
  window.location.href = '/login';
};
```

### Axios Interceptor Example

```javascript
import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:5000',
  withCredentials: true, // Send cookies
});

// Response interceptor for token refresh
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // If 401 and haven't retried yet
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        // Refresh token
        await api.post('/auth/refresh');

        // Retry original request
        return api(originalRequest);
      } catch (refreshError) {
        // Refresh failed, redirect to login
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export default api;
```

## Security Features

### 1. Token Rotation

- Each time a refresh token is used, a new refresh token is issued
- Old refresh token is revoked
- Prevents token reuse attacks

### 2. httpOnly Cookies

- Tokens stored in httpOnly cookies are not accessible via JavaScript
- Protects against XSS attacks

### 3. Short-Lived Access Tokens

- Access tokens expire in 15 minutes
- Limits the window of opportunity for token theft

### 4. Device Tracking

- Each session includes device information
- Users can see and revoke sessions from specific devices

### 5. Automatic Token Cleanup

- Expired tokens are automatically removed from the database
- Runs every hour via background service

### 6. Secure Cookie Configuration

- Production: `secure: true` (HTTPS only), `sameSite: 'none'`
- Development: `secure: false`, `sameSite: 'lax'`

## Database Schema

### RefreshToken Model

```javascript
{
  token: String,              // Unique refresh token
  userId: ObjectId,           // Reference to User
  expiresAt: Date,            // Expiration timestamp
  deviceInfo: {
    userAgent: String,
    ip: String,
    device: String,           // Desktop, Mobile, Tablet
    browser: String,          // Chrome, Firefox, Safari, etc.
  },
  isRevoked: Boolean,         // Revocation status
  revokedAt: Date,            // When revoked
  revokedReason: String,      // logout, logout_all, security, etc.
  lastUsedAt: Date,           // Last time token was used
  replacedBy: ObjectId,       // Reference to replacement token
  createdAt: Date,
  updatedAt: Date,
}
```

## Environment Variables

```bash
# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key
JWT_ACCESS_EXPIRES_IN=15m      # Access token expiry (15 minutes)
JWT_REFRESH_EXPIRES_IN=30d     # Refresh token expiry (30 days)

# Legacy (for backward compatibility)
JWT_EXPIRES_IN=7d
```

## Error Handling

### Common Error Codes

- `NO_TOKEN` - No authentication token provided
- `INVALID_TOKEN` - Token is invalid or expired
- `USER_NOT_FOUND` - User associated with token not found
- `NO_REFRESH_TOKEN` - No refresh token provided for refresh
- `INVALID_REFRESH_TOKEN` - Refresh token is invalid or expired

### Error Response Format

```json
{
  "error": "Unauthorized",
  "message": "Invalid or expired token",
  "code": "INVALID_TOKEN",
  "suggestion": "Please refresh your token or log in again"
}
```

## Best Practices

### For Clients

1. **Always handle 401 responses** - Implement automatic token refresh
2. **Store refresh tokens securely** - Use httpOnly cookies or secure storage
3. **Never store access tokens in localStorage** - Vulnerable to XSS
4. **Implement token refresh before expiry** - Proactively refresh at ~80% lifetime
5. **Handle logout properly** - Clear all tokens and redirect to login

### For Servers

1. **Use HTTPS in production** - Required for secure cookies
2. **Set appropriate token expiry times** - Balance security and UX
3. **Rotate refresh tokens** - Implemented by default
4. **Monitor active sessions** - Detect unusual patterns
5. **Cleanup expired tokens** - Automated via cleanup service

## Migration from Old System

If you're migrating from the old single-token system:

1. **Backward Compatible** - Old code using `generateToken()` still works
2. **Update clients gradually** - Both systems work simultaneously
3. **Update login/register calls** - Start using `accessToken` and `refreshToken`
4. **Implement token refresh** - Add refresh logic to clients
5. **Update middleware** - Already supports both header and cookie auth

## Testing

### Manual Testing with cURL

```bash
# Register
curl -X POST http://localhost:5000/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Test User","email":"test@example.com","password":"Test123!@#"}' \
  -c cookies.txt

# Login
curl -X POST http://localhost:5000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"Test123!@#"}' \
  -c cookies.txt

# Get current user (using cookies)
curl http://localhost:5000/auth/me \
  -b cookies.txt

# Get active sessions
curl http://localhost:5000/auth/sessions \
  -b cookies.txt

# Refresh token
curl -X POST http://localhost:5000/auth/refresh \
  -b cookies.txt \
  -c cookies.txt

# Logout
curl -X POST http://localhost:5000/auth/logout \
  -b cookies.txt

# Logout all
curl -X POST http://localhost:5000/auth/logout/all \
  -b cookies.txt
```

### Testing with Authorization Header

```bash
# Login and capture tokens
TOKEN_RESPONSE=$(curl -s -X POST http://localhost:5000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"Test123!@#"}')

ACCESS_TOKEN=$(echo $TOKEN_RESPONSE | jq -r '.accessToken')
REFRESH_TOKEN=$(echo $TOKEN_RESPONSE | jq -r '.refreshToken')

# Use access token
curl http://localhost:5000/auth/me \
  -H "Authorization: Bearer $ACCESS_TOKEN"

# Refresh
curl -X POST http://localhost:5000/auth/refresh \
  -H "Content-Type: application/json" \
  -d "{\"refreshToken\":\"$REFRESH_TOKEN\"}"
```

## Troubleshooting

### "Invalid or expired token"

- Access token has expired (15min lifetime)
- Call `/auth/refresh` to get a new access token
- If refresh fails, user needs to log in again

### "No refresh token provided"

- Ensure cookies are being sent (`credentials: 'include'`)
- Or include refresh token in request body
- Check cookie path restrictions

### "Session not found"

- Refresh token was revoked (logout, security, etc.)
- User needs to log in again

### CORS Issues

- Ensure `withCredentials: true` in client
- Server must return `Access-Control-Allow-Credentials: true`
- Origin must be explicitly allowed (not `*`)

## Production Checklist

- [ ] Set strong `JWT_SECRET` (32+ random characters)
- [ ] Configure `JWT_ACCESS_EXPIRES_IN` and `JWT_REFRESH_EXPIRES_IN`
- [ ] Enable HTTPS
- [ ] Set `NODE_ENV=production`
- [ ] Configure proper CORS origins
- [ ] Set up monitoring for failed login attempts
- [ ] Enable rate limiting on auth endpoints
- [ ] Set up alerts for unusual session patterns
- [ ] Test token refresh flow end-to-end
- [ ] Verify cookie security settings

## Support

For issues or questions about the authentication system:

1. Check this documentation
2. Review error responses for specific guidance
3. Check server logs for detailed error information
4. Ensure environment variables are properly configured
