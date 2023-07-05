const mongoose = require('mongoose');

// define a Schema
const UserSchema = new mongoose.Schema({
    username: {
        type: String,
        required: true,
        min:4,
        unique:true
    },
    password: {
        type: String,
        required:true
    }
});

// Create a model based on the schema
// the model name is User
const UserModel = mongoose.model('User', UserSchema);

module.exports = UserModel;