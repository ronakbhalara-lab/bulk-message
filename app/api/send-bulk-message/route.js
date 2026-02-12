import { NextResponse } from 'next/server';
import twilio from 'twilio';

const SMS_PROVIDER = process.env.SMS_PROVIDER || 'mock';

function getTwilioClient() {
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  
  if (!accountSid || !authToken) {
    throw new Error('Twilio credentials not configured');
  }
  
  return twilio(accountSid, authToken);
}

export async function POST(request) {
  try {
    const { senderNumber, recipientNumbers, message } = await request.json();

    if (!senderNumber || typeof senderNumber !== 'string') {
      return NextResponse.json(
        { error: 'Sender number is required' },
        { status: 400 }
      );
    }

    if (!recipientNumbers || !Array.isArray(recipientNumbers) || recipientNumbers.length === 0) {
      return NextResponse.json(
        { error: 'Recipient numbers array is required' },
        { status: 400 }
      );
    }

    if (!message || typeof message !== 'string' || message.trim() === '') {
      return NextResponse.json(
        { error: 'Message is required' },
        { status: 400 }
      );
    }

    const results = [];

    for (const recipientNumber of recipientNumbers) {
      try {
        let result;
        
        if (SMS_PROVIDER === 'twilio') {
          result = await sendTwilioSMS(senderNumber, recipientNumber, message.trim());
        } else if (SMS_PROVIDER === 'fast2sms') {
          result = await sendFast2SMS(senderNumber, recipientNumber, message.trim());
        } else {
          result = await sendMockSMS(senderNumber, recipientNumber, message.trim());
        }
        
        results.push({
          recipientNumber,
          success: true,
          messageId: result.messageId,
          provider: SMS_PROVIDER,
          timestamp: new Date().toISOString()
        });
      } catch (error) {
        results.push({
          recipientNumber,
          success: false,
          error: error.message,
          provider: SMS_PROVIDER,
          timestamp: new Date().toISOString()
        });
      }
    }

    const successCount = results.filter(r => r.success).length;
    const failureCount = results.length - successCount;

    return NextResponse.json({
      success: true,
      senderNumber,
      provider: SMS_PROVIDER,
      totalRecipients: recipientNumbers.length,
      successCount,
      failureCount,
      results
    });

  } catch (error) {
    console.error('Bulk message API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

async function sendTwilioSMS(senderNumber, recipientNumber, message) {
  const client = getTwilioClient();
  const twilioPhoneNumber = process.env.TWILIO_PHONE_NUMBER;
  
  if (!twilioPhoneNumber) {
    throw new Error('Twilio phone number not configured');
  }

  const phoneRegex = /^[0-9]{10}$/;
  if (!phoneRegex.test(recipientNumber.replace(/\s/g, ''))) {
    throw new Error('Invalid recipient phone number format');
  }

  // Always format with +91 prefix for Twilio API
  const formattedRecipient = `+91${recipientNumber.replace(/\s/g, '')}`;
  
  try {
    const messageResult = await client.messages.create({
      body: message,
      from: twilioPhoneNumber,
      to: formattedRecipient
    });

    return {
      messageId: messageResult.sid,
      status: messageResult.status,
      provider: 'twilio'
    };
  } catch (error) {
    throw new Error(`Twilio error: ${error.message}`);
  }
}

async function sendFast2SMS(senderNumber, recipientNumber, message) {
  const apiKey = process.env.FAST2SMS_API_KEY;
  const senderId = process.env.FAST2SMS_SENDER_ID;
  
  if (!apiKey) {
    throw new Error('Fast2SMS API key not configured');
  }

  const phoneRegex = /^[0-9]{10}$/;
  if (!phoneRegex.test(recipientNumber.replace(/\s/g, ''))) {
    throw new Error('Invalid recipient phone number format');
  }

  // Fast2SMS expects 10-digit numbers without any prefix
  const cleanRecipient = recipientNumber.replace(/\s/g, '');

  try {
    const response = await fetch('https://www.fast2sms.com/dev/bulkV2', {
      method: 'POST',
      headers: {
        'authorization': apiKey,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        route: 'v3',
        sender_id: senderId || 'TXTIND',
        message: message,
        language: 'english',
        flash: 0,
        numbers: cleanRecipient
      })
    });

    const data = await response.json();
    
    if (data.return === true) {
      return {
        messageId: data.message_id?.[0] || `f2s_${Date.now()}`,
        status: 'sent',
        provider: 'fast2sms'
      };
    } else {
      throw new Error(data.message || 'Fast2SMS error');
    }
  } catch (error) {
    throw new Error(`Fast2SMS error: ${error.message}`);
  }
}

async function sendMockSMS(senderNumber, recipientNumber, message) {
  const phoneRegex = /^[0-9]{10}$/;
  if (!phoneRegex.test(recipientNumber.replace(/\s/g, ''))) {
    throw new Error('Invalid recipient phone number format');
  }

  if (!phoneRegex.test(senderNumber.replace(/\s/g, ''))) {
    throw new Error('Invalid sender phone number format');
  }

  await new Promise(resolve => setTimeout(resolve, 1000));

  const mockSuccess = Math.random() > 0.1;
  
  if (!mockSuccess) {
    throw new Error('Failed to send SMS - network error');
  }

  return {
    messageId: `mock_${Date.now()}_${senderNumber}_${recipientNumber}`,
    status: 'sent',
    delivered: true,
    provider: 'mock'
  };
}
