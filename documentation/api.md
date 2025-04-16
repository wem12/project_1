# SportsVest API Documentation

## Authentication

### Register User
- **URL**: `/api/v1/auth/register`
- **Method**: `POST`
- **Request Body**:
  ```json
  {
    "email": "user@example.com",
    "password": "securePassword123",
    "firstName": "John",
    "lastName": "Doe",
    "phone": "+1234567890"
  }
  ```
- **Response**: 
  ```json
  {
    "userId": "uuid",
    "email": "user@example.com",
    "requiresVerification": true
  }
  ```

### Login
- **URL**: `/api/v1/auth/login`
- **Method**: `POST`
- **Request Body**:
  ```json
  {
    "email": "user@example.com",
    "password": "securePassword123"
  }
  ```
- **Response**: 
  ```json
  {
    "token": "jwt-token",
    "refreshToken": "refresh-token",
    "expiresIn": 86400,
    "user": {
      "userId": "uuid",
      "email": "user@example.com",
      "firstName": "John",
      "lastName": "Doe",
      "isVerified": true
    }
  }
  ```

## Teams

### Get All Teams
- **URL**: `/api/v1/teams`
- **Method**: `GET`
- **Query Parameters**:
  - `league`: Filter by league ID
  - `status`: Filter by status (active, inactive, all)
  - `page`: Page number for pagination
  - `limit`: Items per page
  - `sortBy`: Field to sort by (name, price, marketCap)
  - `sortDirection`: Sort direction (asc, desc)
- **Response**: 
  ```json
  {
    "teams": [
      {
        "teamId": "uuid",
        "name": "Team Name",
        "city": "City",
        "abbreviation": "TN",
        "logoUrl": "https://example.com/logo.png",
        "league": {
          "leagueId": "uuid",
          "name": "League Name",
          "abbreviation": "LN"
        },
        "currentSharePrice": 25.50,
        "marketCap": 1000000000,
        "dividendYield": 2.5,
        "tradingStatus": "active"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "totalItems": 100,
      "totalPages": 5
    }
  }
  ```

### Get Team Details
- **URL**: `/api/v1/teams/:teamId`
- **Method**: `GET`
- **Response**: 
  ```json
  {
    "teamId": "uuid",
    "name": "Team Name",
    "city": "City",
    "abbreviation": "TN",
    "description": "Team description...",
    "logoUrl": "https://example.com/logo.png",
    "foundingYear": 1990,
    "league": {
      "leagueId": "uuid",
      "name": "League Name",
      "abbreviation": "LN"
    },
    "currentSharePrice": 25.50,
    "priceChange24h": 1.2,
    "marketCap": 1000000000,
    "dividendYield": 2.5,
    "tradingStatus": "active",
    "stats": {
      "winRate": 0.65,
      "performance": 0.72,
      "shareholderCount": 15000
    }
  }
  ```

## Orders

### Place Order
- **URL**: `/api/v1/orders`
- **Method**: `POST`
- **Authentication**: Required
- **Request Body**:
  ```json
  {
    "teamId": "uuid",
    "action": "buy",
    "orderType": "market",
    "shares": 10,
    "limitPrice": null
  }
  ```
- **Response**: 
  ```json
  {
    "orderId": "uuid",
    "status": "completed",
    "estimatedTotal": 255.00,
    "message": "Market order executed successfully"
  }
  ```

### Get Order Details
- **URL**: `/api/v1/orders/:orderId`
- **Method**: `GET`
- **Authentication**: Required
- **Response**: 
  ```json
  {
    "orderId": "uuid",
    "team": {
      "id": "uuid",
      "name": "Team Name",
      "logoUrl": "https://example.com/logo.png"
    },
    "type": "buy",
    "orderType": "market",
    "shares": 10,
    "pricePerShare": 25.50,
    "totalAmount": 255.00,
    "status": "completed",
    "createdAt": "2023-06-15T14:30:00Z"
  }
  ```

## Portfolio

### Get Portfolio
- **URL**: `/api/v1/portfolio`
- **Method**: `GET`
- **Authentication**: Required
- **Response**: 
  ```json
  {
    "portfolioId": "uuid",
    "cashBalance": 5000.00,
    "totalValue": 15000.00,
    "totalInvested": 10000.00,
    "totalReturn": 5000.00,
    "returnPercentage": 50.00,
    "holdings": [
      {
        "holdingId": "uuid",
        "team": {
          "teamId": "uuid",
          "name": "Team Name",
          "logoUrl": "https://example.com/logo.png"
        },
        "shares": 10,
        "averagePurchasePrice": 20.00,
        "currentPrice": 25.50,
        "currentValue": 255.00,
        "return": 55.00,
        "returnPercentage": 27.50
      }
    ],
    "chartData": [
      {
        "date": "2023-06-01",
        "value": 14500.00
      },
      {
        "date": "2023-06-02",
        "value": 14800.00
      }
    ]
  }
  ```

## Rewards

### Get Available Rewards
- **URL**: `/api/v1/rewards`
- **Method**: `GET`
- **Authentication**: Required
- **Query Parameters**:
  - `teamId`: Filter by team ID
  - `type`: Filter by reward type
  - `status`: Filter by status
  - `page`: Page number for pagination
  - `limit`: Items per page
- **Response**: 
  ```json
  {
    "rewards": [
      {
        "rewardId": "uuid",
        "team": {
          "teamId": "uuid",
          "name": "Team Name",
          "logoUrl": "https://example.com/logo.png"
        },
        "name": "Reward Name",
        "description": "Reward description...",
        "rewardType": "ticket",
        "requirements": {
          "shares": 5,
          "holdDays": 30
        },
        "remaining": 50,
        "startDate": "2023-06-01T00:00:00Z",
        "endDate": "2023-07-01T00:00:00Z",
        "isEligible": true,
        "alreadyRedeemed": false
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "totalItems": 100,
      "totalPages": 5
    }
  }
  ```

### Redeem Reward
- **URL**: `/api/v1/rewards/:rewardId/redeem`
- **Method**: `POST`
- **Authentication**: Required
- **Response**: 
  ```json
  {
    "userRewardId": "uuid",
    "redemptionCode": "TEAM-ABC123",
    "redeemInstructions": "Instructions for redeeming...",
    "expiresAt": "2023-07-15T00:00:00Z",
    "message": "You have successfully redeemed: Reward Name"
  }
  ``` 