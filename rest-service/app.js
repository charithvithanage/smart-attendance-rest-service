const AWS = require('aws-sdk')
const express = require('express');
const bodyParser = require('body-parser');
const app = express();
require('dotenv').config();

const port = process.env.PORT || 3000;

AWS.config.update({
    region: process.env.AWS_DEFAULT_REGION,
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_KEY_ID
})

const docClient = new AWS.DynamoDB.DocumentClient();
const ADMIN_USERS_TABLE_NAME = "smart-attendance-admin-users";

app.use(bodyParser.json());

// Define a route to handle user login
app.post('/login', async (req, res) => {
    const { username, password } = req.body;

    const params = {
        TableName: ADMIN_USERS_TABLE_NAME,
    };

    try {
        const result = await docClient.scan(params).promise();
        const users = result.Items;

        const user = users.find(u => u.username === username && u.password === password);

        if (user) {
            // Return a separate user object without the password field
            const { password,username, ...userData } = user;
            res.json({ message: 'Login successful', user: userData });
        } else {
            res.status(401).json({ error: 'Invalid credentials' });
        }
    } catch (error) {
        res.status(500).json({ error: 'Error processing request' });
    }
});

app.get('/users', async (req, res) => {
    const params = {
        TableName: ADMIN_USERS_TABLE_NAME,
    };

    try {
        const result = await docClient.scan(params).promise();
        res.json(result.Items);
    } catch (error) {
        res.status(500).json({ error: 'Error fetching data from DynamoDB' });
    }
});



// Start the Express app
app.listen(port, () => {
    console.log(`App listening at http://localhost:${port}`);
});