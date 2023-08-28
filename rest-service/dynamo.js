const AWS = require('aws-sdk')
require('dotenv').config();


const ADMIN_USERS_TABLE_NAME = process.env.ADMIN_USERS_TABLE_NAME
const COMPANY_TABLE_NAME = process.env.COMPANY_TABLE_NAME
const USERS_TABLE_NAME = process.env.USERS_TABLE_NAME

console.log(USERS_TABLE_NAME)
AWS.config.update({
    region: process.env.AWS_DEFAULT_REGION,
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_KEY_ID
})

const docClient = new AWS.DynamoDB.DocumentClient();

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

        console.log(user)
        if (user.password != oldPassword) {
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
        return true

    } catch (error) {
        return error;
    }

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
    console.log(USERS_TABLE_NAME)
    const params = {
        TableName: USERS_TABLE_NAME,
        Key: {
            nic
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
    const params = {
        TableName: USERS_TABLE_NAME,
        Item: user
    };

    var result = await docClient.put(params).promise();
    return result.Item
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

const changePassword = async (id, oldPassword, newPassword) => {
    try {
        const user = await getUserById(id);

        if (!user) {
            return 'User not found';
        }

        console.log(user)
        if (user.password != oldPassword) {
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
        return true

    } catch (error) {
        return error;
    }

}

const activateUser = async (nic, userStatus) => {
    try {
        const isExist = await isUserExist(nic);

        if (!isExist) {
            return 'User not found';
        } else {
            //Update user status in DynamoDB
            const updateParams = {
                TableName: USERS_TABLE_NAME,
                Key: { nic },
                UpdateExpression: 'set userStatus = :userStatus',
                ExpressionAttributeValues: {
                    ':userStatus': userStatus
                },
                // ReturnValues: 'UPDATED_NEW'
            };

            const result = await docClient.update(updateParams).promise();
            return "User status updated successfully"
        }
    } catch (error) {
        return error;
    }

}

const adminUser = {
    "id": "1",
    "employeeID": "SHDL00002",
    "nic": "911240807V",
    "username": "Charith",
    "userStatus": false,
    "password": "Charith@1991",
    "firstName": "Charith",
    "lastName": "Vithanage"
}

const company = {
    "companyID": "SHDL00001",
    "companyName": "ABC Company",
    "status":true
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
    isUserExist,
    getCompanyByID
}

// addOrUpdateCompany(company)
// addAdminUser(adminUser)

// getUsers();





