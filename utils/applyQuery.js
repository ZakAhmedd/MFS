const APIFeatures = require('./apiFeatures');
const Post = require('../models/postModel');

const applyQuery = async (query, queryParams) => {
  const features = new APIFeatures(query, queryParams)
    .hashtagFilter()
    .search()
    .sort()
    .limitFields()
    .paginate();

  return features.query;
};


module.exports = applyQuery;
