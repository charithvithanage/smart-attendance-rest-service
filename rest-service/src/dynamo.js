const AWS = require('aws-sdk');
const e = require('express');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');
const { PutObjectCommand, S3Client } = require('@aws-sdk/client-s3');

require('dotenv').config();


const ADMIN_USERS_TABLE_NAME = process.env.ADMIN_USERS_TABLE_NAME
const COMPANY_TABLE_NAME = process.env.COMPANY_TABLE_NAME
const USERS_TABLE_NAME = process.env.USERS_TABLE_NAME
const ATTENDANCE_TABLE_NAME = process.env.ATTENDANCE_TABLE_NAME
const DROID_ID_NOTIFICATIONS_TABLE_NAME = process.env.DROID_ID_NOTIFICATIONS_TABLE_NAME
const DROID_AI_USERS_TABLE_NAME = process.env.DROID_AI_USERS_TABLE_NAME
const DROID_AI_INQUIRY_TABLE_NAME = process.env.DROID_AI_INQUIRY_TABLE_NAME

//Uncomment for localhost
//Comment for live
// AWS.config.update({
//     region: process.env.AWS_DEFAULT_REGION,
//     accessKeyId: process.env.AWS_ACCESS_KEY_ID,
//     secretAccessKey: process.env.AWS_SECRET_KEY_ID
// })
// const config={ credentials: { accessKeyId: process.env.AWS_ACCESS_KEY_ID, secretAccessKey: process.env.AWS_SECRET_KEY_ID } }
// const s3client = new S3Client(config)

const docClient = new AWS.DynamoDB.DocumentClient();
//For live deployment
const s3client = new S3Client({})

//Droid AI Api

//S3
async function getPresignedUrl(filename) {
    try {

        const command = new PutObjectCommand({
            Bucket: "droid-ai-s3-bucket",
            Key: filename,
            ACL: "public-read"
        })

        const url = await getSignedUrl(s3client, command, { expiresIn: 300 })

        return url

    } catch (err) {
        console.log(err)
        return undefined
    }
}


//Notifications Apis
//Save Notifications
async function saveNotification(notification) {

    const params = {
        TableName: DROID_ID_NOTIFICATIONS_TABLE_NAME,
        Item: notification
    };
    var result = await docClient.put(params).promise();
    console.log('Scan result:', result);
    return result
}

//Get Notifications
const getNotifications = async () => {
    const params = {
        TableName: DROID_ID_NOTIFICATIONS_TABLE_NAME,
    };
    var result
    try {
        result = await docClient.scan(params).promise();
        console.log('Scan result:', result.Items);
    } catch (error) {
        console.error('Error scanning table:', error);
    }

    return result
}

//Get Inquiries
const getInquiries = async () => {
    const params = {
        TableName: DROID_AI_INQUIRY_TABLE_NAME,
    };
    var result
    try {
        result = await docClient.scan(params).promise();
        console.log('Scan result:', result.Items);
    } catch (error) {
        console.error('Error scanning table:', error);
    }

    return result
}

//Get Inquiries By Farmer
const getInquiriesByFarmer = async (createdUserNIC) => {
    const params = {
        TableName: DROID_AI_INQUIRY_TABLE_NAME,
        FilterExpression: '#createdUserNIC = :createdUserNIC', // Corrected FilterExpression
        ExpressionAttributeNames: {
            '#createdUserNIC': 'createdUserNIC',
        },
        ExpressionAttributeValues: {
            ':createdUserNIC': createdUserNIC,
        },
    };
    var result;
    try {
        result = await docClient.scan(params).promise();
        console.log('Scan result:', result.Items);
    } catch (error) {
        console.error('Error scanning table:', error);
    }

    return result;
}

const getInquiriesByStatus = async (status) => {
    const params = {
        TableName: DROID_AI_INQUIRY_TABLE_NAME,
        FilterExpression: '#status = :status', // Corrected FilterExpression
        ExpressionAttributeNames: {
            '#status': 'status',
        },
        ExpressionAttributeValues: {
            ':status': status,
        },
    };
    var result;
    try {
        result = await docClient.scan(params).promise();
        console.log('Scan result:', result.Items);
    } catch (error) {
        console.error('Error scanning table:', error);
    }

    return result;
}

