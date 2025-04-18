class APIFeatures {
  constructor(query, queryString) {
    this.query = query;
    this.queryString = queryString;
  }

  filter() {
    const queryObj = { ...this.queryString };
    const excludedFields = ['page', 'sort', 'limit', 'fields', 'search']; // 'search' is the user query
    excludedFields.forEach(el => delete queryObj[el]);

    // 1B) Advanced Filtering
    let queryStr = JSON.stringify(queryObj);
    queryStr = queryStr.replace(/\b(gte|gt|lte|lt)\b/g, match => `$${match}`);

    this.query = this.query.find(JSON.parse(queryStr));

    return this;
  }

  // New search method to handle text search
  search() {
    const searchTerm = this.queryString.search;
    if (searchTerm) {
      // If 'search' field is provided, search in both posts and user models
      const searchRegex = new RegExp(searchTerm, 'i'); // case-insensitive search

      this.query = this.query.find({
        $or: [
          { text: { $regex: searchRegex } }, 
          { hashtags: { $in: [searchTerm] } },
        ]
      });

      // Optionally, also support searching for users by username
      // Example if searching for accounts as well
      // const usersQuery = User.find({ username: { $regex: searchRegex, $options: 'i' } });
    }

    return this;
  }

  sort() {
    if (this.queryString.sort) {
      let sortBy = this.queryString.sort;
  
      if (sortBy === 'top') {
        // sort by number of likes 
        this.query = this.query.sort({ likes: -1 });
      } else if (sortBy === 'latest') {
        this.query = this.query.sort({ createdAt: -1 });
      } else {
        // fallback to custom sort fields
        sortBy = sortBy.split(',').join(' ');
        this.query = this.query.sort(sortBy);
      }
    } else {
      // Default: newest first
      this.query = this.query.sort({ createdAt: -1 });
    }
  
    return this;
  }
  

  limitFields() {
    if (this.queryString.fields) {
      const fields = this.queryString.fields.split(',').join(' ');
      this.query = this.query.select(fields);
    } else {
      this.query = this.query.select('-__v');
    }
    return this;
  }

  paginate() {
    const page = this.queryString.page * 1 || 1;
    const limit = this.queryString.limit * 1 || 100;
    const skip = (page - 1) * limit;

    this.query = this.query.skip(skip).limit(limit);

    return this;
  }

  hashtagFilter() {
    if (this.queryString.hashtags) {
      const hashtags = this.queryString.hashtags
        .toLowerCase()
        .split(',')
        .map(tag => tag.trim());
  
      this.query = this.query.find({ hashtags: { $in: hashtags } });
    }
    return this;
  }
  
}

module.exports = APIFeatures;
