const crypto = require('crypto')
const mongoose = require('mongoose')
const validator = require('validator')
const bcrypt = require('bcryptjs')

const userSchema = new mongoose.Schema({
    email: {
        type: String,
        required: [true, 'Please provide your email'],
        unique: true,
        lowercase: true,
        validate: [validator.isEmail, 'Please provide a valid email']
    },
    firstName: {
        type: String,
        required: [true, 'Please tell us your first name']
    },
    lastName: {
        type: String,
        required: [true, 'Please tell us your last name']
    },
    username: {
        type: String,
        required: [true, 'Please provide a username'],
        unique: [true, 'Username is taken. Please enter a new one'],
        lowercase: true
    },
    password: {
        type: String,
        required: [true, 'Please provide a password'],
        select: false
    },
    // fightingChoice: {
    //     type: Boolean,
    //     required: [true, 'Please select wether or not you would like to fight']
    // },
    role: {
        type: [String],
        enum: ['Member', 'Fighter', 'Trainer'],
        default: 'Member'
      },
    followers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    following: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    isVerified: { type: Boolean, default: false },
    verificationCode: { type: String },
    verificationCodeExpires: Date,
})

userSchema.pre('save', async function(next) {
    // Only run this function if password was actually modified
    if(!this.isModified('password')) return next()
    
    // Hash the password with cost of 12 
    this.password = await bcrypt.hash(this.password, 12)

    next()
})

userSchema.methods.correctPassword = async function(candidatePassword, userPassword) {
    return await bcrypt.compare(candidatePassword, userPassword)
}

userSchema.methods.createPasswordResetToken = function() {
    const resetToken = crypto.randomBytes(32).toString('hex')

    this.passwordResetToken = crypto
        .createHash('sha256')
        .update(resetToken)
        .digest('hex')
    
    console.log({resetToken}, this.passwordResetToken)

    this.passwordResetExpires = Date.now() + 10 * 60 * 1000

    return resetToken
}


const User = mongoose.model('User', userSchema)

module.exports = User