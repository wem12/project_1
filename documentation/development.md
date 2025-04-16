# SportsVest Development Guidelines

## Code Structure

### Frontend

- **pages/**: Next.js pages
- **components/**: React components
  - **common/**: Reusable UI components
  - **layouts/**: Page layouts
  - **[feature]/**: Feature-specific components
- **contexts/**: React contexts for state management
- **hooks/**: Custom React hooks
- **lib/**: Utility functions and API client
- **styles/**: Global styles and theme configuration
- **public/**: Static assets

### Backend

- **api-gateway/**: API Gateway service
  - **middleware/**: Express middleware
  - **routes/**: Route definitions
- **services/**: Microservices
  - **[service-name]/**: Individual service
    - **controllers/**: Request handlers
    - **models/**: Data models
    - **routes/**: Route definitions
- **database/**: Database schema and migrations

## Coding Standards

### General

- Use ESLint and Prettier for code formatting
- Write meaningful commit messages
- Create feature branches for new features
- Submit pull requests for code review

### Frontend

- Use functional components with hooks
- Follow the Next.js file-based routing conventions
- Use Tailwind CSS for styling
- Import paths should use the `@/` alias
- Use TypeScript for type safety

### Backend

- Follow RESTful API design principles
- Use async/await for asynchronous operations
- Implement proper error handling
- Use environment variables for configuration
- Write unit tests for critical functionality

## API Design

- Use consistent URL patterns
- Return appropriate HTTP status codes
- Format error responses consistently
- Version the API (v1, v2, etc.)
- Document all endpoints

## Authentication

- Use JWT for authentication
- Implement token refresh mechanism
- Secure sensitive routes with middleware
- Store tokens securely on the client side

## Testing

- Write unit tests for critical functionality
- Use Jest for testing
- Implement integration tests for API endpoints
- Test authentication flows thoroughly

## Deployment

- Use Docker for containerization
- Implement CI/CD pipeline
- Use environment-specific configuration
- Monitor application performance and errors 