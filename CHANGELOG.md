# Changelog

All notable changes to the Blockendance project will be documented in this file.

## [Unreleased]

### Added
- **Security Improvements**
  - Upgraded password hashing from SHA-256 to bcrypt for secure password storage
  - Added SECRET_KEY validation for production environments
  - Automatic password hash migration from legacy SHA-256 to bcrypt

- **API Enhancements**
  - Added `/api/v1/attendance` endpoint for JSON-based attendance submission
  - Added `/api/v1/integrity` endpoint for blockchain integrity checking
  - Enhanced `/api/v1/records` with filtering by teacher, course, date, and year

- **Frontend Improvements**
  - Simplified attendance form with dropdowns for teachers, courses, and classes
  - Added class selection with pre-filled student lists
  - Checkbox-based attendance marking (checked = present, unchecked = absent)
  - Enhanced RecordsPage to show both present and absent students with color coding
  - Improved IntegrityPage with actual blockchain integrity verification
  - Removed authentication requirement from RecordsPage for public access

- **DevOps & Deployment**
  - Added Docker configuration for backend and frontend
  - Created docker-compose.yml for easy deployment
  - Set up GitHub Actions CI/CD pipeline
  - Added deployment documentation

- **Testing**
  - Created `test_flows.py` for end-to-end flow validation
  - Comprehensive test script for all core functionalities

### Changed
- **Password Security**: Migrated from SHA-256 to bcrypt hashing
- **API Responses**: Attendance submission now returns JSON instead of HTML
- **Records Display**: Shows all students (present and absent) with visual status indicators
- **Configuration**: Enhanced SECRET_KEY validation with production checks

### Fixed
- Fixed validator error in attendance submission
- Fixed RecordsPage not showing records (now uses API endpoint)
- Fixed search functionality to work without exact student count match
- Improved error handling in attendance submission

### Security
- ⚠️ **BREAKING**: Password hashing changed from SHA-256 to bcrypt
  - Existing users will need to re-authenticate (password hash will be migrated automatically)
  - New users will use bcrypt from the start

## [Previous Versions]

See git history for earlier changes.

