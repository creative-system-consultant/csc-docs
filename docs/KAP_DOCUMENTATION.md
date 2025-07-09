---
id: kap-docs
title: Kasih AP Gold Documentation
sidebar_position: 3
---

# KAP (Kasih AP Gold) Trading Platform Documentation

## Table of Contents
1. [Project Overview](#project-overview)
2. [System Architecture](#system-architecture)
3. [Development Environment Setup](#development-environment-setup)
4. [Authentication & Authorization](#authentication--authorization)
5. [Core Business Logic](#core-business-logic)
6. [Payment Integration Systems](#payment-integration-systems)
7. [Frontend Architecture (Livewire)](#frontend-architecture-livewire)
8. [Database Schema & Relationships](#database-schema--relationships)
9. [API Endpoints & Routes](#api-endpoints--routes)
10. [Critical Security Issues](#critical-security-issues)
11. [Deployment Guide](#deployment-guide)
12. [Maintenance & Support](#maintenance--support)

---

## Project Overview

**KAP (Kasih AP Gold)** is a comprehensive Malaysian gold trading platform built with Laravel 8, offering:
- Digital and physical gold trading
- Multi-level marketing (MLM) agent structure
- Islamic pawn services (Ar-Rahnu)
- Commission management system
- Real-time auction system (Lelongan)
- Multiple payment gateway integrations

### Key Stakeholders
- **Kasih Gold**: Primary client (client_id = 1)
- **Kasih AP Gold**: Secondary client (client_id = 2)
- **Agents**: Multi-tier marketing structure
- **Customers**: End users trading gold

### Technology Stack
- **Backend**: Laravel 8, PHP 7.3+
- **Frontend**: Livewire 2, Alpine.js, Tailwind CSS
- **Database**: MySQL (primary), SQL Server (Arrahnu system)
- **Real-time**: Laravel WebSockets, Pusher
- **Payment**: ToyyibPay, Snap N Pay
- **Queue**: Redis/Database
- **Email**: SMTP with custom templates

---

## System Architecture

### Multi-Database Architecture
```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Primary DB    │    │   ArrahnuDB     │    │   External APIs │
│   (MySQL)       │    │  (SQL Server)   │    │   (Payment)     │
│                 │    │                 │    │                 │
│ • Users         │    │ • Pawn Records  │    │ • ToyyibPay     │
│ • Gold Trading  │    │ • Auctions      │    │ • SnapNPay      │
│ • Commissions   │    │ • Branches      │    │ • eSMS          │
│ • Inventory     │    │ • Daily Prices  │    │ • Market Prices │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

### Application Layers
1. **Presentation Layer**: Livewire components + Blade templates
2. **Business Logic Layer**: Controllers, Services, and Models
3. **Data Access Layer**: Eloquent ORM, Raw SQL (for complex queries)
4. **Integration Layer**: Payment gateways, SMS services, external APIs

---

## Development Environment Setup

### Prerequisites
- PHP 7.3+ (with extensions: mbstring, openssl, PDO, Tokenizer, XML, JSON)
- Node.js 12+ and NPM
- MySQL 5.7+ or MariaDB 10.3+
- Redis (optional, for queues)
- Composer 2.0+

### Installation Steps

1. **Clone and Install Dependencies**
```bash
git clone <repository-url>
cd kap
composer install
npm install
```

2. **Environment Configuration**
```bash
cp .env.example .env
php artisan key:generate
```

3. **Database Setup**
```bash
# Create database
mysql -u root -p -e "CREATE DATABASE kap_gold;"

# Run migrations
php artisan migrate

# Seed database
php artisan db:seed
```

4. **Build Assets**
```bash
npm run dev          # Development
npm run watch        # Watch for changes
npm run prod         # Production
```

5. **Development Server**
```bash
php artisan serve
php artisan queue:work    # For background jobs
```

### Environment Variables (.env)
```env
APP_NAME="KAP Gold Trading"
APP_ENV=local
APP_DEBUG=true
APP_URL=http://localhost:8000

DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_DATABASE=kap_gold
DB_USERNAME=root
DB_PASSWORD=

# Payment Gateway
TOYYIBPAY_API_KEY=your_api_key
TOYYIBPAY_CATEGORY_CODE=your_category_code

# SMS Service
ESMS_API_KEY=your_esms_key
ESMS_USERNAME=your_username
ESMS_PASSWORD=your_password

# WebSocket
PUSHER_APP_ID=your_app_id
PUSHER_APP_KEY=your_app_key
PUSHER_APP_SECRET=your_app_secret
PUSHER_APP_CLUSTER=mt1
```

---

## Authentication & Authorization

### User Role System
```php
// User roles in database
1 => 'Administrator'
2 => 'Master Dealer'
3 => 'Premium Agent (Agent)'
4 => 'Agent (User registration default)'
5 => 'Retail - VVIP'
6 => 'Retail - Public'
```

### Authentication Flow
1. **Registration**: Creates user with role=4, requires referral code
2. **OTP Verification**: SMS-based verification via eSMS API
3. **Profile Completion**: Required before system access
4. **Screening**: Admin approval process for full access

### Key Models
- **User**: Core authentication entity
- **Roles**: Role definitions
- **Profile_personal**: Personal information
- **Profile_bank_info**: Banking details
- **ReferralCode**: Referral tracking

### Middleware Stack
```php
// Route protection layers
'auth' => Authenticate::class,
'auth.admin' => AuthAdmin::class,
'verified.otp' => VerifiedOTP::class,
'passScreen' => PassScreening::class,
```

### Security Implementation
```php
// User model role checks
public function isAdminKAP(): bool
{
    return $this->client == 2 && $this->role == 1;
}

public function isAgentKAP(): bool
{
    return $this->client == 2 && $this->role == 3;
}

public function isUserKAP(): bool
{
    return $this->client == 2 && $this->role == 4;
}
```

---

## Core Business Logic

### Main Business Entities

#### Gold Trading System
- **Goldbar**: Physical gold inventory with weight tracking
- **GoldbarOwnership**: User ownership of gold portions
- **GoldbarOwnershipPending**: Pending ownership transfers
- **MarketPrice**: Current market pricing
- **SpotGoldPricing**: Weight-based pricing tiers

#### Commission System
- **CommissionRate**: Base commission rates
- **CommissionDetail**: Individual commission records
- **CommissionRateKap**: KAP-specific rates
- **CommissionDetailKap**: KAP commission tracking

#### Inventory Management
- **InvItem**: Product catalog
- **InvMaster**: Individual item instances
- **InvMovement**: Stock movement tracking
- **InvCart**: Shopping cart functionality

### Business Processes

#### Gold Purchase Flow
```php
// 1. Add to cart
InvCart::create([
    'user_id' => $user->id,
    'item_id' => $item->id,
    'quantity' => $quantity,
    'price' => $calculated_price
]);

// 2. Payment processing
$payment = ToyyibPay::createBill([
    'amount' => $total_amount,
    'reference' => $unique_reference
]);

// 3. Create pending ownership
GoldbarOwnershipPending::create([
    'user_id' => $user->id,
    'weight' => $weight,
    'bought_price' => $price,
    'status' => 2 // Pending
]);

// 4. Reserve gold
$goldbar->update([
    'weight_on_hold' => $goldbar->weight_on_hold + $weight
]);
```

#### Commission Calculation
```php
// Agent commission reduces purchase price
$commission = CommissionRate::where('item_id', $item->id)->first();
$final_price = $market_price - $commission->agent_rate;

// Spot gold pricing
$spot_percentage = SpotGoldPricing::getPercentage($weight);
$spot_price = ($market_price + ($market_price * $spot_percentage)) * $weight;
```

### Ar-Rahnu (Islamic Pawn) System
- **Separate SQL Server Database** (arrahnudb)
- **Quarterly payment structure**
- **Auction system for defaults**
- **Branch-based operations**
- **Sharia-compliant processes**

---

## Payment Integration Systems

### ToyyibPay Integration
**Primary Malaysian payment gateway**

#### Configuration
```php
// config/toyyibpay.php
'api_key' => env('TOYYIBPAY_API_KEY'),
'category_code' => env('TOYYIBPAY_CATEGORY_CODE'),
'endpoint' => 'https://dev.toyyibpay.com/index.php/api/createBill'
```

#### Bill Creation
```php
// ToyyibpayController@createBill
$bill = [
    'userSecretKey' => config('toyyibpay.api_key'),
    'categoryCode' => config('toyyibpay.category_code'),
    'billName' => 'Gold Purchase',
    'billDescription' => 'Digital Gold Purchase',
    'billAmount' => $amount,
    'billReturnUrl' => route('toyyibpay-status'),
    'billCallbackUrl' => route('toyyibpay-callback'),
    'billPayorEmail' => $user->email
];
```

#### Callback Processing
```php
// Callback endpoints
Route::post('toyyibpay-callback', [ToyyibpayController::class, 'callback']);
Route::post('toyyibpay-callback-mint', [ToyyibpayController::class, 'callbackMint']);
Route::post('toyyibpay-callbackConv', [ToyyibpayController::class, 'callbackConv']);
```

### Snap N Pay Integration
**Alternative payment provider**

#### Configuration
```php
// Production endpoint
'endpoint' => 'https://prod.snapnpay.co/payments/api'
```

### 🚨 **CRITICAL SECURITY ISSUE** 
**Payment callback endpoints lack cryptographic signature verification, making them vulnerable to spoofing attacks.**

---

## Frontend Architecture (Livewire)

### Component Structure
```
app/Http/Livewire/
├── Auth/                    # Authentication components
│   ├── Login.php
│   ├── Register.php
│   └── VerifyOtp.php
├── Page/                    # Main application pages
│   ├── Admin/              # Admin interface
│   ├── DigitalGold/        # Gold trading
│   ├── PhysicalGold/       # Physical gold conversion
│   ├── Cart/               # Shopping cart
│   ├── Lelongan/          # Auction system
│   └── Reporting/         # Business intelligence
```

### Key Livewire Components

#### Digital Gold Trading
```php
// DigitalGold.php - Main trading interface
class DigitalGold extends Component
{
    public $userGold, $portfolio, $marketPrice;
    
    public function mount()
    {
        $this->userGold = GoldbarOwnership::where('user_id', auth()->id())
                                         ->where('active_ownership', 1)
                                         ->sum('weight');
    }
    
    public function render()
    {
        return view('livewire.page.digital-gold.digital-gold');
    }
}
```

#### Real-time Auction System
```php
// Lelongan.php - Auction bidding
class Lelongan extends Component
{
    public $currentBid, $bidAmount;
    
    public function placeBid()
    {
        // Real-time bid processing
        event(new BidPlaced($this->bidAmount, auth()->user()));
    }
}
```

### Frontend Technologies
- **Tailwind CSS**: Utility-first CSS framework
- **Alpine.js**: Lightweight JavaScript framework
- **ApexCharts**: Data visualization
- **WebSockets**: Real-time features (auctions, notifications)

---

## Database Schema & Relationships

### Core Tables

#### User Management
```sql
CREATE TABLE users (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    role INT NOT NULL DEFAULT 4,
    type INT NOT NULL DEFAULT 1,
    client INT NOT NULL DEFAULT 2,
    active TINYINT NOT NULL DEFAULT 1,
    otp_verified_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### Gold Trading
```sql
CREATE TABLE goldbar (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    guid VARCHAR(255) UNIQUE,
    bought_price DECIMAL(10,2),
    total_weight DECIMAL(10,2),
    weight_occupied DECIMAL(10,2) DEFAULT 0,
    weight_on_hold DECIMAL(10,2) DEFAULT 0,
    weight_vacant DECIMAL(10,2),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE goldbar_ownership (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    user_id BIGINT,
    goldbar_id BIGINT,
    weight DECIMAL(10,2),
    bought_price DECIMAL(10,2),
    active_ownership TINYINT DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### 🚨 **CRITICAL DATABASE ISSUE**
**Missing foreign key constraints across all tables, risking data integrity**

### Key Relationships
```php
// User Model relationships
public function goldOwnership()
{
    return $this->hasMany(GoldbarOwnership::class);
}

public function upline()
{
    return $this->hasOne(UserUpline::class);
}

public function downlines()
{
    return $this->hasMany(UserDownline::class);
}
```

---

## API Endpoints & Routes

### Web Routes Structure
```php
// Guest routes
Route::middleware('guest')->group(function () {
    Route::get('login', Login::class)->name('login');
    Route::get('register/{code}', Register::class)->name('register');
    Route::post('toyyibpay-callback', [ToyyibpayController::class, 'callback']);
});

// Authenticated routes
Route::middleware('auth')->group(function () {
    Route::middleware(['passScreen', 'verified.otp'])->group(function () {
        Route::get('home', [DashboardController::class, 'index'])->name('home');
        Route::get('digital-gold', [DigitalGoldController::class, 'index']);
        Route::get('physical-gold', [PhysicalGoldController::class, 'index']);
    });
    
    // Admin routes
    Route::middleware('auth.admin')->group(function () {
        Route::get('admin/user-management', UserManagement::class);
        Route::get('reporting/gold-report', GoldReport::class);
    });
});
```

### API Endpoints
```php
// api.php
Route::post('/login', [AuthController::class, 'login']);
Route::post('/register', [AuthController::class, 'register']);
Route::get('/market-price', [MarketPriceController::class, 'index']);

Route::middleware('auth:sanctum')->group(function () {
    Route::post('/logout', [AuthController::class, 'logout']);
});
```

---

## Critical Security Issues

### 🔴 **IMMEDIATE ACTION REQUIRED**

#### 1. SQL Injection Vulnerabilities
**File**: `app/Http/Controllers/ReportingController.php`
**Lines**: 53-59, 74-82, 84-92
```php
// VULNERABLE CODE
$data = DB::select("select user_id, CAST(YEAR(created_at) AS VARCHAR(4)) + '-' + CAST(MONTH(created_at) AS VARCHAR(2)) AS date, SUM(commission) AS commission, status
                    FROM commission_detail_kaps
                    where user_id = '".$agent."'
                        and CAST (created_at as date) >= '". $date->startOfMonth()->toDateString() . "'");
```

**Fix Required**: Use parameterized queries
```php
// SECURE CODE
$data = DB::select("SELECT user_id, CAST(YEAR(created_at) AS VARCHAR(4)) + '-' + CAST(MONTH(created_at) AS VARCHAR(2)) AS date, SUM(commission) AS commission, status
                    FROM commission_detail_kaps
                    WHERE user_id = ?
                        AND CAST(created_at AS DATE) >= ?", [$agent, $date->startOfMonth()->toDateString()]);
```

#### 2. Payment Callback Vulnerabilities
**File**: `app/Http/Controllers/ToyyibpayController.php`
**Issue**: No signature verification for payment callbacks

**Fix Required**: Implement webhook signature validation
```php
public function callback(Request $request)
{
    // Verify webhook signature
    $signature = $request->header('X-Signature');
    $payload = $request->getContent();
    $expectedSignature = hash_hmac('sha256', $payload, config('toyyibpay.webhook_secret'));
    
    if (!hash_equals($signature, $expectedSignature)) {
        return response()->json(['error' => 'Invalid signature'], 401);
    }
    
    // Process payment...
}
```

#### 3. Authorization Bypass
**File**: `app/Http/Controllers/ProfileController.php`
**Lines**: 24-33, 35-44
```php
// VULNERABLE CODE
public function deleteIcFront($id)
{
    Profile_personal::where('user_id', $id)->update([
        'ic_front' => NULL,
    ]);
}
```

**Fix Required**: Add authorization check
```php
// SECURE CODE
public function deleteIcFront($id)
{
    $user = auth()->user();
    if ($user->id != $id && !$user->isAdminKAP()) {
        abort(403, 'Unauthorized');
    }
    
    Profile_personal::where('user_id', $id)->update([
        'ic_front' => NULL,
    ]);
}
```

#### 4. CSRF Protection Bypass
**File**: `app/Http/Middleware/VerifyCsrfToken.php`
**Issue**: Critical payment endpoints excluded from CSRF protection

**Fix Required**: Implement alternative protection for payment callbacks
```php
// Use signed URLs or token validation for payment callbacks
protected $except = [
    // Remove payment endpoints
];
```

#### 5. Database Foreign Key Constraints Missing
**All Migration Files**
**Issue**: No foreign key constraints defined

**Fix Required**: Add foreign key constraints
```php
// In migrations
Schema::table('goldbar_ownership', function (Blueprint $table) {
    $table->foreign('user_id')->references('id')->on('users')->onDelete('cascade');
    $table->foreign('goldbar_id')->references('id')->on('goldbar')->onDelete('cascade');
});
```

---

## Deployment Guide

### Production Environment Setup

#### Server Requirements
- **PHP 8.0+** with required extensions
- **MySQL 8.0+** or MariaDB 10.5+
- **Redis** for caching and queues
- **Nginx/Apache** web server
- **SSL certificate** (required for payment gateways)

#### Deployment Steps

1. **Server Preparation**
```bash
# Install dependencies
sudo apt update
sudo apt install php8.0-fpm php8.0-mysql php8.0-redis nginx redis-server

# Configure PHP
sudo nano /etc/php/8.0/fpm/php.ini
# Set memory_limit = 256M
# Set upload_max_filesize = 10M
```

2. **Application Deployment**
```bash
# Clone repository
git clone <repo-url> /var/www/kap-gold
cd /var/www/kap-gold

# Install dependencies
composer install --no-dev --optimize-autoloader
npm install && npm run production

# Set permissions
sudo chown -R www-data:www-data /var/www/kap-gold
sudo chmod -R 755 /var/www/kap-gold/storage
sudo chmod -R 755 /var/www/kap-gold/bootstrap/cache
```

3. **Environment Configuration**
```env
APP_ENV=production
APP_DEBUG=false
APP_URL=https://your-domain.com

# Database
DB_CONNECTION=mysql
DB_HOST=localhost
DB_DATABASE=kap_gold_prod
DB_USERNAME=kap_user
DB_PASSWORD=secure_password

# Cache & Queue
CACHE_DRIVER=redis
QUEUE_CONNECTION=redis
SESSION_DRIVER=redis

# Mail
MAIL_MAILER=smtp
MAIL_HOST=your-smtp-server
MAIL_PORT=587
MAIL_USERNAME=your-email
MAIL_PASSWORD=your-password
MAIL_ENCRYPTION=tls
```

4. **Database Migration**
```bash
# Run migrations
php artisan migrate --force

# Seed production data
php artisan db:seed --class=ProductionSeeder
```

5. **Queue Workers**
```bash
# Install supervisor
sudo apt install supervisor

# Create worker configuration
sudo nano /etc/supervisor/conf.d/kap-worker.conf
```

```ini
[program:kap-worker]
process_name=%(program_name)s_%(process_num)02d
command=php /var/www/kap-gold/artisan queue:work redis --sleep=3 --tries=3
autostart=true
autorestart=true
user=www-data
numprocs=2
redirect_stderr=true
stdout_logfile=/var/www/kap-gold/storage/logs/worker.log
```

6. **Web Server Configuration**
```nginx
server {
    listen 80;
    server_name your-domain.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name your-domain.com;
    root /var/www/kap-gold/public;

    ssl_certificate /path/to/certificate.pem;
    ssl_certificate_key /path/to/private.key;

    add_header X-Frame-Options "SAMEORIGIN";
    add_header X-Content-Type-Options "nosniff";

    index index.php;

    charset utf-8;

    location / {
        try_files $uri $uri/ /index.php?$query_string;
    }

    location = /favicon.ico { access_log off; log_not_found off; }
    location = /robots.txt  { access_log off; log_not_found off; }

    error_page 404 /index.php;

    location ~ \.php$ {
        fastcgi_pass unix:/var/run/php/php8.0-fpm.sock;
        fastcgi_param SCRIPT_FILENAME $realpath_root$fastcgi_script_name;
        include fastcgi_params;
    }

    location ~ /\.(?!well-known).* {
        deny all;
    }
}
```

### Monitoring & Maintenance

#### Log Management
```bash
# Set up log rotation
sudo nano /etc/logrotate.d/kap-gold
```

```
/var/www/kap-gold/storage/logs/*.log {
    daily
    missingok
    rotate 30
    compress
    delaycompress
    notifempty
    create 644 www-data www-data
}
```

#### Health Checks
```bash
# Create health check endpoint
Route::get('/health', function () {
    return response()->json([
        'status' => 'healthy',
        'database' => DB::connection()->getPdo() ? 'connected' : 'disconnected',
        'cache' => Cache::get('health_check') ? 'working' : 'failed',
        'queue' => Queue::size() < 1000 ? 'normal' : 'high',
        'timestamp' => now()
    ]);
});
```

---

## Maintenance & Support

### Regular Maintenance Tasks

#### Daily Tasks
- Monitor application logs (`storage/logs/laravel.log`)
- Check queue job status
- Verify payment gateway connections
- Review failed transactions

#### Weekly Tasks
- Database backup and verification
- Security log review
- Performance monitoring
- User feedback review

#### Monthly Tasks
- Security updates and patches
- Database optimization
- Code quality review
- Performance analysis

### Development Workflow

#### Code Standards
- **PSR-12** PHP coding standards
- **Blade** template formatting
- **Consistent naming** conventions
- **Comprehensive commenting**

#### Testing Strategy
```bash
# Run tests
php artisan test

# Coverage report
php artisan test --coverage

# Specific test suites
php artisan test --testsuite=Feature
php artisan test --testsuite=Unit
```

#### Git Workflow
```bash
# Feature development
git checkout -b feature/new-feature
git commit -m "Add new feature"
git push origin feature/new-feature

# Create pull request
# Code review required
# Merge to development
# Deploy to staging
# Test and approve
# Merge to main
# Deploy to production
```

### Emergency Procedures

#### Security Incident Response
1. **Immediate**: Disable affected endpoints
2. **Assess**: Determine scope and impact
3. **Contain**: Prevent further damage
4. **Investigate**: Root cause analysis
5. **Recover**: Restore normal operations
6. **Document**: Incident report and lessons learned

#### Payment Gateway Failure
1. **Monitor**: Set up alerts for payment failures
2. **Fallback**: Implement alternative payment methods
3. **Communication**: Notify users of issues
4. **Recovery**: Resume normal operations
5. **Analysis**: Review failure patterns

### Support Contacts

#### Technical Support
- **Application**: Internal development team
- **Database**: Database administrator
- **Infrastructure**: DevOps team
- **Security**: Security team

#### Business Support
- **Payment Issues**: ToyyibPay support, Snap N Pay support
- **SMS Issues**: eSMS support
- **Business Logic**: Business analyst
- **User Support**: Customer service team

---

## Final Notes

This application handles sensitive financial data and requires:
- **Regular security audits**
- **Compliance with Malaysian financial regulations**
- **Proper backup and disaster recovery procedures**
- **Comprehensive monitoring and alerting**
- **Staff training on security best practices**

### Immediate Actions Required
1. **Fix SQL injection vulnerabilities** (CRITICAL)
2. **Implement payment callback signature verification** (CRITICAL)
3. **Add foreign key constraints** (HIGH)
4. **Enhance authorization checks** (HIGH)
5. **Implement comprehensive logging** (MEDIUM)

### Recommended Next Steps
1. **Security audit** by external firm
2. **Penetration testing**
3. **Code review** and refactoring
4. **Performance optimization**
5. **Comprehensive testing suite**

This documentation provides a complete overview of the KAP Gold Trading Platform. For specific implementation details, refer to the source code and Laravel documentation.

---

**Document Version**: 1.0  
**Last Updated**: 2025-01-09  
**Prepared By**: Claude Code Analysis  
**Review Required**: Senior Developer, Security Team, Business Analyst