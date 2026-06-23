# Google Calendar Booking Application

A modern, full-featured booking application that integrates with Google Calendar, enabling users to create and manage bookings seamlessly with their Google Calendar availability.

## Table of Contents

- [Overview](#overview)
- [Tech Stack](#tech-stack)
- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Environment Setup](#environment-setup)
- [Getting Started](#getting-started)
- [Available Scripts](#available-scripts)
- [Project Structure](#project-structure)
- [Key Features](#key-features)
- [Testing](#testing)
- [Building for Production](#building-for-production)
- [Troubleshooting](#troubleshooting)
- [Contributing](#contributing)

## Overview

The Google Calendar Booking Application is a web-based platform that allows users to:

- Authenticate via Google OAuth and Auth0
- View available time slots based on their Google Calendar
- Create and manage bookings
- View their booking history
- Manage calendar access permissions

This application is built with Next.js 16 and provides a responsive, user-friendly interface with real-time state management powered by Redux Toolkit.

## Tech Stack

### Core Framework
- **Next.js 16.2.9** - React framework with App Router
- **React 19.2.4** - UI library
- **TypeScript 5** - Type safety and better DX

### State Management & API
- **Redux Toolkit 2.12.0** - State management
- **React Redux 9.3.0** - React bindings for Redux

### Styling
- **Tailwind CSS 4** - Utility-first CSS framework

### Testing & Quality
- **Jest 29.7.0** - Unit testing framework
- **React Testing Library 16.3.1** - Component testing utilities
- **ESLint 9** - Code linting and formatting
- **TypeScript** - Static type checking

### Authentication
- **Google OAuth 2.0** - Sign-in and calendar access
- **Auth0** - Additional authentication provider

## Prerequisites

Ensure you have the following installed:

- **Node.js**: 24.x or higher
- **npm**: 11.x or higher
- **Git**: For version control
- **Google Cloud Project** with OAuth 2.0 credentials configured
- **Auth0 Account** (optional, for alternative authentication)

## Installation

### 1. Clone the Repository

```bash
git clone <repository-url>
cd google-calendar-app
```

### 2. Install Dependencies

```bash
npm install
```

Or with alternative package managers:

```bash
yarn install
# or
pnpm install
# or
bun install
```

## Environment Setup

Create a `.env.local` file in the project root and add the following variables:

```env
# Google OAuth Configuration
NEXT_PUBLIC_GOOGLE_CLIENT_ID=<your-google-client-id>

# API Configuration
NEXT_PUBLIC_API_URL=http://localhost:3001

# Auth0 Configuration (if using Auth0)
NEXT_PUBLIC_AUTH0_DOMAIN=<your-auth0-domain>
NEXT_PUBLIC_AUTH0_CLIENT_ID=<your-auth0-client-id>
NEXT_PUBLIC_AUTH0_SECRET=<your-auth0-secret>
```

### Obtaining Google OAuth Credentials

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create a new project or select an existing one
3. Enable the Google Calendar API
4. Create OAuth 2.0 credentials (Web Application)
5. Add authorized redirect URIs (e.g., `http://localhost:3000`)
6. Copy the Client ID to `.env.local`

## Getting Started

### Development Server

Start the development server with live reload:

```bash
npm run dev
```

The application will be available at [http://localhost:3000](http://localhost:3000)

### With Debugging

For debugging with Node inspector:

```bash
npm run start:dev
```

## Available Scripts

### Development & Running

| Script | Description |
|--------|-------------|
| `npm run dev` | Start development server with hot reload |
| `npm run start:dev` | Start dev server with Node debugger enabled |
| `npm start` | Run production server (requires build first) |
| `npm run build` | Build optimized production bundle |

### Testing

| Script | Description |
|--------|-------------|
| `npm test` | Run all tests once |
| `npm run test:watch` | Run tests in watch mode |
| `npm run test:coverage` | Run tests with coverage report |

### Code Quality

| Script | Description |
|--------|-------------|
| `npm run lint` | Lint codebase and report issues |

## Project Structure

```
google-calendar-app/
├── app/
│   ├── _components/           # Reusable UI components
│   │   ├── AvailableSlotsCard.tsx
│   │   ├── BookingAppView.tsx
│   │   ├── CreateBookingCard.tsx
│   │   └── YourBookingsCard.tsx
│   ├── _hooks/                # Custom React hooks
│   │   └── useBookingApp.ts    # Main booking logic hook
│   ├── _lib/                  # Utility functions and types
│   │   ├── api.ts             # API client configuration
│   │   ├── types.ts           # TypeScript type definitions
│   │   ├── utils.ts           # Helper functions
│   │   └── validation.ts      # Form validation logic
│   ├── _store/                # Redux state management
│   │   ├── authSlice.ts       # Authentication state
│   │   ├── bookingSlice.ts    # Booking state
│   │   ├── hooks.ts           # Redux hooks
│   │   ├── providers.tsx      # Redux provider setup
│   │   ├── store.ts           # Store configuration
│   │   └── thunks.ts          # Async Redux actions
│   ├── layout.tsx             # Root layout component
│   └── page.tsx               # Home page
├── public/                    # Static assets
├── .env.local                 # Environment variables (not in git)
├── jest.config.ts             # Jest testing configuration
├── jest.setup.ts              # Jest setup file
├── next.config.ts             # Next.js configuration
├── tsconfig.json              # TypeScript configuration
├── eslint.config.mjs          # ESLint configuration
├── tailwind.config.js         # Tailwind CSS configuration
├── postcss.config.mjs         # PostCSS configuration
├── package.json               # Project dependencies
└── README.md                  # This file
```

## Key Features

### 🔐 Authentication
- Google OAuth 2.0 integration for seamless sign-in
- Auth0 support for additional authentication options
- Secure token management

### 📅 Calendar Integration
- Real-time synchronization with Google Calendar
- Display available time slots based on calendar availability
- Automatic conflict detection

### 📝 Booking Management
- Create new bookings with selected time slots
- View complete booking history
- Manage and update existing bookings

### 🎨 User Interface
- Modern, responsive design with Tailwind CSS
- Interactive components with smooth animations
- Real-time feedback with toast notifications

### 🧪 Testing & Quality
- Comprehensive unit tests for components and hooks
- Test coverage reporting
- ESLint for code consistency

## Testing

### Run Tests

Execute the test suite:

```bash
npm test
```

### Watch Mode

Run tests in watch mode during development:

```bash
npm run test:watch
```

### Coverage Report

Generate a coverage report:

```bash
npm run test:coverage
```

Coverage reports are available in the `coverage/` directory.

### Test Files

Test files are co-located with source files and follow the naming convention:
- `*.test.tsx` - Component tests
- `*.test.ts` - Hook and utility tests
- `*.spec.tsx` - Spec-style tests

## Building for Production

### Build the Application

```bash
npm run build
```

This creates an optimized production bundle in the `.next/` directory.

### Run Production Server

```bash
npm start
```

The application will run on [http://localhost:3000](http://localhost:3000)

## Troubleshooting

### Google OAuth Issues

#### Problem: "Token client not initialized" error on first login

**Cause**: Race condition where token request occurs before Google Client Library initialization.

**Solution**: The token client is now lazily initialized within the request path. Ensure the Google Script loads before interacting with the booking app.

#### Problem: UI hangs after token request

**Cause**: Dangling or overwritten Promise resolvers from previous token requests.

**Solution**: Previous token resolvers are now properly cleared before assigning new ones, and cleanup occurs on component unmount.

### API Connection Issues

- Verify `NEXT_PUBLIC_API_URL` is correctly configured
- Ensure the backend API server is running on the configured port
- Check CORS settings on the backend

### Google Calendar Sync Issues

- Verify Google OAuth credentials are correct
- Ensure calendar permissions are granted in the booking app
- Check that the Google Calendar API is enabled in Google Cloud Console

### Build Issues

```bash
# Clear Next.js cache
rm -rf .next

# Reinstall dependencies
rm -rf node_modules package-lock.json
npm install

# Rebuild
npm run build
```

## Contributing

### Code Style

- Follow ESLint rules enforced by the project
- Use TypeScript for all new files
- Write tests for new features and fixes

### Running Linter

```bash
npm run lint
```

### Before Submitting a PR

1. Ensure all tests pass: `npm test`
2. Ensure linting passes: `npm run lint`
3. Build successfully: `npm run build`
4. Update documentation if needed

## Environment Variables Reference

| Variable | Required | Description |
|----------|----------|-------------|
| `NEXT_PUBLIC_GOOGLE_CLIENT_ID` | Yes | Google OAuth 2.0 Client ID |
| `NEXT_PUBLIC_API_URL` | Yes | Backend API base URL |
| `NEXT_PUBLIC_AUTH0_DOMAIN` | No | Auth0 tenant domain |
| `NEXT_PUBLIC_AUTH0_CLIENT_ID` | No | Auth0 application client ID |
| `NEXT_PUBLIC_AUTH0_SECRET` | No | Auth0 application secret |

## License

This project is part of the Works repository. See the main repository for license information.

