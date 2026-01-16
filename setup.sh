#!/bin/bash
# GutenBot MVP - Bootstrap Script
# Run this to initialize the project structure

set -e

echo "🤖 GutenBot MVP Setup"
echo "====================="

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check prerequisites
echo -e "\n${YELLOW}Checking prerequisites...${NC}"

if ! command -v node &> /dev/null; then
    echo "❌ Node.js is required but not installed."
    exit 1
fi

NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo "❌ Node.js 18+ is required. Current: $(node -v)"
    exit 1
fi

echo "✅ Node.js $(node -v)"
echo "✅ npm $(npm -v)"

# Create directory structure
echo -e "\n${YELLOW}Creating directory structure...${NC}"

mkdir -p src/{app/{api/{ocr,analyze,generate,send},onboarding,scan,analysis,compose,history},components/{ui,onboarding,scanner,analysis,compose},lib/{ocr,llm,legal,utils},data/{bundeslaender,templates},hooks,store,types}
mkdir -p public/icons
mkdir -p tests/fixtures

echo "✅ Directory structure created"

# Install dependencies
echo -e "\n${YELLOW}Installing dependencies...${NC}"
npm install

echo "✅ Dependencies installed"

# Create essential config files
echo -e "\n${YELLOW}Creating configuration files...${NC}"

# .env.example
cat > .env.example << 'EOF'
# Anthropic API (required)
ANTHROPIC_API_KEY=sk-ant-api03-xxx

# Google Cloud Vision (optional fallback)
GOOGLE_APPLICATION_CREDENTIALS=
GOOGLE_CLOUD_PROJECT=

# Email sending (required for send feature)
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_USER=
SMTP_PASS=
SMTP_FROM=noreply@gutenbot.de

# App configuration
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_APP_NAME=GutenBot
EOF

# .gitignore
cat > .gitignore << 'EOF'
# Dependencies
node_modules/
.pnp
.pnp.js

# Build
.next/
out/
build/
dist/

# Testing
coverage/

# Misc
.DS_Store
*.pem
.env
.env.local
.env.*.local

# Debug
npm-debug.log*
yarn-debug.log*
yarn-error.log*

# Vercel
.vercel

# TypeScript
*.tsbuildinfo
next-env.d.ts

# PWA
public/sw.js
public/workbox-*.js
EOF

# next.config.js
cat > next.config.js << 'EOF'
const withPWA = require('next-pwa')({
  dest: 'public',
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === 'development',
});

/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverComponentsExternalPackages: ['tesseract.js'],
  },
};

module.exports = withPWA(nextConfig);
EOF

# tsconfig.json
cat > tsconfig.json << 'EOF'
{
  "compilerOptions": {
    "lib": ["dom", "dom.iterable", "esnext"],
    "allowJs": true,
    "skipLibCheck": true,
    "strict": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true,
    "plugins": [{ "name": "next" }],
    "paths": {
      "@/*": ["./src/*"]
    }
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules"]
}
EOF

# tailwind.config.js
cat > tailwind.config.js << 'EOF'
/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ["class"],
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
}
EOF

# postcss.config.js
cat > postcss.config.js << 'EOF'
module.exports = {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
}
EOF

echo "✅ Configuration files created"

# Create placeholder files for Next.js
echo -e "\n${YELLOW}Creating initial app files...${NC}"

# src/app/layout.tsx
cat > src/app/layout.tsx << 'EOF'
import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'GutenBot - Dein Behördenbrief-Assistent',
  description: 'Verstehe und beantworte Behördenbriefe mit KI-Unterstützung',
  manifest: '/manifest.json',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  themeColor: '#1a1a2e',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="de">
      <body className={inter.className}>{children}</body>
    </html>
  );
}
EOF

