# Environment Variables Setup Guide

## Quick Setup for OpenAI API Integration

To enable the AI-powered reports functionality, you need to create a `.env` file in the `backend` directory with the following variables:

### 1. Create the .env file

Create a file named `.env` in the `backend` directory with the following content:

```env
# Database Configuration
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=
DB_NAME=museosmart
DB_PORT=3306

# JWT Secret
JWT_SECRET=your_jwt_secret_key_here_change_this_in_production

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

# CORS Configuration
CORS_ORIGIN=http://localhost:5173
```

### 2. Get OpenAI API Key

1. Visit [OpenAI Platform](https://platform.openai.com/api-keys)
2. Sign up or log in to your OpenAI account
3. Navigate to "API Keys" section
4. Click "Create new secret key"
5. Copy the generated API key
6. Replace `your_openai_api_key_here` in the .env file with your actual API key

### 3. Update Database Configuration

Replace the database configuration values with your actual MySQL settings:
- `DB_USER`: Your MySQL username (usually 'root')
- `DB_PASSWORD`: Your MySQL password
- `DB_NAME`: Your database name (should be 'museosmart')

### 4. Test the Setup

After creating the .env file:

1. Start the backend server: `npm start`
2. Check the AI status in the admin dashboard
3. Try generating a report to test the AI functionality

## Features That Will Be Enabled

Once the .env file is configured:

✅ **AI-Powered Reports**
- Intelligent insights and analysis
- Predictive analytics
- Natural language report generation
- Real-time recommendations

✅ **Advanced Analytics**
- Visitor trend analysis
- Financial forecasting
- Event performance insights
- Staff productivity metrics

✅ **AI Chat Assistant**
- Natural language queries
- Quick action buttons
- Context-aware responses
- Report generation through conversation

## Troubleshooting

### Common Issues:

1. **"OpenAI API key not configured"**
   - Ensure the `OPENAI_API_KEY` is set in your `.env` file
   - Verify the API key is valid and has sufficient credits

2. **"Failed to check AI status"**
   - Check your internet connection
   - Verify the backend server is running
   - Check server logs for detailed error messages

3. **Database connection errors**
   - Verify MySQL is running
   - Check database credentials in .env file
   - Ensure the database exists

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

## Next Steps

After setting up the .env file:

1. Start the backend server
2. Navigate to the Reports section in the admin dashboard
3. Check the AI status indicator
4. Try generating a report to test the functionality
5. Use the AI chat to explore different report types

The system will automatically fall back to rule-based analysis if the OpenAI API is not configured or unavailable. 