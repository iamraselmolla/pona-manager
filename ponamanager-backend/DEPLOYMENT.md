## PONATRACK COMPLETE SETUP & DEPLOYMENT GUIDE

### FRONTEND SETUP

```bash
cd ponatrack-frontend
npm install
npx prisma generate
npx expo start
```

**Build APK for Android:**
```bash
npx eas build --platform android --local
```

**Build for iOS:**
```bash
npx eas build --platform ios --local
```

---

### BACKEND SETUP

```bash
cd ponatrack-backend
npm install
npx prisma generate
npx prisma migrate dev
npm run dev
```

### DATABASE SETUP (PostgreSQL)

**Using Railway (Recommended):**
1. Create account at railway.app
2. Create new PostgreSQL database
3. Copy connection string to .env

**Using Local PostgreSQL:**
```bash
# Install PostgreSQL
# Create database
createdb ponatrack

# Set DATABASE_URL in .env
DATABASE_URL="postgresql://user:password@localhost:5432/ponatrack"

# Run migrations
npx prisma migrate dev
```

**Using Supabase:**
1. Create account at supabase.com
2. Create new project
3. Copy PostgreSQL connection URL
4. Set as DATABASE_URL

---

### ENVIRONMENT VARIABLES

**Frontend (.env):**
```
API_BASE_URL=http://localhost:5000/api
```

**Backend (.env):**
```
DATABASE_URL="postgresql://user:password@localhost:5432/ponatrack"
JWT_SECRET="your-super-secret-key-min-32-chars"
NODE_ENV="development"
PORT=5000
CORS_ORIGIN="http://localhost:3000"
```

---

### DEPLOYMENT OPTIONS

#### Option 1: Railway (Recommended for Beginners)
```bash
# Install Railway CLI
npm i -g @railway/cli

# Login to Railway
railway login

# Initialize Railway
railway init

# Deploy
railway up
```

#### Option 2: Render
1. Connect GitHub repo
2. Create PostgreSQL database
3. Set environment variables
4. Deploy

#### Option 3: Vercel (Frontend) + Heroku (Backend)
```bash
# Frontend
vercel deploy

# Backend (Heroku)
heroku login
heroku create ponatrack-api
git push heroku main
```

#### Option 4: VPS (DigitalOcean, Linode, AWS)
```bash
# SSH into server
ssh root@your_server_ip

# Install Node.js & PostgreSQL
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs postgresql

# Clone repo
git clone your_repo_url
cd ponatrack-backend

# Install dependencies
npm install

# Setup database
createdb ponatrack

# Setup environment
cp .env.example .env
# Edit .env with your settings

# Run migrations
npx prisma migrate deploy

# Start server
npm start

# Use PM2 for process management
npm install -g pm2
pm2 start src/index.ts --name "ponatrack"
pm2 startup
pm2 save
```

#### Using Docker
```dockerfile
# Dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build
EXPOSE 5000
CMD ["npm", "start"]
```

```bash
# Build and run
docker build -t ponatrack-api .
docker run -p 5000:5000 --env-file .env ponatrack-api
```

---

### DATABASE MIGRATIONS

```bash
# Create migration
npx prisma migrate dev --name add_new_field

# Deploy migration to production
npx prisma migrate deploy

# Reset database (development only)
npx prisma migrate reset

# Check migration status
npx prisma migrate status

# Seed database with initial user
npx ts-node scripts/seed.ts
```

---

### INITIAL USER SETUP

Create `scripts/seed.ts`:
```typescript
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  const hashedPassword = await bcrypt.hash('admin123', 10);
  await prisma.user.create({
    data: {
      name: 'Admin User',
      email: 'admin@ponatrack.com',
      password: hashedPassword,
      role: 'admin',
    },
  });
  console.log('✅ Admin user created');
}

main()
  .then(() => process.exit(0))
  .catch((e) => { console.error(e); process.exit(1); });
```

Run: `npx ts-node scripts/seed.ts`

---

### API TESTING

Use Postman or similar:

**Login:**
```
POST http://localhost:5000/api/auth/login
Body: { "email": "admin@ponatrack.com", "password": "admin123" }
```

**Get Customers:**
```
GET http://localhost:5000/api/customers
Headers: Authorization: Bearer {token}
```

---

### MOBILE APP BUILD

**For Android (APK):**
```bash
eas build --platform android
# Or local
npx eas build --platform android --local
```

**For iOS:**
```bash
eas build --platform ios
```

**Local Build (Android):**
```bash
cd android
./gradlew assembleRelease
# APK will be in: app/build/outputs/apk/release/
```

---

### PRODUCTION CHECKLIST

- [ ] Set NODE_ENV=production
- [ ] Change JWT_SECRET to strong random string
- [ ] Setup HTTPS/SSL certificate
- [ ] Enable rate limiting
- [ ] Setup database backups
- [ ] Configure CORS properly
- [ ] Setup error logging (Sentry)
- [ ] Setup monitoring (New Relic, DataDog)
- [ ] Setup CI/CD pipeline
- [ ] Add health check endpoint
- [ ] Setup automated testing
- [ ] Document API endpoints

---

### TROUBLESHOOTING

**Database Connection Error:**
```bash
# Check PostgreSQL is running
sudo service postgresql status

# Check connection string
psql your_connection_string
```

**Port Already in Use:**
```bash
# Linux/Mac
lsof -i :5000
kill -9 PID

# Windows
netstat -ano | findstr :5000
taskkill /PID PID /F
```

**Prisma Client Issues:**
```bash
npx prisma generate
rm -rf node_modules/.prisma
npm install
```

**CORS Errors:**
- Ensure CORS_ORIGIN in .env matches frontend URL
- Check browser console for specific errors

---

### MONITORING & LOGGING

**Setup Morgan logging:**
Already configured in src/index.ts

**Add Sentry for error tracking:**
```bash
npm install @sentry/node
```

**Add Winston for custom logging:**
```bash
npm install winston
```

---

### BACKUP & RESTORE

**PostgreSQL Backup:**
```bash
pg_dump your_db > backup.sql
psql your_db < backup.sql
```

**Automated Daily Backup Script:**
```bash
#!/bin/bash
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
pg_dump $DATABASE_URL > backups/backup_$TIMESTAMP.sql
```

---

### SCALING CONSIDERATIONS

1. **Database**: Consider read replicas for high traffic
2. **Caching**: Add Redis for frequently accessed data
3. **Load Balancing**: Use Nginx for multiple API instances
4. **CDN**: Use CloudFlare for static assets
5. **Message Queue**: Add Bull/RabbitMQ for async tasks
6. **Database Indexing**: Index mobile, date, status fields

---

### SUPPORT & TROUBLESHOOTING

For issues:
1. Check logs: `npm run dev 2>&1 | tee app.log`
2. Check database: `npx prisma studio`
3. Test API: Use Postman/Insomnia
4. Check migration status: `npx prisma migrate status`
5. Reset in dev: `npx prisma migrate reset`
