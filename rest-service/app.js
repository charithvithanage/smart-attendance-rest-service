const AWS = require('aws-sdk')
const { getUsers, getUserById, loginUser, addOrUpdateAdminUser, changePassword } = require('./dynamo');
const express = require('express');
const bodyParser = require('body-parser');
const e = require('express');
const app = express();
require('dotenv').config();

const port = process.env.PORT || 3000;

AWS.config.update({
    region: process.env.AWS_DEFAULT_REGION,
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_KEY_ID
})

app.use(bodyParser.json());

// Define a route to handle user login
app.post('/login', async (req, res) => {
    try {
        const { username, password } = req.body;
        const user = await loginUser(username, password)
        if (user) {
            // Return a separate user object without the password field
            const { password, username, ...userData } = user;
            res.json({ message: 'Login successful', data: userData });
        } else {
            res.json({ success: false, message: 'Invalid credentials' });
                   }
    } catch (error) {
        res.status(500).json({ error: 'Error processing request' });
    }
});

app.get('/users', async (req, res) => {
    try {
        // const result = await docClient.scan(params).promise();
        const result = await getUsers()
        // Create a new array of user objects without the password field
        const usersWithoutPasswords = result.Items.map(user => {
            const { password, username, ...userWithoutPassword } = user;
            return userWithoutPassword;
        });
        res.json({ success: true, data: usersWithoutPasswords });
    } catch (error) {
        res.status(500).json({ error: 'Error fetching data from DynamoDB' });
    }
});

app.get('/users/:id', async (req, res) => {
    try {
        const id = req.params.id
        const result = await getUserById(id)
        // Return a separate user object without the password field
        const { password, username, ...userData } = result;
        res.json({ success: true, data: userData });
    } catch (error) {
        res.status(500).json({ error: 'Error fetching data from DynamoDB' });
    }
});


app.post('/updateUser', async (req, res) => {
    try {
        const user = req.body;
        const result = await addOrUpdateAdminUser(user)
        res.json({ success: true, data: result });
    } catch (error) {
        res.status(500).json({ error: 'Error fetching data from DynamoDB' });
    }
});

app.put('/change-password/:id', async (req, res) => {

    try {
        const id = req.params.id;
        const { oldPassword, newPassword } = req.body;
        const result = await changePassword(id, oldPassword, newPassword)
        
        if (result) {
            res.json({ success: true, message: "Password changed successfully" });
        } else {
            res.json({ success: false, message: result });
        }
    } catch (error) {
        res.status(500).json({ error: 'Error fetching data from DynamoDB' });
    }
});



// Start the Express app
app.listen(port, () => {
    console.log(`App listening at http://localhost:${port}`);
});