# src/app/globals.css
cat > src/app/globals.css << 'EOF'
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  :root {
    --background: 0 0% 100%;
    --foreground: 222.2 84% 4.9%;
    --card: 0 0% 100%;
    --card-foreground: 222.2 84% 4.9%;
    --primary: 222.2 47.4% 11.2%;
    --primary-foreground: 210 40% 98%;
    --secondary: 210 40% 96.1%;
    --secondary-foreground: 222.2 47.4% 11.2%;
    --muted: 210 40% 96.1%;
    --muted-foreground: 215.4 16.3% 46.9%;
    --accent: 210 40% 96.1%;
    --accent-foreground: 222.2 47.4% 11.2%;
    --destructive: 0 84.2% 60.2%;
    --destructive-foreground: 210 40% 98%;
    --border: 214.3 31.8% 91.4%;
    --input: 214.3 31.8% 91.4%;
    --ring: 222.2 84% 4.9%;
    --radius: 0.5rem;
  }

  .dark {
    --background: 222.2 84% 4.9%;
    --foreground: 210 40% 98%;
    --card: 222.2 84% 4.9%;
    --card-foreground: 210 40% 98%;
    --primary: 210 40% 98%;
    --primary-foreground: 222.2 47.4% 11.2%;
    --secondary: 217.2 32.6% 17.5%;
    --secondary-foreground: 210 40% 98%;
    --muted: 217.2 32.6% 17.5%;
    --muted-foreground: 215 20.2% 65.1%;
    --accent: 217.2 32.6% 17.5%;
    --accent-foreground: 210 40% 98%;
    --destructive: 0 62.8% 30.6%;
    --destructive-foreground: 210 40% 98%;
    --border: 217.2 32.6% 17.5%;
    --input: 217.2 32.6% 17.5%;
    --ring: 212.7 26.8% 83.9%;
  }
}

@layer base {
  * {
    @apply border-border;
  }
  body {
    @apply bg-background text-foreground;
  }
}
EOF

# src/app/page.tsx (landing page)
cat > src/app/page.tsx << 'EOF'
import Link from 'next/link';

export default function Home() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-8">
      <div className="text-center max-w-2xl">
        <h1 className="text-4xl font-bold mb-4">
          🤖 GutenBot
        </h1>
        <p className="text-xl text-muted-foreground mb-8">
          Dein intelligenter Assistent für Behördenbriefe
        </p>
        <p className="text-muted-foreground mb-8">
          Scanne einen Brief, verstehe deine Optionen, 
          und antworte mit einem Klick.
        </p>
        <Link 
          href="/onboarding"
          className="inline-flex items-center justify-center rounded-md bg-primary px-8 py-3 text-lg font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
        >
          Jetzt starten →
        </Link>
      </div>
    </main>
  );
}
EOF

# PWA manifest
cat > public/manifest.json << 'EOF'
{
  "name": "GutenBot - Behördenbrief-Assistent",
  "short_name": "GutenBot",
  "description": "Verstehe und beantworte Behördenbriefe mit KI-Unterstützung",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#ffffff",
  "theme_color": "#1a1a2e",
  "orientation": "portrait",
  "icons": [
    {
      "src": "/icons/icon-192.png",
      "sizes": "192x192",
      "type": "image/png",
      "purpose": "any maskable"
    },
    {
      "src": "/icons/icon-512.png",
      "sizes": "512x512",
      "type": "image/png",
      "purpose": "any maskable"
    }
  ]
}
EOF

echo "✅ Initial app files created"

# Copy .env.example to .env.local
if [ ! -f .env.local ]; then
    cp .env.example .env.local
    echo "✅ Created .env.local (remember to add your API keys!)"
fi

# Final instructions
echo -e "\n${GREEN}=====================${NC}"
echo -e "${GREEN}✅ Setup complete!${NC}"
echo -e "${GREEN}=====================${NC}"
echo ""
echo "Next steps:"
echo "1. Add your ANTHROPIC_API_KEY to .env.local"
echo "2. Run 'npm run dev' to start development"
echo "3. Follow AGENT_INSTRUCTIONS.md for implementation"
echo ""
echo "Project structure:"
echo "  PLAN.md              - Architecture & decisions"
echo "  AGENT_INSTRUCTIONS.md - Task-by-task execution guide"
echo "  src/                 - Application code"
echo ""
echo -e "${YELLOW}Tip: Feed PLAN.md and AGENT_INSTRUCTIONS.md to your coding agent${NC}"
