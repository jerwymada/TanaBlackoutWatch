# Délestage Tana - Power Outage Tracking Application

## Overview

Délestage Tana is a web application designed to track scheduled power outages (délestages) in Antananarivo, Madagascar. The application provides residents with an interactive timeline view of power outages by neighborhood, allowing them to see when their area will experience power cuts. Users can search for specific neighborhoods, filter by time, and save favorite locations for quick access.

The application is built as a full-stack TypeScript solution with a React frontend and Express backend, featuring a mobile-first responsive design inspired by status page interfaces like StatusPage.io and GitHub Status.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture

**Framework & Build System**
- React 18+ with TypeScript for type-safe component development
- Vite as the build tool and development server, providing fast HMR (Hot Module Replacement)
- Wouter for lightweight client-side routing
- Mobile-first responsive design approach

**UI Component System**
- shadcn/ui component library (New York style variant) built on Radix UI primitives
- Tailwind CSS for utility-first styling with custom design tokens
- Custom color system for outage status visualization:
  - Outage (red): `#E74C3C` for power outages
  - Active (green): `#27AE60` for active power
  - Attention (orange): `#F39C12` for warnings
  - Favorite (gold): `#FFD700` for favorited neighborhoods

**State Management**
- TanStack Query (React Query) for server state management and data fetching
- Local React state for UI interactions and filters
- LocalStorage for persistent favorites using custom `useFavorites` hook

**Key Features**
- Interactive 24-hour timeline visualization showing outage periods
- Real-time filtering by neighborhood name and time
- Favorites system for quick access to specific neighborhoods
- Status summary dashboard showing active vs. outage counts
- Theme toggle supporting light/dark modes

### Backend Architecture

**Server Framework**
- Express.js for HTTP server and REST API endpoints
- TypeScript for type safety across the entire backend
- Custom middleware for request logging and JSON body parsing

**API Design**
- RESTful endpoints for neighborhoods and outages:
  - `GET /api/neighborhoods` - List all neighborhoods
  - `GET /api/neighborhoods/:id` - Get specific neighborhood
  - `GET /api/outages` - Get all outages (with optional date filter)
  - `GET /api/outages/neighborhood/:neighborhoodId` - Get outages for specific neighborhood
  - `GET /api/schedules` - Get combined neighborhood and outage data

**Data Layer**
- In-memory storage implementation (IStorage interface)
- Pre-populated with 18 Antananarivo neighborhoods across 6 districts
- Generated outage schedules with varied patterns
- Interface-based design allows for future database integration

**Deployment & Build**
- Production build uses esbuild for server bundling
- Selective dependency bundling to optimize cold start times
- Static file serving for compiled frontend assets
- Development mode with Vite integration for HMR

### Data Models

**Core Entities**
- `Neighborhood`: Represents a geographic area with name and district
- `Outage`: Defines power outage periods with start/end hours and date
- `OutageSchedule`: Combines neighborhood with its associated outages

**Schema Validation**
- Zod schemas for runtime type validation
- Shared types between frontend and backend via `@shared/schema`
- Type-safe API contracts

### Design System

**Typography**
- Google Fonts integration (DM Sans, Geist Mono, Fira Code, Architects Daughter)
- Hierarchical sizing: H1 (24-32px), H2 (18px), Body (14px), Labels (12px)

**Layout Patterns**
- Mobile-first breakpoints with Tailwind's responsive utilities
- Grid-based neighborhood cards: 1 column (mobile), 2 columns (tablet), 3 columns (desktop)
- Horizontal scrollable timeline with smooth scrolling and snap points
- Touch-friendly 44px minimum touch targets

**Interactive Components**
- Timeline slots with tooltip information on hover
- Favorite star toggle buttons
- Filter controls with search, hour selection, and favorites-only mode
- Empty states for no results, no favorites, and error conditions

## External Dependencies

### Core Framework Dependencies
- **React & DOM**: `react`, `react-dom` - UI framework
- **Vite**: Build tool and development server
- **Express**: Backend HTTP server framework
- **TypeScript**: Type system for JavaScript

### UI Component Libraries
- **Radix UI**: Unstyled accessible component primitives (@radix-ui/react-*)
- **shadcn/ui**: Pre-built component patterns based on Radix
- **Lucide React**: Icon library for UI elements
- **Tailwind CSS**: Utility-first CSS framework
- **class-variance-authority**: Component variant management
- **cmdk**: Command palette component

### State & Data Management
- **TanStack Query**: Server state management and caching
- **Wouter**: Lightweight routing library
- **date-fns**: Date manipulation and formatting

### Styling & Theming
- **PostCSS & Autoprefixer**: CSS processing
- **tailwind-merge**: Utility for merging Tailwind classes
- **clsx**: Conditional className composition

### Build & Development Tools
- **tsx**: TypeScript execution for development
- **esbuild**: Fast JavaScript bundler for production
- **@replit/vite-plugin-runtime-error-modal**: Development error overlay
- **@replit/vite-plugin-cartographer**: Replit-specific tooling
- **@replit/vite-plugin-dev-banner**: Development environment indicator

### Database & ORM (Configured but not actively used)
- **Drizzle ORM**: Type-safe database toolkit
- **@neondatabase/serverless**: PostgreSQL driver for serverless environments
- **drizzle-zod**: Integration between Drizzle and Zod schemas
- Note: Database configuration exists but application currently uses in-memory storage

### Form & Validation
- **Zod**: Schema validation library
- **@hookform/resolvers**: Form validation resolvers
- **drizzle-zod**: Schema generation from database models

### UI Enhancement Libraries
- **embla-carousel-react**: Carousel component functionality
- **vaul**: Drawer/sheet component primitives
- **react-day-picker**: Date picker component