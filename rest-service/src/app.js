const AWS = require('aws-sdk')
const { getInquiriesByStatus, getInquiries, getInquiriesByFarmer, getPresignedUrl, submitInquiry, loginDroidAIUser, isDroidAIUserExist, registerDroidAIUser, saveNotification, getNotifications, getAdminUsers, getAdminUserById, loginAdminUser, getUserByNIC, getAttendances, getTodayAttendanceByUser, getAttendancesByUser, addOrUpdateAdminUser, isAlreadyMaked, deleteUser, markInTime, adminChangePassword, getUsers, loginUser, isCompanyExist, updateUser, markOutTime, activateUser, registerCompany, registerUser, changePassword, getCompanyByID, isUserExist, addOrUpdateCompany, updateDeviceToken } = require('./dynamo');
const express = require('express');
const bodyParser = require('body-parser');
const e = require('express');
const app = express();
const { v4: uuidv4 } = require('uuid');
require('dotenv').config();

const port = process.env.PORT || 3000;

app.use(bodyParser.json());

//Droid AI Api

//Get S3 Url
app.post('/droidai/fileupload', async (req, res) => {
    try {
        const filename = req.body.filename;
        const result = await getPresignedUrl(filename)
        console.log(filename)
        res.json({ success: true, data: result });
    } catch (error) {
        console.error('Error saving notification to DynamoDB:', error);
        res.status(500).json({ error: 'Error saving notification to DynamoDB' });
    }
})

//Notifications Apis
//Save Notifications
app.post('/droidai/savenotification', async (req, res) => {
    try {
        const notification = req.body;
        notification.id = uuidv4()
        const result = await saveNotification(notification)
        res.json({ success: true, data: result });
    } catch (error) {
        console.error('Error saving notification to DynamoDB:', error);
        res.status(500).json({ error: 'Error saving notification to DynamoDB' });
    }
});

//Get Inquiries by Farmer
app.get('/droidai/get-inquiries-by-farmer/:createdUserNIC', async (req, res) => {
    try {
        const nic = req.params.createdUserNIC;
        const userExist = await isDroidAIUserExist(nic)
        console.log('User exist:', userExist);
        if (userExist) {
            const result = await getInquiriesByFarmer(nic)
            const inquiries = result.Items.map(inquiry => {
                return inquiry;
            });
            if (result != null) {
                res.json({ success: true, data: inquiries });
            } else {
                res.json({ success: false, message: "No Inquiries found" });
            }
        } else {
            res.json({ success: false, message: "No User found" });
        }

    } catch (error) {
        res.status(500).json({ error: 'Error fetching data from DynamoDB' });
    }
});

//Get Inquiries by Status
app.get('/droidai/get-inquiries-by-status/:status', async (req, res) => {
    try {
        const status = req.params.status;
        const result = await getInquiriesByStatus(status)
        const inquiries = result.Items.map(inquiry => {
            return inquiry;
        });
        if (inquiries != 0) {
            res.json({ success: true, data: inquiries });
        } else {
            res.json({ success: false, message: "No Inquiries found" });
        }

    } catch (error) {
        res.status(500).json({ error: 'Error fetching data from DynamoDB' });
    }
});

//Get Inquiries by Farmer
app.get('/droidai/get-inquiries', async (req, res) => {
    try {
        // const result = await docClient.scan(params).promise();
        const result = await getInquiries()
        const inquiries = result.Items.map(notification => {
            return notification;
        });
        if (result != null) {
            res.json({ success: true, data: inquiries });
        } else {
            res.json({ success: false, message: "No Inquiries found" });
        }
    } catch (error) {
        res.status(500).json({ error: 'Error fetching data from DynamoDB' });
    }
});

//Get Notifications
app.get('/droidai/notifications', async (req, res) => {
    try {
        // const result = await docClient.scan(params).promise();
        const result = await getNotifications()
        const notifications = result.Items.map(notification => {
            return notification;
        });
        if (result != null) {
            res.json({ success: true, data: notifications });
        } else {
            res.json({ success: false, message: "No Notifications found" });
        }
    } catch (error) {
        res.status(500).json({ error: 'Error fetching data from DynamoDB' });
    }
});

//User Endpoints
//Register User Endpoint
app.post('/droidai/register', async (req, res) => {
    try {
        const user = req.body;
        const userExist = await isDroidAIUserExist(user.nic)
        console.log('User exist:', userExist);
        if (userExist) {
            res.json({ success: false, message: 'User Already Registered' });
        } else {
            const result = await registerDroidAIUser(user)
            if (result) {
                // Return a separate user object without the password field
                const { password, username, ...userData } = user;
                res.json({ success: true, message: 'User Register successful', data: userData });
            } else {
                res.json({ success: false, message: 'User Not Registered' });
            }
        }


    } catch (error) {
        res.status(500).json({ error: 'Error fetching data from DynamoDB' });
    }
});

