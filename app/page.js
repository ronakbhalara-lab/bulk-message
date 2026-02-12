'use client';

import { useState } from 'react';

export default function Home() {
  const [senderNumber] = useState('8866752088');
  const [recipientsText, setRecipientsText] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState([]);

  const parseRecipients = (text) => {
    const numbers = text
      .split(/[,\s]+/)
      .map(num => num.trim())
      .filter(num => num.length > 0);
    return [...new Set(numbers)];
  };

  const validatePhoneNumber = (number) => {
    const cleanNumber = number.replace(/[^0-9]/g, '');
    
    // Accept 10-digit numbers or 12-digit numbers starting with 91
    if (cleanNumber.length === 10) {
      return /^[0-9]{10}$/.test(cleanNumber);
    } else if (cleanNumber.length === 12 && cleanNumber.startsWith('91')) {
      return /^91[0-9]{10}$/.test(cleanNumber);
    }
    
    return false;
  };

  const formatPhoneNumber = (number) => {
    const cleanNumber = number.replace(/[^0-9]/g, '');
    
    if (cleanNumber.length === 10) {
      return cleanNumber; // Return 10-digit number
    } else if (cleanNumber.length === 12 && cleanNumber.startsWith('91')) {
      return cleanNumber.substring(2); // Remove 91 prefix, return last 10 digits
    }
    
    return number; // Return original if format is unexpected
  };

  const getValidRecipients = () => {
    const numbers = parseRecipients(recipientsText);
    const validNumbers = numbers.filter(num => validatePhoneNumber(num));
    const formattedNumbers = validNumbers.map(num => formatPhoneNumber(num));
    
    // Remove sender number from recipients
    return formattedNumbers.filter(num => num !== senderNumber);
  };

  const sendMessages = async () => {
    setLoading(true);
    setResults([]);
    
    const validNumbers = getValidRecipients();
    
    if (validNumbers.length === 0) {
      const allNumbers = parseRecipients(recipientsText);
      if (allNumbers.length > 0) {
        alert('All entered numbers are either invalid or same as sender number. Please add different valid phone numbers.');
      } else {
        alert('Please add at least one valid 10-digit phone number');
      }
      setLoading(false);
      return;
    }

    if (!message.trim()) {
      alert('Please enter a message');
      setLoading(false);
      return;
    }

    try {
      const response = await fetch('/api/send-bulk-message', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          senderNumber,
          recipientNumbers: validNumbers,
          message: message.trim()
        }),
      });

      const data = await response.json();
      
      if (response.ok) {
        setResults(data.results);
      } else {
        alert('Error sending messages: ' + data.error);
      }
    } catch (error) {
      alert('Network error: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold text-center text-gray-800 mb-8">
          Bulk Message Sender
        </h1>

        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-2xl font-semibold text-gray-700 mb-4">
            Sender Number
          </h2>
          <div className="px-4 py-3 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="text-lg font-medium text-blue-800">{senderNumber}</div>
            <div className="text-sm text-blue-600 mt-1">Messages will be sent from this number</div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-2xl font-semibold text-gray-700 mb-4">
            Recipient Numbers
          </h2>
          <textarea
            value={recipientsText}
            onChange={(e) => setRecipientsText(e.target.value)}
            placeholder="Enter phone numbers separated by commas or spaces...\n\nSupported formats:\n- 9876543210\n- +919876543210\n- 919876543210\n\nExample: 7574802254, +919876543210 9876543212"
            rows={6}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
          />
          <div className="mt-2 text-sm text-gray-600">
            {recipientsText.trim() ? (
              <div>
                Total numbers: {parseRecipients(recipientsText).length} | 
                Valid numbers: {getValidRecipients().length}
                <div className="mt-1 text-xs text-gray-500">
                  Supports: 9876543210, +919876543210, 919876543210
                </div>
              </div>
            ) : (
              <div>
                Enter phone numbers separated by commas or spaces
                <div className="text-xs text-gray-500 mt-1">
                  Supports: 9876543210, +919876543210, 919876543210
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-2xl font-semibold text-gray-700 mb-4">
            Message
          </h2>
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Enter your message here..."
            rows={6}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
          />
          <div className="mt-2 text-sm text-gray-600">
            Character count: {message.length}
          </div>
        </div>

        <div className="text-center">
          <button
            onClick={sendMessages}
            disabled={loading}
            className={`px-8 py-3 rounded-lg font-semibold transition-colors ${
              loading
                ? 'bg-gray-400 cursor-not-allowed'
                : 'bg-blue-500 text-white hover:bg-blue-600'
            }`}
          >
            {loading ? 'Sending Messages...' : 'Send Bulk Messages'}
          </button>
        </div>

        {results.length > 0 && (
          <div className="mt-8 bg-white rounded-lg shadow-md p-6">
            <h2 className="text-2xl font-semibold text-gray-700 mb-4">
              Sending Results
            </h2>
            <div className="space-y-2">
              {results.map((result, index) => (
                <div
                  key={index}
                  className={`p-3 rounded-lg ${
                    result.success
                      ? 'bg-green-100 text-green-800'
                      : 'bg-red-100 text-red-800'
                  }`}
                >
                  <div className="font-medium">
                    From: {senderNumber} To: {result.recipientNumber} - {result.success ? 'Success' : 'Failed'}
                  </div>
                  {!result.success && (
                    <div className="text-sm mt-1">{result.error}</div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}