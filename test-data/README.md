# Test Data for Donor API Endpoints

This directory contains JSON test data files for testing the Donor API endpoints in Postman.

## Files

### Donor Endpoints

- `create-donor.json` - Sample data for POST `/api/v1/donors/create`
- `create-donor-2.json` - Alternative sample data for creating a donor
- `update-donor.json` - Sample data for PUT `/api/v1/donors/:id`
- `list-donors-query.json` - Query parameters for GET `/api/v1/donors`

### Donation List Endpoints

- `create-donation-list.json` - Sample data for POST `/api/v1/donors/donation-lists/create`
- `create-donation-list-2.json` - Alternative sample data for creating a donation list
- `update-donation-list.json` - Sample data for PUT `/api/v1/donors/donation-lists/:id`
- `list-donation-lists-query.json` - Query parameters for GET `/api/v1/donors/donation-lists`

## Notes

- IDs in the data are examples and may need to be adjusted based on your actual database state
- Dates are in ISO 8601 format
- Phone numbers follow international format with country code
- Email addresses are validated format
- Boolean values are true/false
- Arrays contain positive integer IDs

## Usage in Postman

1. For POST/PUT requests: Copy the JSON content and paste it in the request body (raw JSON)
2. For GET requests with query parameters: Use the JSON as reference for setting query params in Postman
3. Replace `:id` path parameters with actual IDs from your database