const FAQ = require('../models/FAQ');

// @desc    Get all FAQs
// @route   GET /api/faqs
// @access  Public
exports.getFAQs = async (req, res, next) => {
  try {
    // Pagination
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    // Build query
    let query = FAQ.find()
      .populate('created_by', 'username')
      .populate('updated_by', 'username')
      .sort({ category: 1, order_index: 1, created_at: -1 });

    // Search functionality
    if (req.query.search) {
      const searchRegex = { $regex: req.query.search, $options: 'i' };
      query = query.find({
        $or: [
          { question: searchRegex },
          { answer: searchRegex },
          { category: searchRegex }
        ]
      });
    }

    // Filter by category
    if (req.query.category) {
      query = query.where('category').equals(req.query.category);
    }

    // Filter by active status
    if (req.query.is_active !== undefined) {
      query = query.where('is_active').equals(req.query.is_active === 'true');
    }

    // Check if all data requested (for CSV export)
    if (req.query.all === 'true') {
      const allFAQs = await query.exec();
      return res.status(200).json({
        success: true,
        count: allFAQs.length,
        data: allFAQs
      });
    }

    // Apply pagination
    const faqs = await query.skip(skip).limit(limit).exec();
    const total = await FAQ.countDocuments(query.getFilter());

    res.status(200).json({
      success: true,
      count: faqs.length,
      total,
      page,
      pages: Math.ceil(total / limit),
      data: faqs
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get single FAQ
// @route   GET /api/faqs/:id
// @access  Public
exports.getFAQ = async (req, res, next) => {
  try {
    const faq = await FAQ.findById(req.params.id)
      .populate('created_by', 'username')
      .populate('updated_by', 'username');

    if (!faq) {
      return res.status(404).json({
        success: false,
        message: 'FAQ not found'
      });
    }

    res.status(200).json({
      success: true,
      data: faq
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Create FAQ
// @route   POST /api/faqs
// @access  Private (Admin only)
exports.createFAQ = async (req, res, next) => {
  try {
    // Validate required fields
    const { question, answer, category } = req.body;

    if (!question || !answer) {
      return res.status(400).json({
        success: false,
        message: 'Question and answer are required'
      });
    }

    // Check if user exists in request
    if (!req.user || !req.user.id) {
      return res.status(401).json({
        success: false,
        message: 'Not authorized - user not identified'
      });
    }

    const faqData = {
      ...req.body,
      created_by: req.user.id,
    };

    const faq = await FAQ.create(faqData);
    
    // Populate the created FAQ
    await faq.populate('created_by', 'username');

    res.status(201).json({
      success: true,
      data: faq
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Update FAQ
// @route   PUT /api/faqs/:id
// @access  Private (Admin only)
exports.updateFAQ = async (req, res, next) => {
  try {
    let faq = await FAQ.findById(req.params.id);

    if (!faq) {
      return res.status(404).json({
        success: false,
        message: 'FAQ not found'
      });
    }

    // Check if user exists in request
    if (!req.user || !req.user.id) {
      return res.status(401).json({
        success: false,
        message: 'Not authorized - user not identified'
      });
    }

    const updateData = {
      ...req.body,
      updated_by: req.user.id,
    };

    faq = await FAQ.findByIdAndUpdate(req.params.id, updateData, {
      new: true,
      runValidators: true
    })
      .populate('created_by', 'username')
      .populate('updated_by', 'username');

    res.status(200).json({
      success: true,
      data: faq
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Delete FAQ
// @route   DELETE /api/faqs/:id
// @access  Private (Admin only)
exports.deleteFAQ = async (req, res, next) => {
  try {
    const faq = await FAQ.findById(req.params.id);

    if (!faq) {
      return res.status(404).json({
        success: false,
        message: 'FAQ not found'
      });
    }

    await faq.deleteOne();

    res.status(200).json({
      success: true,
      data: {}
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get FAQ categories
// @route   GET /api/faqs/categories/list
// @access  Public
exports.getFAQCategories = async (req, res, next) => {
  try {
    const categories = await FAQ.distinct('category');
    
    res.status(200).json({
      success: true,
      data: categories
    });
  } catch (err) {
    next(err);
  }
};