#!/usr/bin/env node

/**
 * Test script to verify step selection and response data features
 */

const fs = require('fs');
const path = require('path');

// Test scenario to use
const testScenario = {
  name: "Test Step Selection",
  description: "Testing overview step selection and response data persistence",
  steps: [
    {
      name: "Get User",
      type: "api",
      method: "GET",
      url: "https://jsonplaceholder.typicode.com/users/1",
      expect: [
        { field: "status", operator: "equals", value: 200 },
        { field: "body.id", operator: "equals", value: 1 }
      ]
    },
    {
      name: "Get Posts",
      type: "api", 
      method: "GET",
      url: "https://jsonplaceholder.typicode.com/posts?userId=1",
      expect: [
        { field: "status", operator: "equals", value: 200 },
        { field: "body.length", operator: "gt", value: 0 }
      ]
    },
    {
      name: "Create Post",
      type: "api",
      method: "POST", 
      url: "https://jsonplaceholder.typicode.com/posts",
      headers: {
        "Content-type": "application/json; charset=UTF-8"
      },
      body: {
        title: "Test Post",
        body: "Test body content",
        userId: 1
      },
      expect: [
        { field: "status", operator: "equals", value: 201 }
      ]
    }
  ]
};

// Create test scenarios directory
const testDir = path.join(__dirname, 'test-scenarios');
if (!fs.existsSync(testDir)) {
  fs.mkdirSync(testDir);
}

// Write test scenario
const scenarioPath = path.join(testDir, 'step-selection-test.json');
fs.writeFileSync(scenarioPath, JSON.stringify(testScenario, null, 2));

console.log('✅ Created test scenario at:', scenarioPath);
console.log('\n🚀 To test the new features:');
console.log('1. Run: npm run dev');
console.log('2. Navigate to the test-scenarios directory');
console.log('3. Select the step-selection-test.json scenario');
console.log('4. Use the Overview mode (press 1)');
console.log('5. Test the following new features:');
console.log('   • J/K keys to navigate between steps in overview');
console.log('   • Clear visual highlighting of selected step');
console.log('   • Detailed information for selected step below overview');
console.log('   • Enter key to run the selected step');
console.log('   • C key to copy step data');
console.log('   • Response data persistence after execution');
console.log('\n🔍 Expected behaviors:');
console.log('   • Yellow highlighting should show the currently selected step');
console.log('   • Step details should update when navigating with J/K');
console.log('   • After running a step, response data should remain visible');
console.log('   • Historical execution data should be preserved');
console.log('\nTest completed! Use the interactive mode to verify the fixes.');