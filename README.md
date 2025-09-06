# WhatsApp Bot Server

A TypeScript-based WhatsApp Business API bot server with client-specific message handling flows.

## Features

- WhatsApp Business API webhook handling
- Client-specific message flows (currently BYB client)
- Order processing with customization flows
- Manager mode for customer support
- Payment integration support

## Setup

1. Install dependencies:

```bash
npm install
```

2. Create a `.env` file with the following variables:

```env
# WhatsApp Business API Configuration
WHATSAPP_TOKEN=your_whatsapp_access_token_here
WHATSAPP_VERIFY_TOKEN=your_webhook_verify_token_here
CATALOG_ID=your_catalog_id_here

# Server Configuration
PORT=3000

# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_NAME=byb_bot
DB_USER=postgres
DB_PASSWORD=your_password_here

# Crypto Configuration
CRYPTO_SECRET_KEY=your-32-character-secret-key-here
```

3. Set up the database:

```bash
# Create PostgreSQL database
createdb byb_bot

# Run migrations
npm run db:migrate
```

4. Run the development server:

```bash
npm run dev
```

5. Build for production:

```bash
npm run build
npm start
```

## Webhook Configuration

1. Set your webhook URL to: `https://your-domain.com/webhook`
2. Set the verify token to match your `WHATSAPP_VERIFY_TOKEN`
3. Subscribe to the following events:
   - messages
   - message_deliveries
   - message_reads

## Client Flows

### BYB Client

- Restaurant ordering system
- Product customization flows
- Order summary and payment
- Manager mode for customer support

## API Endpoints

- `GET /health` - Health check
- `GET /webhook` - Webhook verification
- `POST /webhook` - WhatsApp message webhook

## Project Structure

```
src/
├── types/           # TypeScript interfaces
├── services/        # Business logic services
│   ├── messages/    # WhatsApp message sending
│   ├── server/      # External server integration
│   └── manager/     # Manager mode handling
├── controllers/     # Webhook controllers
├── clients/         # Client-specific handlers
│   └── byb/         # BYB client implementation
└── db/              # Database layer (PostgreSQL with Knex)
```

```

## Development

The server uses TypeScript with Express. The main entry point is `server.ts` which sets up the webhook endpoints and routes messages to appropriate client handlers.

Each client has its own folder with:

- `index.ts` - Main handler logic
- `consts.ts` - Client-specific constants and data
```