//Users Endpoints
//Reginster Endpoints
async function registerDroidAIUser(user) {
    const params = {
        TableName: DROID_AI_USERS_TABLE_NAME,
        Item: user
    };

    return await docClient.put(params).promise();
}

const isDroidAIUserExist = async (nic) => {
    try {
        const result = await getDroidAIUserByNIC(nic);

        if (result) {
            console.log("Result Exist : " + result);
            return true;
        } else {
            console.log("No Record Found");
            return false;
        }
    } catch (error) {
        console.error('Error getting user by NIC:', error);
    }
}

const getDroidAIUserByNIC = async (nic) => {
    const params = {
        TableName: DROID_AI_USERS_TABLE_NAME,
        Key: {
            nic: nic
        }
    };
    try {
        const result = await docClient.get(params).promise();
        return result.Item
    } catch (error) {
        console.error('Error getting user by NIC:', error);
    }
}

//Droid User Login Endpoint
const loginDroidAIUser = async (username, password) => {

    const params = {
        TableName: DROID_AI_USERS_TABLE_NAME,
    };
    const result = await docClient.scan(params).promise();
    const users = result.Items;

    var loggedInUser = users.find(u => u.userName === username && u.password === password);
    return loggedInUser
}

async function updateDeviceToken(deviceToken, nic) {
    try {
        const isExist = await isDroidAIUserExist(nic);

        if (!isExist) {
            return 'User not found';
        } else {
            //Update user status in DynamoDB
            const updateParams = {
                TableName: DROID_AI_USERS_TABLE_NAME,
                Key: { nic },
                UpdateExpression: 'set deviceToken = :deviceToken',
                ExpressionAttributeValues: {
                    ':deviceToken': deviceToken
                },
            };

            const result = await docClient.update(updateParams).promise();
            console.log("Returned Result : " + result.Attributes)
            return result.Attributes
        }
    } catch (error) {
        return error;
    }
}

//Droid User Submit Inquiry Endpoint
async function submitInquiry(inquiry) {
    const params = {
        TableName: DROID_AI_INQUIRY_TABLE_NAME,
        Item: inquiry
    };

    const result = await docClient.put(params).promise();
    return true
}


const getAdminUsers = async () => {
    const params = {
        TableName: ADMIN_USERS_TABLE_NAME,
    };
    var result
    try {
        result = await docClient.scan(params).promise();
        console.log('Scan result:', result.Items);
    } catch (error) {
        console.error('Error scanning table:', error);
    }

    return result
}

const getAdminUserById = async (id) => {
    const params = {
        TableName: ADMIN_USERS_TABLE_NAME,
        Key: {
            id
        }
    };
    try {
        const result = await docClient.get(params).promise();
        return result.Item;
    } catch (error) {
        console.error('Error getting user by ID:', error);
    }
}

const loginAdminUser = async (username, password) => {

    const params = {
        TableName: ADMIN_USERS_TABLE_NAME,
    };
    const result = await docClient.scan(params).promise();
    const users = result.Items;

    var loggedInUser = users.find(u => u.username === username && u.password === password);
    return loggedInUser
}

async function addOrUpdateAdminUser(user) {
    const params = {
        TableName: ADMIN_USERS_TABLE_NAME,
        Item: user
    };
    return await docClient.put(params).promise();
}

const adminChangePassword = async (id, oldPassword, newPassword) => {
    try {
        const user = await getAdminUserById(id);

        if (!user) {
            return 'User not found';
        }

        console.log("Old PWD " + oldPassword)
        console.log(user)
        if (user.password !== oldPassword) {
            return 'Invalid old password';
        }

        //Update password in DynamoDB
        const updateParams = {
            TableName: ADMIN_USERS_TABLE_NAME,
            Key: { id },
            UpdateExpression: 'set password = :password',
            ExpressionAttributeValues: {
                ':password': newPassword
            },
            // ReturnValues: 'UPDATED_NEW'
        };

        await docClient.update(updateParams).promise();
        return "Password Changed Successfully"

    } catch (error) {
        return error;
    }
}

async function registerCompany(company) {
    const params = {
        TableName: COMPANY_TABLE_NAME,
        Item: company
    };

    return await docClient.put(params).promise();
}


//Company Table
async function addOrUpdateCompany(company) {
    const params = {
        TableName: COMPANY_TABLE_NAME,
        Item: company
    };

    var result = await docClient.put(params).promise();
    return result
}

