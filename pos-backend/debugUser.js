const mongoose = require('mongoose');
require('dotenv').config();
const config = require('./config/config');

async function getUser() {
    try {
        await mongoose.connect(config.databaseURI);
        const user = await mongoose.connection.db.collection('users').findOne({ email: 'test.bot@restaurant.com' });

        console.log(JSON.stringify(user, null, 2));
        await mongoose.connection.close();
        process.exit(0);
    } catch (error) {
        console.error(error);
        process.exit(1);
    }
}

getUser();
