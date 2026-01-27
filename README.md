# Perks Portal

A web application for VC firms and platform teams to help founders in their portfolio discover, browse, and redeem startup perks (e.g., AWS credits, SaaS discounts, exclusive offers).

## Overview

Perks Portal provides a curated marketplace experience where:
- **Founders** can easily browse and redeem perks available through their VC
- **Platform Teams / Admins** can manage, curate, and control which perks are visible to their portfolio companies

### Key Features

- **Perks Catalog** - Browse all available perks with search and filtering
- **Category Navigation** - Filter perks by category (Cloud, Developer Tools, Sales, etc.)
- **Perk Details** - View full information, eligibility requirements, and redemption instructions
- **Admin Dashboard** - Manage perk visibility and track redemption analytics
- **Portfolio Access Control** - Founders only see perks curated for their VC

## Tech Stack

- **Framework**: [Next.js 14](https://nextjs.org/) with App Router
- **Language**: [TypeScript](https://www.typescriptlang.org/)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/)
- **Icons**: [Lucide React](https://lucide.dev/)
- **Primary Integration**: [GetProven API](https://provendeals.getproven.com/api/ext/v1/docs/)

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
   - `GETPROVEN_API_TOKEN` - Your GetProven API token
   - `GETPROVEN_API_URL` - API base URL (default provided)
   - `USE_MOCK_DATA` - Set to `true` for development without API access

4. **Start the development server**
   ```bash
   npm run dev
   ```

5. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

## Project Structure

```
perks-portal/
├── src/
│   ├── app/                      # Next.js App Router pages
│   │   ├── (dashboard)/          # Authenticated dashboard routes
│   │   │   ├── perks/            # Perks listing and detail pages
│   │   │   │   └── [id]/         # Individual perk page
│   │   │   └── admin/            # Admin management pages
│   │   │       └── perks/        # Perks management table
│   │   ├── api/                  # API routes
│   │   │   ├── perks/            # Perks endpoints
│   │   │   └── categories/       # Categories endpoint
│   │   ├── layout.tsx            # Root layout
│   │   └── page.tsx              # Landing/redirect
│   │
│   ├── components/               # React components
│   │   ├── ui/                   # Reusable UI primitives
│   │   │   ├── button.tsx
│   │   │   ├── badge.tsx
│   │   │   ├── card.tsx
│   │   │   └── input.tsx
│   │   ├── layout/               # Layout components
│   │   │   ├── app-shell.tsx     # Main app wrapper
│   │   │   ├── sidebar.tsx       # Navigation sidebar
│   │   │   └── header.tsx        # Top header bar
│   │   └── perks/                # Perk-specific components
│   │       ├── perk-card.tsx     # Perk card for grid
│   │       ├── perks-grid.tsx    # Grid layout with states
│   │       └── category-filter.tsx
│   │
│   ├── lib/                      # Utilities and services
│   │   ├── api/                  # API service layer
│   │   │   ├── getproven-client.ts  # GetProven API client
│   │   │   ├── perks-service.ts     # High-level perks service
│   │   │   ├── mock-data.ts         # Mock data for development
│   │   │   └── index.ts
│   │   ├── utils/                # Utility functions
│   │   │   ├── cn.ts             # Class name helper
│   │   │   └── format.ts         # Formatting utilities
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

## API Routes

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/perks` | GET | List perks with pagination and filters |
| `/api/perks/[id]` | GET | Get single perk by ID or slug |
| `/api/categories` | GET | List all categories |

### Query Parameters (GET /api/perks)

- `page` - Page number (default: 1)
- `pageSize` - Items per page (default: 12)
- `category` - Filter by category slug
- `search` - Search query
- `featured` - Filter featured perks only (true/false)

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