const getCompanyByID = async (companyID) => {
    const params = {
        TableName: COMPANY_TABLE_NAME,
        Key: {
            companyID
        }
    };
    try {
        const result = await docClient.get(params).promise();
        return result.Item;
    } catch (error) {
        console.error('Error getting Company by ID:', error);
    }
}

const getCompanyByCompanyID = async (companyID) => {
    console.log(COMPANY_TABLE_NAME)
    const params = {
        TableName: COMPANY_TABLE_NAME,
        Key: {
            companyID
        }
    };
    try {
        const result = await docClient.get(params).promise();
        return result.Item
    } catch (error) {
        console.error('Error getting user by NIC:', error);
    }
}

const isCompanyExist = async (companyID) => {

    try {
        const result = await getCompanyByCompanyID(companyID)


        if (result != null) {
            console.log("Result Exist : " + result)
            return true;
        } else {
            console.log("No Record Found")
            return false;
        }
    } catch (error) {
        console.error('Error getting user by NIC:', error);
    }
}

//User Table
const getUsers = async () => {
    const params = {
        TableName: USERS_TABLE_NAME,
    };
    var result
    try {
        result = await docClient.scan(params).promise();
        console.log('Scan result:', result.Items);
    } catch (error) {
        console.error('Error scanning table:', error);
    }

    return result
}

const getUserByNIC = async (nic) => {
    const params = {
        TableName: USERS_TABLE_NAME,
        Key: {
            nic: nic
        }
    };
    try {
        const result = await docClient.get(params).promise();
        return result.Item
    } catch (error) {
        console.error('Error getting user by NIC:', error);
    }
}

const getUserByName = async (firstName) => {
    console.log("smart-attendance-employee-users")
    const params = {
        TableName: "smart-attendance-employee-users",
        IndexName: 'firstName-index',
        ExpressionAttributeValues: {
            ':firstName': firstName,
        },
        ExpressionAttributeNames: {
            '#firstName': 'firstName',
        },
        KeyConditionExpression: '#firstName = :firstName',

    };
    try {
        const result = await docClient.query(params).promise();
        console.log(result)
        return result.Items.length ? result.Items[0] : null;
    } catch (error) {
        console.error('Error getting user by NIC:', error);
    }
}


const loginUser = async (username, password) => {

    const params = {
        TableName: USERS_TABLE_NAME,
    };
    const result = await docClient.scan(params).promise();
    const users = result.Items;

    var loggedInUser = users.find(u => u.username === username && u.password === password);
    return loggedInUser
}

async function updateUser(user) {
    try {
        const nic = user.nic
        const isExist = await isUserExist(nic);

        if (!isExist) {
            return 'User not found';
        } else {
            //Update user status in DynamoDB
            const updateParams = {
                TableName: USERS_TABLE_NAME,
                Key: { nic },
                UpdateExpression: 'set userType = :userType, dob = :dob, gender = :gender, lastName = :lastName, firstName = :firstName, email = :email, userStatus = :userStatus, deviceID = :deviceID, userRole = :userRole',
                ExpressionAttributeValues: {
                    ':userType': user.userType,
                    ':dob': user.dob,
                    ':gender': user.gender,
                    ':lastName': user.lastName,
                    ':firstName': user.firstName,
                    ':email': user.email,
                    ':userStatus': user.userStatus,
                    ':deviceID': user.deviceID,
                    ':userRole': user.userRole,
                },
                ReturnValues: 'ALL_NEW',
            };

            const result = await docClient.update(updateParams).promise();
            console.log("Returned Result : " + result.Attributes)
            return result.Attributes
        }
    } catch (error) {
        return error;
    }
}

const isUserExist = async (nic) => {

    try {
        const result = await getUserByNIC(nic)


        if (result != null) {
            console.log("Result Exist : " + result)
            return true;
        } else {
            console.log("No Record Found")
            return false;
        }
    } catch (error) {
        console.error('Error getting user by NIC:', error);
    }
}


async function registerUser(user) {
    const params = {
        TableName: USERS_TABLE_NAME,
        Item: user
    };

    return await docClient.put(params).promise();
}

