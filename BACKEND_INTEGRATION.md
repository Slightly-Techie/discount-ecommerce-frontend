# Backend Integration Guide

This guide explains how to integrate your backend API with the DealsHub e-commerce frontend.

## 🚀 Quick Setup

### 1. Environment Configuration

Create a `.env` file in your project root:

```env
# Backend API Configuration
VITE_API_BASE_URL=http://localhost:3000/api

# Authentication
VITE_AUTH_ENABLED=true

# Feature Flags
VITE_ENABLE_CART=true
VITE_ENABLE_FAVORITES=true
VITE_ENABLE_ADMIN=true
```

### 2. Backend API Endpoints

Your backend should implement these endpoints:

#### Products
- `GET /api/products` - Get all products with filters
- `GET /api/products/featured` - Get featured products
- `GET /api/products/:id` - Get single product
- `POST /api/products` - Create product (Admin)
- `PUT /api/products/:id` - Update product (Admin)
- `DELETE /api/products/:id` - Delete product (Admin)

#### Cart
- `GET /api/cart` - Get user's cart
- `POST /api/cart/items` - Add item to cart
- `PUT /api/cart/items/:productId` - Update cart item quantity
- `DELETE /api/cart/items/:productId` - Remove item from cart
- `DELETE /api/cart` - Clear cart

#### Favorites
- `GET /api/favorites` - Get user's favorites
- `POST /api/favorites` - Add product to favorites
- `DELETE /api/favorites/:productId` - Remove from favorites

#### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/register` - User registration
- `POST /api/auth/logout` - User logout
- `GET /api/auth/me` - Get current user

#### Orders
- `POST /api/orders` - Create order
- `GET /api/orders` - Get user's orders
- `GET /api/orders/:id` - Get single order

## 📁 File Structure

```
src/
├── lib/
│   └── api.ts              # API service layer
├── hooks/
│   ├── useProducts.ts      # Product data hooks
│   ├── useCart.ts          # Cart management hooks
│   ├── useAuth.ts          # Authentication hooks
│   └── use-toast.ts        # Toast notifications
└── pages/
    ├── Products.tsx        # Updated to use backend
    ├── Admin.tsx           # Updated to use backend
    └── ...
```

## 🔧 API Response Format

Your backend should return data in this format:

```typescript
// Success Response
{
  "success": true,
  "data": any,
  "message": "Optional message"
}

// Paginated Response
{
  "success": true,
  "data": Product[],
  "pagination": {
    "page": number,
    "limit": number,
    "total": number,
    "totalPages": number
  }
}

// Error Response
{
  "success": false,
  "message": "Error message",
  "errors": ["field": "error message"]
}
```

## 🔐 Authentication

The frontend uses JWT tokens stored in localStorage:

```typescript
// Token is automatically added to requests
localStorage.setItem('authToken', 'your-jwt-token');

// API interceptor adds Authorization header
headers: {
  'Authorization': 'Bearer your-jwt-token'
}
```

## 📊 React Query Integration

The app uses React Query for:
- **Caching**: Automatic data caching
- **Background updates**: Fresh data in background
- **Optimistic updates**: Immediate UI updates
- **Error handling**: Automatic retry and error states

### Query Keys
```typescript
// Products
['products', 'list', { search, category, brand }]
['products', 'detail', productId]
['products', 'featured']

// Cart
['cart', 'items']

// Auth
['auth', 'user']
```

## 🛠️ Development

### 1. Start Development Server
```bash
npm run dev
```

### 2. Backend Development
- Ensure your backend is running on `http://localhost:3000`
- Update `VITE_API_BASE_URL` if different
- Test API endpoints with tools like Postman

### 3. Environment Variables
```bash
# Development
VITE_API_BASE_URL=http://localhost:3000/api

# Production
VITE_API_BASE_URL=https://your-api.com/api
```

## 🔄 Data Flow

1. **Products Page**: Fetches products from `/api/products` with filters
2. **Cart**: Manages cart state with optimistic updates
3. **Admin**: CRUD operations with real-time updates
4. **Authentication**: JWT-based auth with automatic token handling

## 🚨 Error Handling

The app includes comprehensive error handling:
- Network errors
- Authentication errors (401 → redirect to login)
- Validation errors
- User-friendly error messages

## 📱 Features

### ✅ Implemented
- Product listing with filters
- Cart management
- Admin product CRUD
- Authentication hooks
- Error handling
- Loading states

### 🔄 To Implement
- User registration/login pages
- Order management
- Payment integration
- User profile
- Admin dashboard analytics

## 🧪 Testing

Test your backend integration:

1. **Products**: Check if products load from API
2. **Cart**: Test add/remove cart items
3. **Admin**: Test create/update/delete products
4. **Auth**: Test login/logout flow

## 🚀 Deployment

1. Set production environment variables
2. Build the app: `npm run build`
3. Deploy to your hosting platform
4. Ensure CORS is configured on your backend

## 📞 Support

If you encounter issues:
1. Check browser network tab for API errors
2. Verify backend endpoints are working
3. Check environment variables
4. Ensure CORS is properly configured 