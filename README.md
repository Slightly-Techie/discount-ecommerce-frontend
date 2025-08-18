# Whammo - E-Commerce Discount Platform

## Project Overview

Whammo is a modern e-commerce platform that aggregates discounted products from major retailers like Shoprite and Melcom. Built with React, TypeScript, and modern web technologies, it provides users with a seamless shopping experience to discover and purchase discounted products.

## Features

- **Product Browsing**: Browse products with search and filtering capabilities
- **Shopping Cart**: Add items to cart with guest and authenticated user support
- **Favorites**: Save products to wishlist
- **User Authentication**: Secure login/register with JWT tokens
- **Admin Dashboard**: Product and user management for administrators
- **Responsive Design**: Mobile-first approach with beautiful UI
- **Real-time Updates**: Optimistic UI updates and automatic data synchronization

## Tech Stack

- **Frontend**: React 18, TypeScript, Vite
- **UI Library**: shadcn/ui, Tailwind CSS, Radix UI
- **State Management**: Zustand, TanStack Query
- **Routing**: React Router DOM
- **HTTP Client**: Axios with interceptors
- **Authentication**: JWT with refresh tokens

## How can I edit this code?

There are several ways of editing your application:

**Use your preferred IDE**

If you want to work locally using your own IDE, you can clone this repo and push changes.

The only requirement is having Node.js & npm installed - [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating)

Follow these steps:

```sh
# Step 1: Clone the repository using the project's Git URL.
git clone <YOUR_GIT_URL>

# Step 2: Navigate to the project directory.
cd <YOUR_PROJECT_NAME>

# Step 3: Install the necessary dependencies.
npm i

# Step 4: Start the development server with auto-reloading and an instant preview.
npm run dev
```

**Edit a file directly in GitHub**

- Navigate to the desired file(s).
- Click the "Edit" button (pencil icon) at the top right of the file view.
- Make your changes and commit the changes.

**Use GitHub Codespaces**

- Navigate to the main page of your repository.
- Click on the "Code" button (green button) near the top right.
- Select the "Codespaces" tab.
- Click on "New codespace" to launch a new Codespace environment.
- Edit files directly within the Codespace and commit and push your changes once you're done.

## What technologies are used for this project?

This project is built with:

- Vite
- TypeScript
- React
- shadcn-ui
- Tailwind CSS

## How can I deploy this project?

USe Netlify or any other free deployment platform

## Deployment

This project can be deployed to any modern hosting platform that supports Node.js applications.

### Recommended Platforms

- **Vercel**: Optimized for React applications with automatic deployments
- **Netlify**: Great for static sites with serverless functions
- **Railway**: Full-stack deployment with database support
- **Heroku**: Traditional hosting with easy scaling

### Environment Variables

Make sure to set the following environment variables in your deployment platform:

```env
VITE_API_BASE_URL=your_api_base_url
```

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request
