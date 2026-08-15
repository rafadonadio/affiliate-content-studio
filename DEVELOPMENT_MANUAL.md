# Development & Operational Manual: Affiliate Content Studio

## 1. Project Overview
The **Affiliate Content Studio** is a full-stack application designed to automate the generation, management, and scheduling of social media content derived from Amazon affiliate product links.

## 2. Architecture
The application uses a modular full-stack architecture:
- **Frontend**: React 19 (SPA) with Tailwind CSS for styling, designed as a Progressive Web App (PWA).
- **Backend**: Express (Node.js) server running on TypeScript.
- **Persistence**: Local SQLite for operational logs and queues (expandable to MySQL for remote access).
- **AI Integration**: Server-side Gemini API (using `@google/genai`) for content generation.

## 3. Development Workflow
### Prerequisites
- Node.js (Latest LTS)
- NPM

### Installation
1. Clone the repository.
2. Run `npm install` to install dependencies.
3. Setup `.env` variables based on `.env.example`.

### Running in Development
- Run `npm run dev` to start the development server.

### Building for Production
- Run `npm run build` to compile the backend and build the frontend static assets.
- Run `npm start` to execute the production build.

## 4. Best Practices
- **Code Quality**: Keep modules small and focused.
- **Security**: All API keys MUST remain on the server (`server.ts`). Do not expose keys to the client.
- **Documentation**: Update this manual for any architectural changes.
- **UI/UX**: Follow Tailwind utility class patterns; avoid complex custom CSS files.

## 5. Roadmap & Pending Tasks (Evolucionado)
The following features are slated for future implementation to complete the core business requirements with enterprise-level depth:

- [x] **Interactive Calendar & Scheduling**: Implement drag-and-drop using `@hello-pangea/dnd` or `react-big-calendar`. Include timezone-aware scheduling and integrate a robust job queue (e.g., Redis/BullMQ) to replace basic SQLite for task management and retries.
- [x] **Manual Review Queue**: Introduce A/B Testing of AI-generated content (suggest 3 variants for user selection). Integrate a browser-based image editor to touch up AI images directly before approval.
- [x] **Push Notifications**: Real-time notifications via WebSockets (Socket.io or SSE) to alert users immediately when batch generation tasks complete, rather than basic polling or simple alerts.
- [x] **Automated Publishing**: Migrate from basic scripts to full OAuth2 authentication flows for Pinterest, Instagram, and YouTube to ensure long-lived tokens and handle network-specific rate-limiting gracefully.
- [x] **Performance Analytics**: Integrate real-time engagement webhooks from social networks. Implement an AI-powered predictive dashboard (via Gemini) to forecast ROI based on product history.
- [x] **Database & Persistence**: Support for remote MySQL/PostgreSQL with proper ORM (e.g., Prisma or Drizzle) to complement or replace the local SQLite setup, enabling distributed deployments.