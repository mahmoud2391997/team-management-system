# Deployment Guide

This guide covers deploying the Team Management System to production.

## Pre-Deployment Checklist

- [ ] Environment variables configured
- [ ] Database schema created in Supabase
- [ ] User roles and RLS policies verified
- [ ] Application tested locally
- [ ] README and documentation updated
- [ ] Build completes without errors

## Deployment to Vercel (Recommended)

### Step 1: Prepare Your Repository

1. Initialize git if not already done:
```bash
git init
git add .
git commit -m "Initial commit: Team Management System"
```

2. Push to GitHub:
```bash
git remote add origin https://github.com/yourusername/team-management-system.git
git branch -M main
git push -u origin main
```

### Step 2: Connect to Vercel

1. Go to [vercel.com](https://vercel.com) and sign in
2. Click "Add New..." → "Project"
3. Import your GitHub repository
4. Select the project and click "Continue"

### Step 3: Configure Environment Variables

1. In Vercel, go to "Settings" → "Environment Variables"
2. Add the following variables:
   ```
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```
3. Ensure both `Preview` and `Production` environments are selected
4. Click "Save"

### Step 4: Deploy

1. Click "Deploy"
2. Vercel will automatically build and deploy your application
3. Monitor the deployment in the "Deployments" tab
4. Your app will be live at your Vercel domain

### Step 5: Update Auth Callback URL

After deployment, update the Supabase auth callback URL:

1. Go to Supabase dashboard → "Authentication" → "URL Configuration"
2. Add your Vercel production URL to "Redirect URLs":
   ```
   https://your-domain.vercel.app/auth/callback
   ```

## Deployment to Other Platforms

### AWS Amplify

1. Connect your GitHub repository to AWS Amplify
2. Configure build settings:
   ```yaml
   version: 1
   frontend:
     phases:
       install:
         commands:
           - npm install -g pnpm
           - pnpm install
       build:
         commands:
           - pnpm run build
     artifacts:
       baseDirectory: .next
       files:
         - '**/*'
   ```
3. Add environment variables in Amplify console
4. Deploy

### DigitalOcean App Platform

1. Connect your GitHub repository
2. Configure build command: `pnpm install && pnpm run build`
3. Configure run command: `npm start`
4. Set environment variables
5. Deploy

### Docker (Any Cloud Provider)

Create a `Dockerfile`:

```dockerfile
FROM node:18-alpine

WORKDIR /app

# Install pnpm
RUN npm install -g pnpm

# Copy package files
COPY package.json pnpm-lock.yaml ./

# Install dependencies
RUN pnpm install --frozen-lockfile

# Copy source
COPY . .

# Build
RUN pnpm run build

# Expose port
EXPOSE 3000

# Start
CMD ["npm", "start"]
```

Build and push:
```bash
docker build -t team-management-system .
docker run -p 3000:3000 -e NEXT_PUBLIC_SUPABASE_URL=... team-management-system
```

## Environment Variables for Production

Ensure these are set in your production environment:

```
NEXT_PUBLIC_SUPABASE_URL=                    # Your production Supabase URL
NEXT_PUBLIC_SUPABASE_ANON_KEY=              # Your production anon key
```

## Database Setup in Production

1. Create a new Supabase project for production
2. Run the database migration script to create tables and RLS policies
3. Test authentication and permissions

## Performance Optimization

### Caching

- Static assets are cached by default
- Consider using Supabase edge functions for frequently accessed data
- Enable browser caching headers

### Database Optimization

- Indexes are already created for common queries
- Monitor slow queries in Supabase dashboard
- Consider read replicas for high-traffic applications

### Image Optimization

- Images are optimized by Next.js automatically
- Use Next.js `Image` component for all images

## Monitoring

### Vercel Monitoring

- Monitor deployments in Vercel dashboard
- Check Core Web Vitals
- Review analytics

### Supabase Monitoring

- Monitor database connections
- Track query performance
- Review authentication logs

### Application Monitoring

Consider adding:
- Error tracking with Sentry
- Performance monitoring with New Relic
- Logging with LogRocket

## Troubleshooting Deployment Issues

### Build Fails

1. Check build logs in deployment platform
2. Verify all dependencies are listed in `package.json`
3. Ensure environment variables are set correctly
4. Clear build cache and redeploy

### Authentication Not Working

1. Verify Supabase URL and keys are correct
2. Check callback URL matches deployment domain
3. Ensure RLS policies are enabled
4. Review authentication logs in Supabase

### Database Connection Issues

1. Check Supabase project status
2. Verify connection string
3. Ensure IP allowlist includes deployment platform
4. Review database logs

### Performance Issues

1. Run `pnpm run build` to check bundle size
2. Use Vercel Analytics to identify bottlenecks
3. Check database query performance
4. Consider implementing caching strategies

## Rollback

### Vercel Rollback

1. Go to Vercel dashboard → "Deployments"
2. Find the previous stable deployment
3. Click "..." → "Promote to Production"

### Database Rollback

If schema migration failed:
1. Go to Supabase SQL Editor
2. Review migration logs
3. Manually revert changes if needed
4. Re-run migration

## Continuous Deployment

Set up auto-deploy on push:

1. In Vercel, enable "Automatic deployments"
2. Any push to main branch automatically deploys
3. Preview deployments for pull requests

## Security Checklist

- [ ] Environment variables are not exposed
- [ ] RLS policies are enabled and tested
- [ ] Authentication is working correctly
- [ ] HTTPS is enabled
- [ ] CORS is properly configured
- [ ] API rate limiting is in place
- [ ] Sensitive data is not logged
- [ ] Regular backups are configured

## Getting Help

- Check Vercel documentation: https://vercel.com/docs
- Check Supabase documentation: https://supabase.com/docs
- Review Next.js deployment guide: https://nextjs.org/docs/deployment
