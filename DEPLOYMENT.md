# Boostify Music - Production Deployment Guide

This guide provides instructions for deploying the Boostify Music application to a production environment.

## Prerequisites

- Node.js 18.x or later
- npm 9.x or later
- Access to a server or hosting platform (e.g., Replit, AWS, Heroku, etc.)

## Production Build Options

We provide two different build options, depending on your requirements:

### 1. Minimal Build (Recommended for quick deployment)

The minimal build creates a lightweight version of the application with only essential server components and a static HTML page. This is ideal for quick deployments where the full application functionality is not required.

```bash
node minimal-build.js
```

### 2. Secure Production Build (Recommended for full production)

The secure production build creates a more robust version with additional security features, error handling, and optimized assets. This is recommended for actual production deployments.

```bash
node secure-production-build.js
```

## Deployment Steps

1. **Generate the production build**:
   ```bash
   # For minimal build
   node minimal-build.js
   
   # OR for secure build
   node secure-production-build.js
   ```

2. **Verify the build**:
   ```bash
   node verify-production-build.js
   ```

3. **Deploy the build**:
   - Copy the entire `dist` directory to your production server
   - Navigate to the directory on your server
   - Install dependencies:
     ```bash
     npm install
     ```
   - Update the `.env.production` file with your actual API keys and environment variables
   - Start the server:
     ```bash
     ./start.sh
     # OR
     npm start
     ```

## Environment Variables

The following environment variables should be set in the `.env.production` file:

```
NODE_ENV=production
PORT=5000
API_KEY=your_actual_api_key
API_URL=your_actual_api_url
```

Additional environment variables for specific services:
- `OPENAI_API_KEY`: For OpenAI API services
- `FIREBASE_API_KEY`: For Firebase integration
- `FAL_API_KEY`: For fal.ai services
- `ELEVENLABS_API_KEY`: For voice services

## Security Considerations

- All API keys should be kept secure and never committed to version control
- The production server has rate limiting enabled to prevent abuse
- Security headers are set to help prevent common web vulnerabilities
- Content Security Policy is configured to mitigate XSS attacks

## Common Issues and Troubleshooting

### Server won't start
- Check that the PORT is not already in use
- Verify all required environment variables are set
- Ensure Node.js version is compatible (v18+)

### Missing dependencies
- Run `npm install` in the dist directory

### API calls failing
- Verify that all API keys are correctly set in `.env.production`
- Check network connectivity to API endpoints
- Verify server can reach external services

## Custom Routes and Features

The production server includes:

- Static file serving from the `/public` directory
- API proxy for secure third-party API calls
- Health check endpoint at `/api/health`
- Error handling middleware for improved error messages
- Client-side routing via single-page application pattern

## License and Legal

Copyright © 2025 Boostify Music. All rights reserved.