// FAQ Data Seeder via API
// This script will insert FAQ data through the API endpoints

const axios = require('axios');

// Configuration
const API_BASE_URL = 'http://localhost:5000/api'; // Change this to your API URL
const BEARER_TOKEN = ''; // Add your JWT token here

// FAQ data from the static page
const faqData = [
  {
    category: 'General Questions',
    questions: [
      {
        question: 'What is ElectionAT?',
        answer: 'ElectionAT is a comprehensive election management and analytics platform designed to help manage electoral data, track voting patterns, and provide insights for better decision making in democratic processes.'
      },
      {
        question: 'How can I access the platform?',
        answer: 'You can access ElectionAT through your web browser by navigating to our platform URL. You will need valid login credentials provided by your administrator to access the system.'
      },
      {
        question: 'What features are available in ElectionAT?',
        answer: 'ElectionAT offers various features including constituency management, candidate tracking, voting data analysis, booth management, volunteer coordination, and comprehensive reporting tools.'
      }
    ]
  },
  {
    category: 'Account & Login',
    questions: [
      {
        question: 'How do I reset my password?',
        answer: 'To reset your password, click on the "Forgot Password" link on the login page. Enter your email address, and you will receive a password reset link. Follow the instructions in the email to create a new password.'
      },
      {
        question: 'I forgot my username. How can I recover it?',
        answer: 'Contact your system administrator or use the help center to recover your username. Provide your registered email address for verification.'
      },
      {
        question: 'Can I change my account information?',
        answer: 'Yes, you can update your account information through the profile settings section. Some changes may require administrator approval depending on your user role.'
      }
    ]
  },
  {
    category: 'Data & Analytics',
    questions: [
      {
        question: 'How is the election data collected?',
        answer: 'Election data is collected through various verified sources including official election commission records, booth reports, volunteer surveys, and authorized data entry personnel.'
      },
      {
        question: 'How often is the data updated?',
        answer: 'Data is updated in real-time during active election periods and regularly maintained during non-election periods. Historical data is preserved for trend analysis and reference.'
      },
      {
        question: 'Can I export reports and data?',
        answer: 'Yes, authorized users can export data and reports in various formats including PDF, Excel, and CSV. Export permissions depend on your user role and access level.'
      }
    ]
  }
];

// API client setup
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
    'Authorization': BEARER_TOKEN ? `Bearer ${BEARER_TOKEN}` : ''
  }
});

// Seed function
const seedFAQsViaAPI = async () => {
  console.log('🌱 Starting FAQ data seeding via API...');
  
  if (!BEARER_TOKEN) {
    console.warn('⚠️  No Bearer token provided. Make sure you have admin access.');
  }

  let totalInserted = 0;
  let orderIndex = 1;

  try {
    for (const categoryData of faqData) {
      console.log(`\nProcessing category: ${categoryData.category}`);
      
      for (const questionData of categoryData.questions) {
        try {
          const faqPayload = {
            question: questionData.question,
            answer: questionData.answer,
            category: categoryData.category,
            is_active: true,
            order_index: orderIndex
          };

          const response = await apiClient.post('/faqs', faqPayload);
          
          if (response.status === 201) {
            console.log(`✓ Inserted: "${questionData.question.substring(0, 50)}..."`);
            totalInserted++;
          } else {
            console.log(`⚠️  Unexpected response: ${response.status}`);
          }
          
          orderIndex++;
          
          // Add small delay to avoid overwhelming the API
          await new Promise(resolve => setTimeout(resolve, 100));
          
        } catch (error) {
          console.error(`✗ Error inserting FAQ: ${error.response?.data?.message || error.message}`);
        }
      }
    }

    console.log(`\n✅ FAQ seeding completed!`);
    console.log(`📊 Total FAQs inserted: ${totalInserted}`);
    console.log(`📂 Categories: ${faqData.length}`);

  } catch (error) {
    console.error('❌ Error during seeding process:', error.message);
  }
};

// Instructions
const showInstructions = () => {
  console.log('🌱 FAQ Data Seeder via API');
  console.log('===========================');
  console.log('');
  console.log('Instructions:');
  console.log('1. Make sure your backend server is running');
  console.log('2. Update the API_BASE_URL if needed');
  console.log('3. Add your JWT Bearer token to BEARER_TOKEN variable');
  console.log('4. Run: node seedFAQDataAPI.js');
  console.log('');
  console.log('To get Bearer token:');
  console.log('- Login via API or frontend');
  console.log('- Copy the JWT token from localStorage or API response');
  console.log('- Add it to BEARER_TOKEN variable');
  console.log('');
};

// Main execution
const main = async () => {
  if (!BEARER_TOKEN) {
    showInstructions();
    console.log('⚠️  Please add your Bearer token and try again.\n');
    return;
  }

  await seedFAQsViaAPI();
  console.log('\n🏁 Seeding process completed');
};

// Run the seeder
main().catch(console.error);