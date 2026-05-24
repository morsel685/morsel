const mongoose = require('mongoose');
require('dotenv').config();
const config = require('./config/config');

async function getToken() {
    try {
        await mongoose.connect(config.databaseURI);
        const user = await mongoose.connection.db.collection('users').findOne({ email: 'test.bot@restaurant.com' });

        if (user) {
            console.log('TOKEN:' + user.emailVerificationToken);
        } else {
            console.log('User not found');
        }
        await mongoose.connection.close();
        process.exit(0);
    } catch (error) {
        console.error(error);
        process.exit(1);
    }
}

getToken();
