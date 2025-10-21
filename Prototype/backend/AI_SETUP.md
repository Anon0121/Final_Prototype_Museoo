# AI Integration Setup Guide

This guide explains how to set up the real AI integration for the museum management system's reports functionality.

## Overview

The system now includes real AI-powered report generation using OpenAI's GPT-3.5 model. This provides intelligent insights, trend analysis, and actionable recommendations for museum data.

## Setup Instructions

### 1. Get OpenAI API Key

1. Visit [OpenAI Platform](https://platform.openai.com/api-keys)
2. Sign up or log in to your OpenAI account
3. Navigate to "API Keys" section
4. Click "Create new secret key"
5. Copy the generated API key

### 2. Configure Environment Variables

Create a `.env` file in the `backend` directory with the following variables:

```env
# Database Configuration
DB_HOST=localhost
DB_USER=your_db_user
DB_PASSWORD=your_db_password
DB_NAME=your_database_name

# JWT Secret
JWT_SECRET=your_jwt_secret_key_here

# OpenAI API Configuration
OPENAI_API_KEY=your_openai_api_key_here

# Email Configuration (if using email features)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_email_password

# Server Configuration
PORT=5000
NODE_ENV=development
```

### 3. Install Dependencies

Run the following command in the `backend` directory:

```bash
npm install
```

This will install the OpenAI package along with other dependencies.

### 4. Test the Integration

1. Start the backend server: `npm start`
2. Navigate to the Reports section in the admin dashboard
3. Check the AI status indicator in the header
4. Generate a report to test the AI functionality

## Features

### AI-Powered Insights

The AI integration provides:

- **Executive Summaries**: Concise overviews of report data
- **Trend Analysis**: Identification of patterns and trends in the data
- **Actionable Recommendations**: Specific suggestions for improvement
- **Contextual Analysis**: Museum-specific insights and recommendations

### Report Types Supported

1. **Visitor Analytics**: Visitor behavior, demographics, and patterns
2. **Monthly Summary**: Comprehensive monthly overview
3. **Event Performance**: Event success metrics and analysis
4. **Financial Report**: Revenue and donation insights
5. **Exhibit Analytics**: Exhibit popularity and engagement
6. **Staff Performance**: Staff productivity and efficiency metrics

### Fallback Mode

If the OpenAI API is not configured or unavailable, the system automatically falls back to rule-based analysis, ensuring reports can still be generated.

## API Endpoints

### Check AI Status
```
GET /api/reports/ai-status
```
Returns the current status of the AI service.

### Generate Report
```
POST /api/reports/generate
```
Generates a new AI-powered report with the specified parameters.

## Troubleshooting

### Common Issues

1. **"OpenAI API key not configured"**
   - Ensure the `OPENAI_API_KEY` is set in your `.env` file
   - Verify the API key is valid and has sufficient credits

2. **"Failed to check AI status"**
   - Check your internet connection
   - Verify the backend server is running
   - Check server logs for detailed error messages

3. **"AI service is ready" but reports fail**
   - Check OpenAI API usage and billing
   - Verify the API key has the necessary permissions
   - Check server logs for API error details

### Cost Considerations

- OpenAI API usage is billed per token
- Each report generation typically uses 500-1000 tokens
- Monitor your OpenAI usage dashboard for cost tracking
- Consider implementing rate limiting for production use

## Security Notes

- Never commit your `.env` file to version control
- Keep your OpenAI API key secure and private
- Consider using environment-specific API keys for development/production
- Implement proper access controls for report generation

## Support

For issues with the AI integration:

1. Check the server logs for detailed error messages
2. Verify your OpenAI API key and account status
3. Test with a simple report generation first
4. Contact the development team for assistance

## Future Enhancements

Potential improvements for the AI integration:

- Support for additional AI providers (Google AI, Anthropic, etc.)
- Custom AI models trained on museum-specific data
- Real-time AI insights and alerts
- Advanced data visualization with AI-generated charts
- Multi-language support for international museums 