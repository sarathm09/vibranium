# Vibranium

[![npm version](https://badge.fury.io/js/vibranium-cli.svg)](https://www.npmjs.com/package/vibranium-cli) [![npm](https://img.shields.io/npm/dt/vibranium-cli?style=plastic)](https://www.npmjs.com/package/vibranium-cli)  [![node-current](https://img.shields.io/node/v/vibranium-cli?style=plastic)](https://www.npmjs.com/package/vibranium-cli)

<!-- ![NPM](https://img.shields.io/npm/l/vibranium-cli?style=plastic) ![Lint](https://github.com/sarathm09/vibranium/workflows/Node.js%20Lint/badge.svg) -->

Vibranium is a CLI based API testing and data generation tool built on Node JS.

All the tests in Vibranium are written using JSON, making it readable by any person, irrespective of the programming languages they usually use.


## Top Features

Some of the biggest features of Vibranium are:

- **JSON based tests** JSON is a very simple and maintainable way to represent any data and so writing tests in JSON makes Vibranium very simple and fasts to get started with. This also means that Vibranium tests are easily maintainable.

- **Reusability** One of the biggest issue with API tests and data generation logic is that you have a lot of dependent objects that are reused in multiple places. Once these objects are defined in Vibranium, all you need to do is mention this as the dependency for the other object and the objects become highly reusable.

- **Assertions** Writing assertions in Vibranium is plain simple and supports JS in JSON syntax. We can also fail the tests if the time taken to execute an API exceeds a given value. You can also validate API responses by just specifying the expected schema. Vibranium will run the API, validate it against the schema and report all errors, and so writing tests are pretty easy

- **Simple Data Parsing** Want to parse a JSON response and get some value? You can use simple Javascript dot notation to parse the JSON. You can easily specify to pick a random value in JSON array or to do a map of an array  inside the JSON tests.

- **Data generation tools** Filling dummy data in APIs is pretty easy with Vibranium. You can easily generate Lorem Ipsum strings of given length, random string just by specifying the regex matching it, use inbuilt data sets like names of Harry Potter, Game of Thrones, Star Wars, Marvel, Pokemon and other characters.

- **Reports** HTML, Excel, JUnit and JSON report formats are supported. Vibranium measures the time taken per call for each API endpoint and helps compare the reports of the previous executions. (Check below for a screenshot of the report server UI)

- **Declarative tests** The tests are written in JSON, by mentioning just the required properties of the test and then the expected values. No need to worry about how things work.


## Installation

Vibranium is a Node JS based app, available in npm. To install Vibranium, all you need to do is run the following command in the terminal
```shell
  npm install -g vibranium-cli
``` 

## Getting Started
The following pages will help you in getting started with Vibranium.
- [Introduction](https://sarathm09.github.io/vibranium/)
- [Workspace](https://sarathm09.github.io/vibranium/setup/1.1.workspace/)
- [Collections, Scenarios and Endpoints](https://sarathm09.github.io/vibranium/setup/1.2.collections_scenarios_endpoints/)
- [Installation](https://sarathm09.github.io/vibranium/setup/1.3.installation/)
- [Configuration](https://sarathm09.github.io/vibranium/setup/1.4.configuration/)
- [Writing Tests](https://sarathm09.github.io/vibranium/setup/1.6.write_tests/)


## Documentation

The documentation for Vibranium hosted in Github Pages and is [available here](https://sarathm09.github.io/vibranium/).


## Sample Tests

- Simplest Test: Check if an API is up and running
  ```json
    {
        "name": "01_get_all_users",
        "description": "List all users",
        "url": "/api/v1/users"
    }
    ```
    This JSON snippet is enough to check if the API endpoint `GET /api/v1/users`is up and returns Status code 200


- Check the response of an API by validating it with a schema
  ```json
    {
        "name": "get_all_users",
        "description": "List all users",
        "url": "/api/v1/users",
        "expect": {
            "response": {
                "schema": "!userSchemas/allUsers"
            }
        }
    }
  ```
  This JSON will validate if the response matches the schema specified in `schemas/userSchemas/allUsers.json` file.


- Call the users list api to get all user details and validate if
    - API returns a status code of 200
    - The Time to first byte should be less than 300ms 
    - The total time taken by API should be less than 700ms
    - The response is of content type JSON
    - Response should have more than 10 entries
    - At least one user is admin
    - All users have proper IDs
    ```json
    {
        "name": "get_all_users",
        "description": "List all users",
        "url": "/api/v1/users",
        "method": "GET",
        "expect": {
            "status": 200,
            "headers": {
                "content-type": "application/json"
            },
            "response": {
                "There should be more than 10 users": "{response.length} > 10",
                "At least one user should be admin": "{response.all.isAdmin}.filter(isAdmin => isAdmin).length >= 1",
                "All users have an ID of 32 characters": "{response.all.id}.every(id => id.length === 32)"
            },
            "timing": {
                "total": "<700",
                "firstByte": "<300"
            }
        }
    }
    ```


- Create 10 new users and the validate if
    - API returns a status code of 200
    - The Time to first byte should be less than 300ms 
    - The total time taken by API should be less than 700ms
    - The response is of content type JSON
    - User name should be same as in the payload
    - User Id should be valid
    - User should not be admin

    ```json
        {
        "name": "create_user",
        "description": "Create new User",
        "url": "/api/v1/users",
        "method": "POST",
        "variables": {
            "userName": "{dataset.names}"
        },
        "payload": {
            "name": "{userName}"
        },
        "repeat": 10,
        "expect": {
            "status": 200,
            "headers": {
                "content-type": "application/json"
            },
            "response": {
                "User ID is valid": "{response.id.length} === 32",
                "User name should be same as input": "'{response.name}' === '{userName}'",
                "User should not be an admin": "{response.isAdmin} === false"
            },
            "timing": {
                "total": "<700",
                "firstByte": "<300"
            }
        }
    }
    ```


- Update a user and validate if
    - API returns a status code of 200
    - The Time to first byte should be less than 300ms 
    - The total time taken by API should be less than 700ms
    - The response is of content type JSON
    - User name should be same as in the payload
    - User Id should be valid
    - User should not be admin

    ```json
    {
        "name": "update_user_details",
        "description": "Update user details",
        "url": "/api/v1/users/{userId}",
        "method": "PUT",
        "variables": {
            "newUserName": "{dataset.names}"
        },
        "payload": {
            "name": "{newUserName}"
        },
        "dependencies":[
        {
            "api": "02_create_user",
            "variable": {
                "userId": "response.id",
                "oldUserName": "response.name"
            }
        }  
        ],
        "expect": {
            "status": 200,
            "headers": {
                "content-type": "application/json"
            },
            "response": {
                "User ID is valid": "'{response.id}' === '{userId}'",
                "User name should be same as input": "'{response.name}' === '{newUserName}'",
                "User should not be an admin": "{response.isAdmin} === false"
            },
            "timing": {
                "total": "<700",
                "firstByte": "<300"
            }
        }
    }
    ```
    

> More examples available in the [documentation](https://sarathm09.github.io/vibranium/).


<!-- ## Sample report
![Sample report UI](docs/assets/images/vc_ui.png) -->

## Contributing to the Project

If you would like to contribute to the project development, you're always welcome. Feel free to make changes and raise a PR, and/or raise issues in GitHub.
