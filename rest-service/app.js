const AWS = require('aws-sdk')
const { getAdminUsers, getAdminUserById, loginAdminUser, addOrUpdateAdminUser, adminChangePassword, getUsers, loginUser, updateUser, activateUser, registerUser, changePassword, getCompanyByID, isUserExist } = require('./dynamo');
const express = require('express');
const bodyParser = require('body-parser');
const e = require('express');
const app = express();
const { v4: uuidv4 } = require('uuid');
require('dotenv').config();

const port = process.env.PORT || 3000;

// AWS.config.update({
//     region: process.env.AWS_DEFAULT_REGION,
//     accessKeyId: process.env.AWS_ACCESS_KEY_ID,
//     secretAccessKey: process.env.AWS_SECRET_KEY_ID
// })

app.use(bodyParser.json());

// Define a route to handle user login
app.post('/admin/login', async (req, res) => {
    try {
        const { username, password } = req.body;
        const user = await loginAdminUser(username, password)
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

app.get('/admin/users', async (req, res) => {
    try {
        // const result = await docClient.scan(params).promise();
        const result = await getAdminUsers()
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

app.get('/admin/users/:id', async (req, res) => {
    try {
        const id = req.params.id
        const result = await getAdminUserById(id)
        // Return a separate user object without the password field
        const { password, username, ...userData } = result;
        res.json({ success: true, data: userData });
    } catch (error) {
        res.status(500).json({ error: 'Error fetching data from DynamoDB' });
    }
});


app.post('/admin/updateUser', async (req, res) => {
    try {
        const user = req.body;
        const result = await addOrUpdateAdminUser(user)
        res.json({ success: true, data: result });
    } catch (error) {
        res.status(500).json({ error: 'Error fetching data from DynamoDB' });
    }
});

app.put('/admin/change-password/:id', async (req, res) => {

    try {
        const id = req.params.id;
        const { oldPassword, newPassword } = req.body;
        const result = await adminChangePassword(id, oldPassword, newPassword)

        if (result) {
            res.json({ success: true, message: "Password changed successfully" });
        } else {
            res.json({ success: false, message: result });
        }
    } catch (error) {
        res.status(500).json({ error: 'Error fetching data from DynamoDB' });
    }
});

//Company Section
app.get('/company/companies/:companyID', async (req, res) => {
    try {
        const companyID = req.params.companyID
        const result = await getCompanyByID(companyID)

        if (result) {
            res.json({ success: true,  message: "Company found",data: result });
        } else {
            res.json({ success: false, message: "No Company found for given ID" });
        }
    } catch (error) {
        res.status(500).json({ error: 'Error fetching data from DynamoDB' });
    }
});

//User Section
app.post('/user/login', async (req, res) => {
    try {
        const { username, password } = req.body;
        const user = await loginUser(username, password)
        if (user) {
            if (user.userStatus) {
                // Return a separate user object without the password field
                const { password, username, ...userData } = user;
                res.json({ success: true, message: 'Login successful', data: userData });
            } else {
                res.json({ success: false, message: 'Invactive User' });
            }

        } else {
            res.json({ success: false, message: 'Invalid credentials' });
        }
    } catch (error) {
        res.status(500).json({ error: 'Error processing request' });
    }
});

app.get('/user/users', async (req, res) => {
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

app.get('/user/users/:id', async (req, res) => {
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


app.put('/user/updateUser', async (req, res) => {
    try {
        const user = req.body;
        const result = await updateUser(user)
        res.json({ success: true, data: result });
    } catch (error) {
        res.status(500).json({ error: 'Error fetching data from DynamoDB' });
    }
});

app.post('/user/register', async (req, res) => {
    try {
        const user = req.body;
        const userExist = await isUserExist(user.nic)

        if (userExist) {
            res.json({ success: false, message: 'User Already Registered' });
        } else {
            const result = await registerUser(user)
            if (result) {
                // Return a separate user object without the password field
                const { password, username, ...userData } = user;
                res.json({ message: 'User Register successful', data: userData });
            } else {
                res.json({ success: false, message: 'User Not Registered' });
            }
        }


    } catch (error) {
        res.status(500).json({ error: 'Error fetching data from DynamoDB' });
    }
});

app.put('/user/change-password/:id', async (req, res) => {

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

app.put('/user/activateUser/:nic', async (req, res) => {

    try {
        const nic = req.params.nic;
        const { userStatus } = req.body;
        const result = await activateUser(nic, userStatus)
        console.log("Result : "+result)

        if (result=='User status updated successfully') {
            res.json({ success: true, message: result });
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