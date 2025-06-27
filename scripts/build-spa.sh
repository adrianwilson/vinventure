#!/bin/bash

# Build SPA script - temporarily moves API routes during static export build

echo "Building VinVenture SPA..."

# Store the current directory
PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
API_DIR="$PROJECT_ROOT/apps/web/src/app/api"
BACKUP_DIR="$PROJECT_ROOT/api-backup-temp"

echo "Project root: $PROJECT_ROOT"

# Check if API directory exists
if [ -d "$API_DIR" ]; then
    echo "Moving API routes temporarily..."
    mv "$API_DIR" "$BACKUP_DIR"
else
    echo "No API directory found, continuing with build..."
fi

# Build the static export
echo "Building Next.js static export..."
cd "$PROJECT_ROOT/apps/web"
npm run build

# Check if build was successful
if [ $? -eq 0 ]; then
    echo "Build successful!"
    
    echo "Static build ready in dist/apps/web/"
else
    echo "Build failed!"
fi

# Restore API routes
if [ -d "$BACKUP_DIR" ]; then
    echo "Restoring API routes..."
    mv "$BACKUP_DIR" "$API_DIR"
else
    echo "No API backup to restore"
fi

echo "SPA build complete!"