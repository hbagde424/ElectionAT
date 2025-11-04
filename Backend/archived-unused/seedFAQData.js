const mongoose = require('mongoose');
const FAQ = require('./models/FAQ');
const User = require('./models/User');

// Database connection
const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/electionAT', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error('Error connecting to MongoDB:', error);
    process.exit(1);
  }
};

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

// Seed FAQ data
const seedFAQs = async () => {
  try {
    console.log('Starting FAQ data seeding...');

    // Find a user to use as creator (preferably admin/superAdmin)
    let seedUser = await User.findOne({ role: { $in: ['superAdmin', 'admin'] } });
    
    if (!seedUser) {
      // If no admin user found, find any user
      seedUser = await User.findOne();
    }

    if (!seedUser) {
      console.error('No users found in database. Please create at least one user before seeding FAQs.');
      return;
    }

    console.log(`Using user ${seedUser.username} (${seedUser._id}) as FAQ creator`);

    // Clear existing FAQs (optional - comment out if you want to keep existing data)
    await FAQ.deleteMany({});
    console.log('Cleared existing FAQ data');

    let totalInserted = 0;
    let orderIndex = 1;

    // Insert FAQs for each category
    for (const categoryData of faqData) {
      console.log(`\nProcessing category: ${categoryData.category}`);
      
      for (const questionData of categoryData.questions) {
        try {
          const faq = new FAQ({
            question: questionData.question,
            answer: questionData.answer,
            category: categoryData.category,
            is_active: true,
            order_index: orderIndex,
            created_by: seedUser._id,
            updated_by: seedUser._id
          });

          await faq.save();
          console.log(`✓ Inserted: "${questionData.question.substring(0, 50)}..."`);
          totalInserted++;
          orderIndex++;
        } catch (error) {
          console.error(`✗ Error inserting FAQ: ${error.message}`);
        }
      }
    }

    console.log(`\n✅ FAQ seeding completed!`);
    console.log(`📊 Total FAQs inserted: ${totalInserted}`);
    console.log(`📂 Categories: ${faqData.length}`);

  } catch (error) {
    console.error('❌ Error seeding FAQ data:', error);
  }
};

// Main execution
const main = async () => {
  console.log('🌱 FAQ Data Seeder');
  console.log('==================');
  
  await connectDB();
  await seedFAQs();
  
  console.log('\n🏁 Seeding process completed');
  process.exit(0);
};

// Error handling
process.on('unhandledRejection', (err) => {
  console.error('Unhandled Promise Rejection:', err);
  process.exit(1);
});

// Run the seeder
main();