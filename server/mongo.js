const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken'); // Missing jwt import

mongoose.connect("mongodb://localhost:27017")
    .then(() => {
        console.log("MongoDB connected");
    })
    .catch(() => {
        console.log("Failed to connect");
    });

const loginSchema = new mongoose.Schema({
    username: {
        type: String,
        required: true,
    },
    email: {
        type: String,
        required: [true, 'Email is required'],
        unique: true
    },
    password: {
        type: String,
        required: true,
        minlength: [6, 'Length should be 6 characters long']
    }
});

// Middleware to hash password before saving
loginSchema.pre('save', async function (next) {
    if (!this.isModified('password')) {
        return next();
    }
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
});

// Method to compare passwords
loginSchema.methods.comparePassword = async function (password) {
    return bcrypt.compare(password, this.password);
};

// Method to generate JWT tokens
loginSchema.methods.getSignedToken = function (res) {
    const accessSecret = process.env.JWT_ACCESS_SECRET;
    const refreshSecret = process.env.JWT_REFRESH_SECRET;

    if (!accessSecret || !refreshSecret) {
        throw new Error('JWT secret keys are missing from the environment variables');
    }

    const accessToken = jwt.sign(
        { id: this._id },
        accessSecret,
        { expiresIn: process.env.JWT_ACCESS_EXPIREIN } 
    );

    const refreshToken = jwt.sign(
        { id: this._id },
        refreshSecret,
        { expiresIn: process.env.JWT_REFRESH_EXPIREIN  } 
    );

    // Set refresh token in the cookie
    res.cookie("refreshToken", refreshToken, {
        maxAge: 86400 * 7000, 
        httpOnly: true, 
    });

    return { accessToken, refreshToken };
};

// Create a model
const Collection = mongoose.model('Collection', loginSchema);

module.exports = Collection;
