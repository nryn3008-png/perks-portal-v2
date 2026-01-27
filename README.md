# Perks Portal

A web application for VC firms and platform teams to help founders in their portfolio discover, browse, and redeem startup perks (e.g., AWS credits, SaaS discounts, exclusive offers).

## Overview

Perks Portal provides a curated marketplace experience where:
- **Founders** can easily browse and redeem perks available through their VC
- **Platform Teams / Admins** can manage, curate, and control which perks are visible to their portfolio companies

### Key Features

**For Founders:**
- **Perks Catalog** - Browse 460+ exclusive perks with search and filtering
- **Smart Filtering** - Filter by investment stage (Bootstrapped, Seed, Series A, etc.) and category
- **Perk Details** - View full information, eligibility, redemption instructions, and coupon codes
- **Similar Perks** - Discover related offers based on categories and deal types
- **Vendor Grouping** - View perks organized by vendor

**For Admins:**
- **Vendor Management** - Browse and manage vendor details with perk counts
- **Warm Connections** - See Bridge intropath data for vendors (who can introduce you)
- **Whitelist Management** - Control domain-based access
- **API Health Monitoring** - Real-time status of GetProven and Bridge APIs

## Tech Stack

- **Framework**: [Next.js 14](https://nextjs.org/) with App Router
- **Language**: [TypeScript](https://www.typescriptlang.org/)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/)
- **Icons**: [Lucide React](https://lucide.dev/)
- **Primary Integration**: [GetProven API](https://provendeals.getproven.com/api/ext/v1/docs/)
- **Secondary Integration**: [Bridge API](https://brdg.app) - Warm connections / intropath data

## Getting Started

### Prerequisites

- Node.js 18.x or higher
- npm, yarn, or pnpm

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd perks-portal
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env.local
   ```

   Edit `.env.local` and configure:
   - `GETPROVEN_API_TOKEN` - Your GetProven API token (required)
   - `GETPROVEN_API_URL` - API base URL (default provided)
   - `BRIDGE_API_KEY` - Your Bridge API key (optional, for warm connections)
   - `BRIDGE_API_BASE_URL` - Bridge API base URL (default: https://api.brdg.app)
   - `USE_MOCK_DATA` - Set to `true` for development without API access

4. **Start the development server**
   ```bash
   npm run dev
   ```

5. **Open your browser**
   Navigate to [http://localhost:3002](http://localhost:3002)

## Project Structure

```
perks-portal/
├── src/
│   ├── app/                      # Next.js App Router pages
│   │   ├── (dashboard)/          # Dashboard routes
│   │   │   ├── perks/            # Perks listing and detail pages
│   │   │   │   └── [id]/         # Individual perk page
│   │   │   └── admin/            # Admin management pages
│   │   │       ├── vendors/      # Vendor management
│   │   │       │   └── [id]/     # Individual vendor detail
│   │   │       ├── whitelist/    # Domain whitelist management
│   │   │       └── individual-access/  # Individual email access
│   │   ├── api/                  # API routes
│   │   │   ├── perks/            # Perks endpoints
│   │   │   │   ├── filters/      # Filter options
│   │   │   │   └── totals/       # Perk counts
│   │   │   ├── vendors/          # Vendor endpoints
│   │   │   │   ├── filters/      # Vendor filter options
│   │   │   │   └── [id]/         # Vendor detail, clients, contacts
│   │   │   ├── admin/whitelist/  # Whitelist management
│   │   │   └── health/           # API health status
│   │   ├── layout.tsx            # Root layout
│   │   └── page.tsx              # Landing/redirect
│   │
│   ├── components/               # React components
│   │   ├── ui/                   # Reusable UI primitives
│   │   │   ├── button.tsx
│   │   │   ├── badge.tsx
│   │   │   ├── card.tsx
│   │   │   ├── input.tsx
│   │   │   ├── search-input.tsx
│   │   │   └── disclosure.tsx
│   │   ├── layout/               # Layout components
│   │   │   ├── app-shell.tsx     # Main app wrapper
│   │   │   ├── top-nav.tsx       # Top navigation bar
│   │   │   ├── bottom-nav.tsx    # Mobile bottom navigation
│   │   │   ├── api-health-badge.tsx  # API status indicator
│   │   │   └── header.tsx        # Page headers
│   │   ├── perks/                # Perk-specific components
│   │   │   ├── perk-card.tsx     # Perk card for grid
│   │   │   ├── perks-grid.tsx    # Grid layout with states
│   │   │   ├── offer-card.tsx    # Offer card component
│   │   │   ├── offers-grid.tsx   # Offers grid layout
│   │   │   ├── vendor-group.tsx  # Vendor group display
│   │   │   ├── vendor-icon.tsx   # Vendor logo/icon
│   │   │   ├── copy-button.tsx   # Copy to clipboard
│   │   │   └── category-filter.tsx
│   │   └── vendors/              # Vendor-specific components
│   │       ├── vendor-card.tsx   # Vendor card for grid
│   │       └── vendors-grid.tsx  # Vendors grid layout
│   │
│   ├── lib/                      # Utilities and services
│   │   ├── api/                  # API service layer
│   │   │   ├── getproven-client.ts  # GetProven API client
│   │   │   ├── bridge-client.ts     # Bridge API client (intropath)
│   │   │   ├── perks-service.ts     # High-level perks service
│   │   │   ├── vendors-service.ts   # High-level vendors service
│   │   │   ├── whitelist-service.ts # Whitelist management
│   │   │   └── index.ts
│   │   ├── normalizers/          # Data transformation
│   │   │   └── getproven.ts      # GetProven response normalizer
│   │   ├── utils/                # Utility functions
│   │   │   ├── cn.ts             # Class name helper
│   │   │   └── format.ts         # Formatting utilities
│   │   ├── similarity.ts         # Vendor similarity matching
│   │   └── constants.ts          # App constants
│   │
│   ├── types/                    # TypeScript type definitions
│   │   ├── perk.ts               # Perk-related types
│   │   ├── user.ts               # User and org types
│   │   ├── api.ts                # API response types
│   │   └── index.ts
│   │
│   └── styles/
│       └── globals.css           # Global styles and Tailwind
│
├── public/                       # Static assets
├── DESIGN_SYSTEM.md              # MercuryOS design system reference
├── .env.example                  # Environment template
├── next.config.js                # Next.js configuration
├── tailwind.config.js            # Tailwind configuration
├── tsconfig.json                 # TypeScript configuration
└── package.json
```

## Configuration

### Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `GETPROVEN_API_TOKEN` | API token for GetProven authentication | Yes (production) |
| `GETPROVEN_API_URL` | GetProven API base URL | No (default provided) |
| `BRIDGE_API_KEY` | API key for Bridge warm connections | No (admin feature) |
| `BRIDGE_API_BASE_URL` | Bridge API base URL | No (default: https://api.brdg.app) |
| `USE_MOCK_INTROPATH_DATA` | Use mock data for Bridge API | No (default: false) |
| `NEXT_PUBLIC_APP_URL` | Public URL of your deployment | No |
| `USE_MOCK_DATA` | Use mock data instead of API | No (default: false) |
| `NEXT_PUBLIC_ENABLE_ADMIN` | Enable admin features | No (default: true) |

### GetProven API

The application integrates with GetProven for perk data. The API client (`src/lib/api/getproven-client.ts`) handles:
- Token-based authentication
- Paginated requests
- Error handling
- Response transformation

**Authentication**: Uses `Token <API_TOKEN>` in the Authorization header (server-side only).

### Bridge API

The application integrates with Bridge API for warm connection data (intropath counts). This is an **admin-only feature** that shows how many people in your network can introduce you to a vendor.

The Bridge client (`src/lib/api/bridge-client.ts`) handles:
- Bearer token authentication
- Domain extraction from vendor websites
- Graceful error handling (fails silently if unavailable)
- Mock data support for testing

**Authentication**: Uses `Bearer <API_KEY>` in the Authorization header (server-side only).

**Note**: Bridge API is optional. If `BRIDGE_API_KEY` is not configured, the warm connections feature will be hidden.

## Development

### Available Scripts

```bash
npm run dev        # Start development server
npm run build      # Build for production
npm run start      # Start production server
npm run lint       # Run ESLint
npm run type-check # Run TypeScript compiler check
```

### Using Mock Data

For development without API access, set `USE_MOCK_DATA=true` in your `.env.local`. The mock data includes:
- 6 sample categories
- 6 sample perks with various providers
- Realistic data structure matching the expected API format

### Code Style

- Components use TypeScript with explicit prop interfaces
- CSS uses Tailwind utility classes
- API calls are abstracted into the service layer
- TODO comments mark areas for future implementation

## Key Implementation Notes

### Areas Marked for Future Implementation

Search the codebase for `TODO:` comments to find areas needing implementation:

- **Authentication**: User login/session management (`src/app/(dashboard)/layout.tsx`)
- **Search**: Global search functionality (`src/components/layout/header.tsx`)
- **Pagination**: Perk list pagination (`src/app/(dashboard)/perks/page.tsx`)
- **Redemption Tracking**: Track when users redeem perks
- **Analytics**: Usage and redemption analytics
- **Portfolio Selector**: Multi-VC support (`src/components/layout/sidebar.tsx`)
- **Admin Actions**: Edit, delete, bulk operations (`src/app/(dashboard)/admin/perks/page.tsx`)

### Data Flow

1. **API Service Layer** (`src/lib/api/`) abstracts data fetching
2. **Server Components** fetch data directly in Next.js pages
3. **Client Components** use the API routes (`/api/*`) for client-side fetching
4. **Type Safety** is enforced throughout via TypeScript interfaces

### Styling Approach

- **Tailwind CSS** for utility-first styling
- **CSS Variables** for theme customization (`src/styles/globals.css`)
- **Component Variants** use the `cn()` helper for conditional classes
- **Brand Colors** customizable in `tailwind.config.js`
- **Design System** - See `DESIGN_SYSTEM.md` for MercuryOS spacing and component guidelines (8px grid system)

## API Routes

### Perks API

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/perks` | GET | List perks with pagination and filters |
| `/api/perks/[id]` | GET | Get single perk by ID or slug |
| `/api/perks/filters` | GET | Get available filter options (categories, stages) |
| `/api/perks/totals` | GET | Get total perk counts |

### Vendors API

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/vendors` | GET | List vendors with pagination and filters |
| `/api/vendors/[id]` | GET | Get single vendor by ID |
| `/api/vendors/[id]/clients` | GET | Get vendor's client list |
| `/api/vendors/[id]/contacts` | GET | Get vendor contacts |
| `/api/vendors/filters` | GET | Get available vendor filter options |

### Admin API

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/admin/whitelist/domains` | GET/POST/DELETE | Manage whitelisted domains |
| `/api/admin/whitelist/individual-access` | GET/POST/DELETE | Manage individual email access |
| `/api/admin/whitelist/upload` | POST | Bulk upload domains via CSV |

### Health API

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/health` | GET | Check API health (GetProven + Bridge) |

### Query Parameters (GET /api/perks)

- `page` - Page number (default: 1)
- `pageSize` - Items per page (default: 12)
- `category` - Filter by category slug
- `search` - Search query
- `stage` - Filter by investment stage

## Deployment

### Vercel (Recommended)

1. Connect your repository to Vercel
2. Add environment variables in project settings
3. Deploy

### Other Platforms

The app can be deployed to any platform supporting Next.js:
- Docker
- AWS (Amplify, ECS)
- Google Cloud Run
- Self-hosted Node.js server

## Contributing

1. Create a feature branch
2. Make your changes
3. Ensure TypeScript compiles (`npm run type-check`)
4. Run linting (`npm run lint`)
5. Submit a pull request

## License

Private - All rights reserved.

---

Built for VC platform teams to empower their portfolio founders.