const changePassword = async (nic, oldPassword, newPassword) => {
    try {
        const user = await getUserByNIC(nic);

        if (!user) {
            return 'User not found';
        }

        console.log(user)
        if (user.password != oldPassword) {
            return 'Invalid old password';
        }

        //Update password in DynamoDB
        const updateParams = {
            TableName: USERS_TABLE_NAME,
            Key: { nic },
            UpdateExpression: 'set password = :password',
            ExpressionAttributeValues: {
                ':password': newPassword
            },
            // ReturnValues: 'UPDATED_NEW'
        };

        const value = await docClient.update(updateParams).promise();

        return "Password Changed Successfully"

    } catch (error) {
        return error;
    }
}



const activateUser = async (nic, deviceID, userRole, userType, userStatus) => {
    try {
        const isExist = await isUserExist(nic);

        if (!isExist) {
            return 'User not found';
        } else {
            //Update user status in DynamoDB
            const updateParams = {
                TableName: USERS_TABLE_NAME,
                Key: { nic },
                UpdateExpression: 'set userStatus = :userStatus, deviceID = :deviceID, userRole = :userRole, userType = :userType',
                ExpressionAttributeValues: {
                    ':userStatus': userStatus,
                    ':deviceID': deviceID,
                    ':userRole': userRole,
                    ':userType': userType,
                },
                ReturnValues: 'ALL_NEW',
            };

            const result = await docClient.update(updateParams).promise();
            console.log("Returned Result : " + result.Attributes)
            return result.Attributes
        }
    } catch (error) {
        return error;
    }
}

const deleteUser = async (nic) => {
    try {
        const isExist = await isUserExist(nic);

        if (!isExist) {
            return 'User not found';
        } else {
            //Update user status in DynamoDB
            const updateParams = {
                TableName: USERS_TABLE_NAME,
                Key: { nic },
            };

            const result = await docClient.delete(updateParams).promise();
            return true
        }
    } catch (error) {
        return error;
    }
}


//Addendance
async function markInTime(attendance) {
    const params = {
        TableName: ATTENDANCE_TABLE_NAME,
        Item: attendance
    };

    const result = await docClient.put(params).promise();
    return true
}

const isAlreadyMaked = async (userID, date) => {

    const params = {
        TableName: ATTENDANCE_TABLE_NAME,
        Key: {
            userID,
            date: date,
        },
    };

    try {
        const result = await docClient.get(params).promise();
        console.log("Result Value", result.Item)
        if (!result.Item) {
            return false;
        } else {
            if (result.Item.inTime != null && result.Item.outTime == null) {
                return "Success";
            } else if (result.Item.outTime != null) {
                return "Already Marked";
            } else {
                return "Other Error"
            }
        }


    } catch (error) {
        console.error('Error getting attendance:', error);
    }

}


const markOutTime = async (userID, date, outTime) => {
    try {
        const isMakedStatus = await isAlreadyMaked(userID, date)

        if (isMakedStatus != "Success") {
            return isMakedStatus;
        } else {
            //Update user status in DynamoDB
            const updateParams = {
                TableName: ATTENDANCE_TABLE_NAME,
                Key: {
                    userID,
                    date: date,
                },
                UpdateExpression: 'set outTime = :outTime',
                ExpressionAttributeValues: {
                    ':outTime': outTime
                },
                // ReturnValues: 'UPDATED_NEW'
            };

            const result = await docClient.update(updateParams).promise();
            return "Attendance status updated successfully"
        }
    } catch (error) {
        return error;
    }
}

const getAttendancesByUser = async (userID, fromDate, toDate) => {

    const params = {
        TableName: ATTENDANCE_TABLE_NAME,
        FilterExpression: '#userID = :userID and #date between :fromDate and :toDate',
        ExpressionAttributeNames: {
            '#userID': 'userID',
            '#date': 'date',
        },
        ExpressionAttributeValues: {
            ':userID': userID,
            ':fromDate': fromDate,
            ':toDate': toDate,
        },
    };
    try {
        const data = await docClient.scan(params).promise();
        const filteredData = data.Items.filter(item => {
            const itemDateParts = item.date.split('.');
            const fromDateParts = fromDate.split('.');
            const toDateParts = toDate.split('.');

            const itemYear = parseInt(itemDateParts[2]);
            const itemMonth = parseInt(itemDateParts[1]);
            const itemDay = parseInt(itemDateParts[0]);

            const fromYear = parseInt(fromDateParts[2]);
            const fromMonth = parseInt(fromDateParts[1]);
            const fromDay = parseInt(fromDateParts[0]);

            const toYear = parseInt(toDateParts[2]);
            const toMonth = parseInt(toDateParts[1]);
            const toDay = parseInt(toDateParts[0]);

            return (
                itemYear >= fromYear &&
                itemYear <= toYear &&
                itemMonth >= fromMonth &&
                itemMonth <= toMonth &&
                itemDay >= fromDay &&
                itemDay <= toDay
            );
        });

        return filteredData
    } catch (error) {
        console.error('Error scanning table:', error);
    }

    return result
}

