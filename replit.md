# Pet Family Management Application

## Overview

Pet-Family is a comprehensive web application for managing pet information and family collaboration around pet care. The system allows multiple family members to track pet health records, veterinary notes, vaccinations, and share files related to their pets. Built with a modern full-stack architecture using React frontend, Express backend, and PostgreSQL database with Drizzle ORM.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React with TypeScript using Vite as the build tool
- **UI Components**: Radix UI primitives with shadcn/ui components for consistent design
- **Styling**: Tailwind CSS with custom design tokens and CSS variables
- **State Management**: TanStack Query (React Query) for server state management
- **Routing**: Wouter for lightweight client-side routing
- **Form Handling**: React Hook Form with Zod validation
- **File Uploads**: Uppy library with dashboard modal interface

### Backend Architecture
- **Framework**: Express.js with TypeScript running on Node.js
- **API Design**: RESTful API with JSON responses
- **Error Handling**: Centralized error middleware with proper HTTP status codes
- **Session Management**: Express sessions with PostgreSQL session storage
- **Request Logging**: Custom middleware for API request/response logging
- **Development**: Hot reloading with tsx for development server

### Database Design
- **Database**: PostgreSQL with connection pooling via Neon serverless
- **ORM**: Drizzle ORM with TypeScript schema definitions
- **Schema Structure**:
  - Users table for authentication and profile data
  - Families table for grouping users and pets
  - Family members junction table with role-based permissions
  - Pets table with comprehensive health and identification data
  - Notes table for daily logs and veterinary records
  - Vaccinations table for immunization tracking
  - Pet files table for document and image storage
  - Sessions table for authentication state

### Authentication System
- **Provider**: Replit Auth integration with OpenID Connect
- **Session Storage**: PostgreSQL-backed sessions with connect-pg-simple
- **Security**: HTTP-only cookies with secure flags and CSRF protection
- **User Management**: Automatic user creation/updates on authentication

### File Storage System
- **Storage**: Google Cloud Storage with object ACL policies
- **Access Control**: Custom ACL system with permission-based access
- **Upload Process**: Direct-to-storage uploads with presigned URLs
- **File Types**: Support for images, documents, and veterinary records

### State Management Pattern
- **Server State**: TanStack Query with automatic caching and invalidation
- **Client State**: React hooks and component state for UI interactions
- **Form State**: React Hook Form with Zod schema validation
- **Authentication State**: Custom useAuth hook with query-based user detection

### Component Architecture
- **Design System**: Consistent component library with variant-based styling
- **Reusable Components**: Modular components for pets, notes, and family management
- **Modal System**: Dialog-based modals for forms and file uploads
- **Layout System**: Responsive design with mobile-first approach

## External Dependencies

### Core Framework Dependencies
- **React Ecosystem**: React 18 with TypeScript, Vite build system
- **UI Library**: Radix UI primitives with shadcn/ui component system
- **Backend Framework**: Express.js with TypeScript compilation via tsx

### Database and ORM
- **Database**: Neon PostgreSQL serverless database
- **ORM**: Drizzle ORM with PostgreSQL dialect and Zod integration
- **Connection**: Neon serverless client with WebSocket support

### Authentication Services
- **Auth Provider**: Replit Auth with OpenID Connect protocol
- **Session Management**: express-session with connect-pg-simple store

### File Storage and Uploads
- **Storage Provider**: Google Cloud Storage
- **Upload Library**: Uppy with dashboard modal and AWS S3-compatible uploads
- **File Processing**: QR code generation for family invitations

### Development and Build Tools
- **Build Tool**: Vite with React plugin and runtime error overlay
- **Development**: Replit-specific plugins for cartographer and error handling
- **Code Quality**: TypeScript strict mode with path aliases

### UI and Styling
- **CSS Framework**: Tailwind CSS with PostCSS processing
- **Icons**: Font Awesome via CDN
- **Fonts**: Google Fonts (Inter, Architects Daughter, DM Sans, Fira Code, Geist Mono)
- **Animations**: Framer Motion via class-variance-authority

### Utilities and Helpers
- **Validation**: Zod schema validation library
- **Date Handling**: date-fns for date formatting and manipulation
- **State Management**: TanStack Query for server state caching
- **Utility Functions**: clsx and tailwind-merge for conditional styling