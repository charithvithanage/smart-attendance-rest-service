const AWS = require('aws-sdk')
require('dotenv').config();

AWS.config.update({
    region: process.env.AWS_DEFAULT_REGION,
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_KEY_ID
})

const docClient = new AWS.DynamoDB.DocumentClient();
const ADMIN_USERS_TABLE_NAME = "smart-attendance-admin-users";

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

async function addAdminUser(user) {
    const params = {
        TableName: ADMIN_USERS_TABLE_NAME,
        Item: user
    };
    try {
        const result = await docClient.put(params).promise();
        console.log('Scan result:', result.Items);
    } catch (error) {
        console.error('Error scanning table:', error);
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

// addAdminUser(adminUser)

getUsers();





