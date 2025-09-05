// Build script for production deployment
// This script prepares the application for deployment in AlmaLinux

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 Building Pet-Family for production...');

try {
  // Clean previous builds
  console.log('🧹 Cleaning previous builds...');
  if (fs.existsSync('dist')) {
    fs.rmSync('dist', { recursive: true, force: true });
  }

  // Build the application
  console.log('📦 Building TypeScript...');
  execSync('npx tsc', { stdio: 'inherit' });

  // Copy static files
  console.log('📋 Copying static files...');
  if (fs.existsSync('public')) {
    fs.cpSync('public', 'dist/public', { recursive: true });
  }

  // Copy package.json
  fs.copyFileSync('package.json', 'dist/package.json');

  // Create production environment file
  console.log('⚙️ Creating production environment template...');
  const envTemplate = `# Production Environment Configuration
DATABASE_URL="postgresql://petfamily:password@localhost:5432/petfamily_db"
SESSION_SECRET="your-secure-session-secret-here"
NODE_ENV=production
PORT=5000
UPLOAD_DIR=./uploads
PUBLIC_FILES_DIR=./public
`;

  fs.writeFileSync('dist/.env.example', envTemplate);

  console.log('✅ Build completed successfully!');
  console.log('📁 Build output: ./dist/');
  console.log('🔧 Next steps:');
  console.log('  1. Copy dist/ folder to your AlmaLinux server');
  console.log('  2. Run: cd dist && npm install --production');
  console.log('  3. Configure your .env file');
  console.log('  4. Initialize database with: psql -f ../database/init.sql');
  console.log('  5. Start: node server/index.js');

} catch (error) {
  console.error('❌ Build failed:', error.message);
  process.exit(1);
}