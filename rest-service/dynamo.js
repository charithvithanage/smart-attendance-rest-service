const AWS = require('aws-sdk')
require('dotenv').config();

ADMIN_USERS_TABLE_NAME = process.env.ADMIN_USERS_TABLE_NAME
COMPANY_TABLE_NAME = process.env.COMPANY_TABLE_NAME

AWS.config.update({
    region: process.env.AWS_DEFAULT_REGION,
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_KEY_ID
})

const docClient = new AWS.DynamoDB.DocumentClient();

const getUsers = async () => {
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

const getUserById = async (id) => {
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

const loginUser = async (username, password) => {

    const params = {
        TableName: ADMIN_USERS_TABLE_NAME,
    };
    const result = await docClient.scan(params).promise();
    const users = result.Items;

    var loggedInUser=users.find(u => u.username === username && u.password === password);
    return loggedInUser
}

async function addOrUpdateAdminUser(user) {
    const params = {
        TableName: ADMIN_USERS_TABLE_NAME,
        Item: user
    };
    return await docClient.put(params).promise();
}

const changePassword = async (id, oldPassword, newPassword) => {
    try {
        const user =await getUserById(id);

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

//User Table
async function addOrUpdateCompany(company) {
    const params = {
        TableName: COMPANY_TABLE_NAME,
        Item: company
    };

    var result=await docClient.put(params).promise();
    return result
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

const employeeCompany = {
    "id": "1",
    "employeeID": "SHDL00001",
    "companyName": "ABC Company"
}

module.exports = {
    getUsers,
    getUserById,
    loginUser,
    addOrUpdateAdminUser,
    changePassword
}

addOrUpdateCompany(employeeCompany)
// addAdminUser(adminUser)

// getUsers();





