// backend/utils/apiFeatures.js
class ApiFeatures {
    constructor(query, queryStr) {
      this.query = query;
      this.queryStr = queryStr;
    }
  
    search() {
      const keyword = this.queryStr.search
        ? {
            $or: [
              { title: { $regex: this.queryStr.search, $options: 'i' } },
              { description: { $regex: this.queryStr.search, $options: 'i' } },
              { price: parseFloat(this.queryStr.search) || 0 }
            ]
          }
        : {};
  
      this.query = this.query.find({ ...keyword });
      return this;
    }
  
    pagination() {
      const page = parseInt(this.queryStr.page, 10) || 1;
      const limit = parseInt(this.queryStr.limit, 10) || 10;
      const skip = (page - 1) * limit;
  
      this.query = this.query.skip(skip).limit(limit);
      return this;
    }
  }
  
  module.exports = ApiFeatures;