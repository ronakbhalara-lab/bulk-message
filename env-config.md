# Environment Configuration

Create a `.env.local` file in your project root with the following variables:

```bash
# Twilio Configuration
TWILIO_ACCOUNT_SID=ACd7c6f0bb9c53dde93c1f8416b75ee9ac
TWILIO_AUTH_TOKEN=d52271eafc482213844201d5879b06dd
TWILIO_PHONE_NUMBER=+15017122661  # Use a real Twilio number, not your personal number

# Alternative SMS Service (Fast2SMS)
FAST2SMS_API_KEY=your_fast2sms_api_key
FAST2SMS_SENDER_ID=your_sender_id

# SMS Provider Selection (twilio, fast2sms, or mock)
SMS_PROVIDER=mock  # Start with mock for testing
```

## Setup Instructions:

### For Twilio:
1. Sign up at https://www.twilio.com/
2. Get your Account SID and Auth Token from Console
3. **Purchase a Twilio phone number** (important - you can't use your personal number)
4. Add the Twilio number to `TWILIO_PHONE_NUMBER` (format: +15017122661)
5. Set `SMS_PROVIDER=twilio`

### For Fast2SMS (Indian Service):
1. Sign up at https://www.fast2sms.com/
2. Get your API key from dashboard
3. Add the credentials to `.env.local`
4. Set `SMS_PROVIDER=fast2sms`

### For Testing:
- Set `SMS_PROVIDER=mock` to test without sending real SMS
- No credits required, simulates sending with 90% success rate

## Important Notes:
- **Twilio**: You must purchase a Twilio phone number, cannot use personal numbers
- **Sender Display**: Your personal number (7574802254) is shown as sender for UI purposes
- **Actual Sending**: Real SMS comes from your Twilio/Fast2SMS number

Note: Create `.env.local` file manually as it's ignored by git for security.
