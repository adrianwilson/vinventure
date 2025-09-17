#!/bin/bash

# VinVenture Feature Branch Creator
# This script helps create feature branches following our GitHub Flow strategy

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Function to validate branch name
validate_branch_name() {
    local branch_name=$1
    
    # Check if branch name follows convention
    if [[ ! $branch_name =~ ^(feature|fix|hotfix|docs|refactor|test|chore)/.+ ]]; then
        print_error "Branch name must start with one of: feature/, fix/, hotfix/, docs/, refactor/, test/, chore/"
        return 1
    fi
    
    # Check for invalid characters
    if [[ $branch_name =~ [^a-z0-9/-] ]]; then
        print_error "Branch name can only contain lowercase letters, numbers, hyphens, and forward slashes"
        return 1
    fi
    
    return 0
}

# Function to get current branch
get_current_branch() {
    git branch --show-current
}

# Function to check if we're on main
check_main_branch() {
    local current_branch=$(get_current_branch)
    if [[ $current_branch != "main" ]]; then
        print_warning "You're currently on '$current_branch', not 'main'"
        read -p "Do you want to switch to main first? (y/n): " -n 1 -r
        echo
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            print_status "Switching to main branch..."
            git checkout main
        else
            print_error "Please switch to main branch manually and run this script again"
            exit 1
        fi
    fi
}

# Function to update main branch
update_main_branch() {
    print_status "Updating main branch..."
    git pull origin main
    print_success "Main branch updated"
}

# Function to create feature branch
create_feature_branch() {
    local branch_name=$1
    
    print_status "Creating feature branch: $branch_name"
    git checkout -b "$branch_name"
    print_success "Feature branch '$branch_name' created and checked out"
}

# Function to show next steps
show_next_steps() {
    local branch_name=$1
    
    echo
    print_success "Feature branch created successfully!"
    echo
    echo -e "${BLUE}Next steps:${NC}"
    echo "1. Make your changes and commit them:"
    echo "   git add ."
    echo "   git commit -m \"feat: your commit message\""
    echo
    echo "2. Push your branch to GitHub:"
    echo "   git push origin $branch_name"
    echo
    echo "3. Create a pull request:"
    echo "   - Go to https://github.com/your-org/vinventure/pulls"
    echo "   - Click 'New pull request'"
    echo "   - Select your branch and fill out the PR template"
    echo
    echo "4. Request reviews and wait for approval"
    echo
    echo "5. After merge, delete the feature branch:"
    echo "   git checkout main"
    echo "   git pull origin main"
    echo "   git branch -d $branch_name"
    echo "   git push origin --delete $branch_name"
}

# Main script logic
main() {
    echo -e "${BLUE}🚀 VinVenture Feature Branch Creator${NC}"
    echo "=================================="
    echo
    
    # Check if we're in a git repository
    if ! git rev-parse --git-dir > /dev/null 2>&1; then
        print_error "Not in a git repository. Please run this script from the project root."
        exit 1
    fi
    
    # Check if we're on main branch
    check_main_branch
    
    # Update main branch
    update_main_branch
    
    # Get branch name from user
    echo
    echo "Enter the feature branch name (e.g., feature/user-authentication, fix/payment-bug):"
    read -p "Branch name: " branch_name
    
    # Validate branch name
    if ! validate_branch_name "$branch_name"; then
        exit 1
    fi
    
    # Check if branch already exists
    if git show-ref --verify --quiet "refs/heads/$branch_name"; then
        print_error "Branch '$branch_name' already exists locally"
        exit 1
    fi
    
    if git show-ref --verify --quiet "refs/remotes/origin/$branch_name"; then
        print_error "Branch '$branch_name' already exists on remote"
        exit 1
    fi
    
    # Create the feature branch
    create_feature_branch "$branch_name"
    
    # Show next steps
    show_next_steps "$branch_name"
}

# Run main function
main "$@"