//DroidAI Login Endpoint
app.post('/droidai/login', async (req, res) => {
    try {
        const { deviceToken, username, password } = req.body;
        const user = await loginisDroidAIUserExistDroidAIUser(username, password)
        if (user) {
            const result = await updateDeviceToken(deviceToken, user.nic)
            res.json({ success: true, message: 'Login successful', data: result });
        } else {
            res.json({ success: false, message: 'Invalid credentials' });
        }
    } catch (error) {
        res.json({ success: false, message: error });

        // res.status(500).json({ error: 'Error processing request' });
    }
});

//Droid AI submit inquiry Endpoint
app.post('/droidai/submitinquiry', async (req, res) => {
    try {
        const inquiry = req.body;

        const userExist = await isDroidAIUserExist(inquiry.createdUserNIC)

        if (userExist) {
            inquiry.id = uuidv4()
            inquiry.createdDate = new Date().toISOString(); // Set the createdDate to the current date and time
            console.log("Inquiry Value", inquiry)
            const result = await submitInquiry(inquiry)
            res.json({ success: true, message: 'Inquiry Submitted successfully' });
        } else {
            res.json({ success: false, message: 'No user found for given nic' });
        }

    } catch (error) {
        res.json({ success: false, message: error });

        // res.status(500).json({ error: 'Error fetching data from DynamoDB' });
    }
});