const getTodayAttendanceByUser = async (userID, date) => {

    const params = {
        TableName: ATTENDANCE_TABLE_NAME,
        KeyConditionExpression: '#userID = :userID and #date = :date',
        ExpressionAttributeNames: {
            '#userID': 'userID',
            '#date': 'date',
        },
        ExpressionAttributeValues: {
            ':userID': userID,
            ':date': date
        },
    };
    try {
        const result = await docClient.query(params).promise();
        return result.Items.length ? result.Items[0] : null;
    } catch (error) {
        console.error('Error scanning table:', error);
    }

    return result
}

const getAttendances = async (fromDate, toDate) => {

    const params = {
        TableName: ATTENDANCE_TABLE_NAME,
        FilterExpression: '#date between :fromDate and :toDate',
        ExpressionAttributeNames: {
            '#date': 'date',
        },
        ExpressionAttributeValues: {
            ':fromDate': fromDate,
            ':toDate': toDate,
        },
    };
    try {
        const data = await docClient.scan(params).promise();
        const filteredData = data.Items.filter(item => {
            const itemDateParts = item.date.split('.');
            const fromDateParts = fromDate.split('.');
            const toDateParts = toDate.split('.');

            const itemYear = parseInt(itemDateParts[2]);
            const itemMonth = parseInt(itemDateParts[1]);
            const itemDay = parseInt(itemDateParts[0]);

            const fromYear = parseInt(fromDateParts[2]);
            const fromMonth = parseInt(fromDateParts[1]);
            const fromDay = parseInt(fromDateParts[0]);

            const toYear = parseInt(toDateParts[2]);
            const toMonth = parseInt(toDateParts[1]);
            const toDay = parseInt(toDateParts[0]);

            return (
                itemYear >= fromYear &&
                itemYear <= toYear &&
                itemMonth >= fromMonth &&
                itemMonth <= toMonth &&
                itemDay >= fromDay &&
                itemDay <= toDay
            );
        });

        return filteredData
    } catch (error) {
        console.error('Error scanning table:', error);
    }

    return result
}



const notification = {
    "title": "Test Message",
    "message": "This is a Test Message"
}

const adminUser = {
    "employeeID": "SHDL00002",
    "firstName": "Charith",
    "lastName": "Vithanage",
    "email": "charithvin@gmail.com",
    "contact": "0712919248",
    "nic": "911240807V",
    "gender": "Male",
    "dob": "1991/05/03",
    "username": "Charith",
    "password": "Charith@1991",
    "userStatus": false
}

const company = {
    "companyID": "SHDL00001",
    "companyName": "ABC Company",
    "status": true
}

const attendance = {
    "userID": "911246576v",
    "date": "2023.09.15",
    "inTime": "08:30",
    "outTime": "05.30",
    "signatureUrl": ""
}

module.exports = {
    getAdminUsers,
    getAdminUserById,
    loginAdminUser,
    addOrUpdateAdminUser,
    adminChangePassword,
    getUsers,
    loginUser,
    updateUser,
    registerUser,
    changePassword,
    activateUser,
    markOutTime,
    isUserExist,
    getUserByNIC,
    getCompanyByID,
    addOrUpdateCompany,
    registerCompany,
    isCompanyExist,
    isAlreadyMaked,
    markInTime,
    getAttendances,
    getAttendancesByUser,
    getTodayAttendanceByUser,
    deleteUser,
    getNotifications,
    saveNotification,
    registerDroidAIUser,
    isDroidAIUserExist,
    loginDroidAIUser,
    updateDeviceToken,
    submitInquiry,
    getPresignedUrl,
    getInquiriesByFarmer,
    getInquiries,
    getInquiriesByStatus
}

// addOrUpdateCompany(company)
// addAdminUser(adminUser)
// getUsers();
// markInTime(attendance)





