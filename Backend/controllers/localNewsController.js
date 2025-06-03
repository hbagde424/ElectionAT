const LocalNews = require('../models/LocalNews');
const Booth = require('../models/booth');

// @desc    Get all local news
// @route   GET /api/local-news
// @access  Public
exports.getLocalNews = async (req, res, next) => {
  try {
    // Pagination
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    // Basic query
    let query = LocalNews.find()
      .populate('booth_id', 'booth_number name')
      .sort({ published_date: -1 });

    // Search functionality
    if (req.query.search) {
      query = query.find({ $text: { $search: req.query.search } });
    }

    // Filter by booth
    if (req.query.booth) {
      query = query.where('booth_id').equals(req.query.booth);
    }

    // Filter by date range
    if (req.query.startDate) {
      const startDate = new Date(req.query.startDate);
      query = query.where('published_date').gte(startDate);
    }
    if (req.query.endDate) {
      const endDate = new Date(req.query.endDate);
      query = query.where('published_date').lte(endDate);
    }

    const localNews = await query.skip(skip).limit(limit).exec();
    const total = await LocalNews.countDocuments(query.getFilter());

    res.status(200).json({
      success: true,
      count: localNews.length,
      total,
      page,
      pages: Math.ceil(total / limit),
      data: localNews
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get single local news item
// @route   GET /api/local-news/:id
// @access  Public
exports.getLocalNewsItem = async (req, res, next) => {
  try {
    const newsItem = await LocalNews.findById(req.params.id)
      .populate('booth_id', 'booth_number name');

    if (!newsItem) {
      return res.status(404).json({
        success: false,
        message: 'News item not found'
      });
    }

    res.status(200).json({
      success: true,
      data: newsItem
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Create local news item
// @route   POST /api/local-news
// @access  Private (Admin only)
exports.createLocalNews = async (req, res, next) => {
  try {
    // Verify booth exists
    const booth = await Booth.findById(req.body.booth_id);
    if (!booth) {
      return res.status(400).json({
        success: false,
        message: 'Booth not found'
      });
    }

    const newsItem = await LocalNews.create(req.body);

    res.status(201).json({
      success: true,
      data: newsItem
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Update local news item
// @route   PUT /api/local-news/:id
// @access  Private (Admin only)
exports.updateLocalNews = async (req, res, next) => {
  try {
    let newsItem = await LocalNews.findById(req.params.id);

    if (!newsItem) {
      return res.status(404).json({
        success: false,
        message: 'News item not found'
      });
    }

    // Verify booth exists if being updated
    if (req.body.booth_id) {
      const booth = await Booth.findById(req.body.booth_id);
      if (!booth) {
        return res.status(400).json({
          success: false,
          message: 'Booth not found'
        });
      }
    }

    newsItem = await LocalNews.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    }).populate('booth_id', 'booth_number name');

    res.status(200).json({
      success: true,
      data: newsItem
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Delete local news item
// @route   DELETE /api/local-news/:id
// @access  Private (Admin only)
exports.deleteLocalNews = async (req, res, next) => {
  try {
    const newsItem = await LocalNews.findById(req.params.id);

    if (!newsItem) {
      return res.status(404).json({
        success: false,
        message: 'News item not found'
      });
    }

    await newsItem.remove();

    res.status(200).json({
      success: true,
      data: {}
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get news by booth
// @route   GET /api/local-news/booth/:boothId
// @access  Public
exports.getNewsByBooth = async (req, res, next) => {
  try {
    // Verify booth exists
    const booth = await Booth.findById(req.params.boothId);
    if (!booth) {
      return res.status(404).json({
        success: false,
        message: 'Booth not found'
      });
    }

    const newsItems = await LocalNews.find({ booth_id: req.params.boothId })
      .sort({ published_date: -1 });

    res.status(200).json({
      success: true,
      count: newsItems.length,
      data: newsItems
    });
  } catch (err) {
    next(err);
  }
};