// Define a route to handle user login
app.post('/admin/login', async (req, res) => {
    try {
        const { username, password } = req.body;
        const user = await loginAdminUser(username, password)
        if (user) {
            // Return a separate user object without the password field
            const { password, username, ...userData } = user;
            res.json({ success: true, message: 'Login successful', data: userData });
        } else {
            res.json({ success: false, message: 'Invalid credentials' });
        }
    } catch (error) {
        console.log(error)
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

app.put('/admin/change-password', async (req, res) => {

    try {
        const { id, oldPassword, newPassword } = req.body;
        const result = await adminChangePassword(id, oldPassword, newPassword)
        console.log(result)
        if (result == "Password Changed Successfully") {
            res.json({ success: true, message: result });
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
            res.json({ success: true, message: "Company found", data: result });
        } else {
            res.json({ success: false, message: "No Company found for given ID" });
        }
    } catch (error) {
        res.status(500).json({ error: 'Error fetching data from DynamoDB' });
    }
});

app.post('/company/register', async (req, res) => {
    try {
        const company = req.body;
        const result = await isCompanyExist(company.companyID)

        if (result) {
            res.json({ success: false, message: "Company Already Found", data: result });
        } else {
            const result = await registerCompany(company)
            if (result) {
                res.json({ success: true, message: 'Company Register successful', data: result });
            } else {
                res.json({ success: false, message: 'Company Not Registered' });
            }
        }
    } catch (error) {
        res.status(500).json({ error: 'Error fetching data from DynamoDB' });
    }
});

//User Section
app.post('/user/login', async (req, res) => {
    try {
        const { deviceID, username, password } = req.body;
        const user = await loginUser(username, password)
        if (user) {
            if (user.userStatus) {
                // Return a separate user object without the password field
                const { password, username, ...userData } = user;

                if (userData.deviceID != deviceID) {
                    res.json({ success: false, message: 'Invalid Device ID' });
                } else {
                    res.json({ success: true, message: 'Login successful', data: userData });
                }
            } else {
                res.json({ success: false, message: 'Inactive User' });
            }

        } else {
            res.json({ success: false, message: 'Invalid credentials' });
        }
    } catch (error) {
        console.log("user/login", error)
        res.json({ success: false, message: error });

        // res.status(500).json({ error: 'Error processing request' });
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

app.get('/user/users/:nic', async (req, res) => {
    try {
        const nic = req.params.nic
        const result = await getUserByNIC(nic)
        if (result) {
            const { password, username, ...userData } = result;
            res.json({ success: true, message: "User found", data: userData });
        } else {
            res.json({ success: false, message: "No User found for given NIC" });
        }
    } catch (error) {
        res.status(500).json({ error: 'Error fetching data from DynamoDB' });
    }
});


app.put('/user/updateUser', async (req, res) => {
    try {
        const user = req.body;
        console.log("Request : " + user)
        const result = await updateUser(user)
        res.json({ success: true, message: "User updated successfully", data: result });
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
                res.json({ success: true, message: 'User Register successful', data: userData });
            } else {
                res.json({ success: false, message: 'User Not Registered' });
            }
        }


    } catch (error) {
        res.status(500).json({ error: 'Error fetching data from DynamoDB' });
    }
});

app.put('/user/change-password', async (req, res) => {

    try {
        const { nic, oldPassword, newPassword } = req.body;
        const result = await changePassword(nic, oldPassword, newPassword)

        if (result == "Password Changed Successfully") {
            res.json({ success: true, message: result });
        } else {
            res.json({ success: false, message: result });
        }
    } catch (error) {
        res.status(500).json({ error: 'Error fetching data from DynamoDB' });
    }
});

app.put('/user/activateUser', async (req, res) => {

    try {
        const { nic, deviceID, userRole, userType, userStatus } = req.body;
        const result = await activateUser(nic, deviceID, userRole, userType, userStatus)

        if (result !== null) {
            res.json({ success: true, data: result, message: "User status update successfully" });
        } else {
            res.json({ success: false, message: result });
        }
    } catch (error) {
        res.json({ success: false, message: error });
    }
});

app.delete('/user/deleteUser/:nic', async (req, res) => {

    try {

        const nic = req.params.nic;

        const result = await deleteUser(nic)

        if (result) {
            res.json({ success: true, message: 'User Successfully Deleted' });
        } else {
            res.json({ success: false, message: 'Attendance Marked unsuccessfully' });
        }
    } catch (error) {
        res.status(500).json({ error: 'Error fetching data from DynamoDB' });
    }
});


//Attendance Section
app.post('/attendance/in', async (req, res) => {
    try {
        const attendance = req.body;
        const isMaked = await isAlreadyMaked(attendance.userID, attendance.date)

        console.log("Masked Value", isMaked)
        if (isMaked) {
            res.json({ success: false, message: 'Attendance Already Marked' });
        } else {
            const result = await markInTime(attendance)
            if (result) {
                res.json({ success: true, message: 'Attendance Marked successfully' });
            } else {
                res.json({ success: false, message: 'Attendance Marked unsuccessfully' });
            }
        }


    } catch (error) {
        res.status(500).json({ error: 'Error fetching data from DynamoDB' });
    }
});

app.put('/attendance/out', async (req, res) => {

    try {
        const attendance = req.body;
        const result = await markOutTime(attendance.userID, attendance.date, attendance.outTime)
        console.log("Result : " + result)

        if (result == 'Attendance status updated successfully') {
            res.json({ success: true, message: result });
        } else {
            res.json({ success: false, message: result });
        }
    } catch (error) {
        res.status(500).json({ error: 'Error fetching data from DynamoDB' });
    }
});

app.get('/attendance/attendances', async (req, res) => {
    try {

        const fromDate = req.query.fromDate;
        const toDate = req.query.toDate;
        // const result = await docClient.scan(params).promise();
        const result = await getAttendances(fromDate, toDate)
        res.json({ success: true, data: result });
    } catch (error) {
        res.status(500).json({ error: 'Error fetching data from DynamoDB' });
    }
});

app.get('/attendance/attendancesbyuser', async (req, res) => {
    try {

        const userID = req.query.userID;
        const fromDate = req.query.fromDate;
        const toDate = req.query.toDate;
        // const result = await docClient.scan(params).promise();
        const result = await getAttendancesByUser(userID, fromDate, toDate)
        res.json({ success: true, data: result });
    } catch (error) {
        res.status(500).json({ error: 'Error fetching data from DynamoDB' });
    }
});

app.get('/attendance/today-attendancebyuser', async (req, res) => {
    try {

        const userID = req.query.userID;
        const date = req.query.date;
        // const result = await docClient.scan(params).promise();
        const result = await getTodayAttendanceByUser(userID, date)

        if (result != null) {
            res.json({ success: true, data: result });
        } else {
            res.json({ success: false, message: "No attendance found" });
        }
    } catch (error) {
        res.status(500).json({ error: 'Error fetching data from DynamoDB' });
    }
});

app.get('/version', async (req, res) => {
    try {
        res.json({ success: true, data: "Hello" });
    } catch (error) {
        res.status(500).json({ error: 'Error fetching data from DynamoDB' });
    }
});

//Uncomment for localhost
//Comment for live
// Start the Express app
// app.listen(port, () => {
//     console.log(`App listening at http://localhost:${port}`);
// });

// Export your express server so you can import it in the lambda function.
module.exports = app