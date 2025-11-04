const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

(async () => {
    await mongoose.connect('mongodb+srv://developer:Hh1q2w3e4r5t6y7u8i9o0p@cluster0.8ehw8jn.mongodb.net/electionAT');

    const userSchema = new mongoose.Schema({
        username: { type: String, required: true, unique: true },
        email: { type: String, required: true, unique: true },
        password: { type: String, required: true, select: false },
        mobile: { type: String, required: true, unique: true },
        role: { type: String, enum: ['superAdmin', 'State', 'Admin', 'Booth', 'Division', 'Parliament', 'Block', 'Assembly'], required: true },
        isActive: { type: Boolean, default: true },
        created_at: { type: Date, default: Date.now },
        updated_at: { type: Date, default: Date.now }
    });

    userSchema.methods.comparePassword = async function (candidatePassword) {
        return await bcrypt.compare(candidatePassword, this.password);
    };

    const User = mongoose.model('User', userSchema);

    await User.deleteMany({ email: 'superadmin@example.com' });

    const hashedPassword = await bcrypt.hash('superadmin@123', 10);

    const user = new User({
        username: 'superadmin',
        email: 'superadmin@example.com',
        password: hashedPassword,
        mobile: '9999999999',
        role: 'superAdmin',
        isActive: true
    });

    await user.save();
    console.log('Super Admin created successfully!');

    const testUser = await User.findOne({ email: 'superadmin@example.com' }).select('+password');
    if (testUser) {
        const match = await testUser.comparePassword('superadmin@123');
        console.log('Password test:', match);
    }

    await mongoose.disconnect();
})().catch(console.error);
