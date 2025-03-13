# Architecture Overview

## Overview

Boostify Music is an AI-powered music education platform that provides personalized learning experiences for musicians through intelligent technologies and interactive analysis tools. The platform integrates various AI services to generate content, analyze music, and create personalized learning paths for users.

The application follows a modern web architecture with a clear separation between frontend and backend components. It uses React with TypeScript for the frontend and Node.js for the backend, with Firebase providing authentication, real-time database, and storage capabilities.

## System Architecture

The application follows a client-server architecture with the following key components:

### Frontend

- **Technology**: React with TypeScript
- **Build Tool**: Vite
- **Styling**: Tailwind CSS with Shadcn/UI components
- **State Management**: React Query for server state, React Context for local state
- **Routing**: Wouter (lightweight alternative to React Router)

### Backend

- **Technology**: Node.js with Express
- **API Style**: RESTful API
- **Runtime**: ESM modules
- **Database**: Dual database approach
  - Firebase Firestore for real-time data and user-generated content
  - PostgreSQL with Drizzle ORM for structured data and analytics

### Authentication

- **Provider**: Firebase Authentication
- **Strategy**: Email/password and social login providers

### Storage

- **Provider**: Firebase Storage
- **Content Types**: Audio files, videos, images

## Key Components

### 1. Frontend Components

#### User Interface
- Shadcn/UI components (based on Radix UI primitives)
- Tailwind CSS for styling
- Custom components for music-specific interfaces

#### Page Structure
- Dashboard for artists with analytics and tools
- AI agent interfaces for different creative tasks
- Course and learning content views
- Profile management

#### State Management
- React Query for server data fetching and caching
- Context API for global state

### 2. Backend Services

#### API Server
- Express server handling HTTP requests
- RESTful API endpoints for different features
- WebSocket support for real-time features

#### Authentication Service
- Firebase Authentication integration
- Session management
- User role and permission handling

#### Database Services
- Firebase Firestore for document-based data
- PostgreSQL with Drizzle ORM for relational data

### 3. AI Integration

The application integrates several AI services:

- **OpenRouter/OpenAI**: For AI agents and content generation
- **ElevenLabs**: For text-to-speech and voice synthesis
- **Flux**: For image generation via PiAPI
- **Apify**: For web scraping and data collection

### 4. Payment Processing

- **Stripe**: For subscription management and payment processing
- Custom webhook handling for payment events

## Data Flow

### Authentication Flow

1. User signs in through Firebase Authentication
2. Frontend receives authentication token
3. Token is used for subsequent API requests
4. Backend validates token for protected routes

### Content Generation Flow

1. User requests content generation (music, video, marketing plan)
2. Frontend sends request to backend with parameters
3. Backend calls appropriate AI service (OpenRouter/OpenAI, ElevenLabs, etc.)
4. Generated content is stored in Firebase Storage/Firestore
5. Frontend displays the generated content to the user

### Payment Flow

1. User selects subscription or purchase
2. Frontend creates checkout session via Stripe API
3. User completes payment on Stripe-hosted page
4. Stripe webhook notifies backend of successful payment
5. Backend updates user permissions and subscription status

## External Dependencies

### AI Services
- OpenRouter API / OpenAI API: Text generation and AI agents
- ElevenLabs API: Voice synthesis and audio generation
- Flux via PiAPI: Image generation
- Apify: Web scraping and data collection

### Authentication & Database
- Firebase: Authentication, Firestore database, and Storage
- PostgreSQL: Relational database for structured data

### Payment Processing
- Stripe: Payment processing and subscription management

### Deployment & Hosting
- Environment setup for Replit deployment
- Configuration for cloud deployment via Cloud Run

## Deployment Strategy

The repository contains several build and deployment scripts that handle different aspects of the deployment process:

### Development Environment
- Concurrent running of client (Vite) and server (Node.js)
- Hot reloading for both frontend and backend
- Environment variable management through `.env` files

### Production Build Process
- Custom build scripts to handle path alias resolution
- Optimization for production deployment
- Static asset management

### Path Alias Resolution
A key challenge addressed in the codebase is the handling of path aliases (`@/` imports) between development and production environments. Several strategies are implemented:

1. Symbolic links in `node_modules` to provide alias resolution
2. Custom Vite configuration for production builds
3. Script-based transformation of imports for production

### Deployment Targets
- The repository is configured to deploy to Replit's Cloud Run service
- Scripts are provided for local production testing

## Architectural Decisions

### 1. Dual Database Approach

**Problem**: Different types of data have different requirements for access patterns, querying, and real-time updates.

**Solution**: Use Firebase Firestore for real-time, document-based data, and PostgreSQL for structured, relational data.

**Rationale**: This provides the best of both worlds - real-time updates for user-facing features and robust querying for analytics and reporting.

### 2. Decoupled AI Services

**Problem**: Different AI tasks require different specialized services.

**Solution**: Integrate multiple AI providers rather than relying on a single solution.

**Rationale**: This allows choosing the best service for each specific AI capability (text generation, image creation, voice synthesis, etc.) and provides redundancy if one service has issues.

### 3. Path Alias Management

**Problem**: Import paths with aliases (`@/components/...`) work differently between development and production builds.

**Solution**: Multiple strategies including symlinks, custom Vite configuration, and import transformation.

**Rationale**: Ensures consistent behavior across environments while maintaining clean import paths in the codebase.

### 4. Tailwind with Shadcn/UI Components

**Problem**: Building a consistent UI with custom styling is time-consuming.

**Solution**: Use Tailwind CSS with Shadcn/UI component library.

**Rationale**: Provides high customization flexibility with utility classes while using accessible, pre-built components that follow best practices.