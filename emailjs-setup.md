# EmailJS Setup Guide

## Step 1: Create EmailJS Account
1. Go to [EmailJS.com](https://www.emailjs.com/)
2. Sign up for a free account
3. Verify your email address

## Step 2: Create Email Service
1. Go to Email Services in your EmailJS dashboard
2. Click "Add New Service"
3. Choose your email provider (Gmail, Outlook, etc.)
4. Follow the setup instructions
5. Note down your **Service ID**

## Step 3: Create Email Template
1. Go to Email Templates in your EmailJS dashboard
2. Click "Create New Template"
3. Use this template structure:

\`\`\`html
Subject: Your Generated Code: {{user_prompt}}

Hello {{to_name}},

{{user_message}}

Here's your generated code:

\`\`\`
{{generated_code}}
\`\`\`

Best regards,
{{from_name}}
\`\`\`

4. Note down your **Template ID**

## Step 4: Get Public Key
1. Go to Account > General
2. Find your **Public Key**

## Step 5: Update Code Configuration
Replace these values in the code:

\`\`\`javascript
const EMAILJS_CONFIG = {
  publicKey: 'your_actual_public_key',    // From Step 4
  serviceId: 'your_actual_service_id',    // From Step 2  
  templateId: 'your_actual_template_id'   // From Step 3
}
\`\`\`

## Template Variables
Make sure your EmailJS template includes these variables:
- `{{to_name}}` - Recipient's name
- `{{to_email}}` - Recipient's email
- `{{from_name}}` - Sender name
- `{{user_prompt}}` - User's code request
- `{{generated_code}}` - The generated code
- `{{user_message}}` - Custom message

## Testing
Use the "Test Email" button in the app to verify your configuration works correctly.
