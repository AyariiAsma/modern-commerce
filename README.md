# AURA E-Commerce Platform

A modern, responsive, and front-to-back simulated e-commerce application built with React, Vite, Tailwind CSS 3, and React Router.

## Key Features

- **Storefront Home**: A beautiful, responsive hero layout with category listings and featured releases.
- **Product Catalog**: Advanced search, multi-category checklist filtering, pricing limits sliders, ratings sorting, and pagination.
- **Interactive Details**: Multi-preview image gallery toggles, live inventory badges, related items recommendation grid, and stock quantity controllers.
- **Checkouts & Cart**: Coupon code validators (coupon `AURASTART` provides 15% discount), shipping thresholds calculations. Billing and validation shipping forms powered by `react-hook-form`.
- **Role-Based Authentications**: Private admin route gates redirect unauthorized requests to `/login`. Contains mockup switch configs for fast navigation.
- **Statistical Admin Dashboard**: Real-time sales charts calculations, low-inventory notifications log, recent order lists, and complete CRUD managers for categories and products.

## Technology Stack

- **Framework**: React / Vite (Fast HMR)
- **Styling**: Tailwind CSS v3 / Vanilla CSS Custom Utilities
- **State managers**: React Context API (DatabaseContext, AuthContext, CartContext) with persistence via `localStorage`.
- **Validations & Forms**: React Hook Form
- **Icons**: Lucide React

## Project Directory Organization

```
modern-commerce/
├── src/
│   ├── components/       # Reusable layout grids, overlays, pagination, modals
│   ├── layouts/          # Customer storefront vs Admin workspace frames
│   ├── pages/
│   │   ├── admin/        # CRUD dashboards, product managers, statistics
│   │   └── customer/     # Catalog, ProductDetails, Checkout lists
│   ├── routes/           # Central Route endpoints mapping
│   ├── services/         # Axios-like service layer mocking database operations
│   └── store/            # AuthContext, CartContext, DatabaseContext state providers
```

## Running the Application

1. **Install modules**:
   ```bash
   npm install
   ```
2. **Launch Dev Environment**:
   ```bash
   npm run dev
   ```
3. **Build compiled assets**:
   ```bash
   npm run build
   ```
4. **Mock Logins**:
   - **Customer**: `alice@example.com` / `password123`
   - **Admin**: `admin@example.com` / `adminpassword`
