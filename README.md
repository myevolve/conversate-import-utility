# Conversate Import Utility

A powerful utility for importing contacts into Conversate AI from various file formats. This tool supports CSV, Excel, and JSON files, with intelligent field mapping and custom attribute support.

## Features

### File Support
- **Multiple Formats**: Import contacts from CSV, Excel (.xlsx, .xls), or JSON files
- **Batch Processing**: Upload and process multiple files simultaneously
- **Field Mapping**: Intelligent mapping of fields with auto-detection
- **Custom Attributes**: Support for custom fields and attributes

### Phone Number Handling
- **Smart Formatting**: Automatically formats phone numbers to the correct international format
- **Multiple Input Formats**:
  - US Format: (555) 555-1212 → +15555551212
  - International: +44 20 7123 4567 → +442071234567
  - Hyphenated: 1-987-654-3210 → +19876543210
  - Dotted: 555.444.3333 → +15554443333
- **Country Code Support**:
  - US/Canada (+1)
  - UK (+44)
  - Australia (+61)
  - New Zealand (+64)
  - China (+86)
  - India (+91)
  - And more...

### Progress Tracking
- Real-time progress bar
- Estimated time remaining
- Contact count tracking
- Success/failure statistics
- Detailed error reporting
- Downloadable error reports

### Custom Field Support
- Company Name
- Company Website
- Role
- Industry
- Flexible mapping for any additional fields

## Installation

### Using Docker (Recommended)

1. Clone the repository:
```bash
git clone https://github.com/myevolve/conversate-import-utility.git
cd conversate-import-utility
```

2. Run the setup script:
```bash
chmod +x setup.sh
./setup.sh
```

The setup script will:
- Install Docker if not present
- Install Docker Compose if not present
- Create a default .env file
- Build and start the containers
- Verify the application is running

### Manual Installation

1. Install dependencies:
```bash
npm install
```

2. Create .env file:
```bash
cp .env.example .env
```

3. Start the development server:
```bash
npm run dev
```

## Usage

1. **Select Account**: Choose the account where you want to import contacts

2. **Select Inbox**: Choose the target inbox for the imported contacts

3. **Upload Files**: 
   - Click "Select Files" or drag and drop your files
   - Supported formats: CSV, Excel (.xlsx, .xls), JSON

4. **Map Fields**:
   - Required fields will be auto-mapped when possible
   - Map any remaining fields to Conversate fields
   - Set custom attributes for additional fields

5. **Start Import**:
   - Click "Start Import" to begin the process
   - Monitor progress in real-time
   - View success/failure counts
   - Download error report if needed

## File Format Examples

### CSV
```csv
Name,Email,Phone,Company_Name,Company_Website,Role,Industry
John Doe,john@example.com,(555) 555-1212,Acme Inc,https://acme.example.com,CEO,Technology
```

### JSON
```json
[
  {
    "Name": "John Doe",
    "Email": "john@example.com",
    "Phone": "(555) 555-1212",
    "Company_Name": "Acme Inc",
    "Company_Website": "https://acme.example.com",
    "Role": "CEO",
    "Industry": "Technology"
  }
]
```

### Excel
Excel files should follow the same column structure as CSV files.

## Docker Configuration

### Environment Variables

Create a `.env` file with the following variables:

```env
PORT=3000
NEXT_PUBLIC_API_URL=http://your-api-url
```

### Docker Compose

The included `docker-compose.yml` provides:
- Automatic container restart
- Health checks
- Port mapping
- Environment variable support

### Running with Docker

Start the application:
```bash
docker-compose up -d
```

View logs:
```bash
docker-compose logs -f
```

Stop the application:
```bash
docker-compose down
```

## Error Handling

The utility provides detailed error reporting for:
- Duplicate emails
- Duplicate phone numbers
- Invalid phone formats
- Missing required fields
- API errors
- Validation errors

Error reports can be downloaded in CSV format for further analysis.

## Development

### Project Structure
```
conversate-import-utility/
├── src/
│   ├── app/              # Next.js pages
│   ├── components/       # React components
│   ├── lib/             # Utilities and helpers
│   └── styles/          # CSS and styling
├── public/              # Static assets
├── Dockerfile          # Docker configuration
├── docker-compose.yml  # Docker Compose configuration
├── setup.sh           # Installation script
└── package.json       # Project dependencies
```

### Running Tests
```bash
npm test
```

### Building for Production
```bash
npm run build
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## License

MIT License

## Support

For support, please contact support@conversate.ai