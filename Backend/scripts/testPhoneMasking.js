/**
 * Test Script: Phone Number Masking Utility
 * 
 * This script tests the phone masking functionality
 * 
 * Usage: node Backend/scripts/testPhoneMasking.js
 */

const { maskPhoneNumber, isValidPhoneNumber } = require('../utils/phoneUtils');

console.log('='.repeat(60));
console.log('Phone Number Masking Test');
console.log('='.repeat(60));

// Test cases
const testCases = [
    { input: '9876543210', expected: 'xxxxx10' },
    { input: '+919876543210', expected: 'xxxxx10' },
    { input: '1234567890', expected: 'xxxxx90' },
    { input: '98765', expected: 'xxxxx65' },
    { input: '12', expected: 'xxxxx12' },
    { input: '1', expected: 'xxxxx' },
    { input: '', expected: '' },
    { input: null, expected: '' },
    { input: undefined, expected: '' }
];

console.log('\nMasking Tests:');
console.log('-'.repeat(60));

let passed = 0;
let failed = 0;

testCases.forEach((test, index) => {
    const result = maskPhoneNumber(test.input);
    const status = result === test.expected ? '✅ PASS' : '❌ FAIL';
    
    if (result === test.expected) {
        passed++;
    } else {
        failed++;
    }
    
    console.log(`${index + 1}. ${status}`);
    console.log(`   Input:    "${test.input}"`);
    console.log(`   Expected: "${test.expected}"`);
    console.log(`   Got:      "${result}"`);
    console.log();
});

console.log('='.repeat(60));
console.log(`Results: ${passed} passed, ${failed} failed`);
console.log('='.repeat(60));

// Validation tests
console.log('\nValidation Tests:');
console.log('-'.repeat(60));

const validationTests = [
    { input: '9876543210', expected: true },
    { input: '+919876543210', expected: true },
    { input: '123456789012345', expected: true },
    { input: '123', expected: false },
    { input: '', expected: false },
    { input: null, expected: false },
    { input: 'abcdefghij', expected: false }
];

let validPassed = 0;
let validFailed = 0;

validationTests.forEach((test, index) => {
    const result = isValidPhoneNumber(test.input);
    const status = result === test.expected ? '✅ PASS' : '❌ FAIL';
    
    if (result === test.expected) {
        validPassed++;
    } else {
        validFailed++;
    }
    
    console.log(`${index + 1}. ${status}`);
    console.log(`   Input:    "${test.input}"`);
    console.log(`   Expected: ${test.expected}`);
    console.log(`   Got:      ${result}`);
    console.log();
});

console.log('='.repeat(60));
console.log(`Results: ${validPassed} passed, ${validFailed} failed`);
console.log('='.repeat(60));

// Overall summary
const totalTests = testCases.length + validationTests.length;
const totalPassed = passed + validPassed;
const totalFailed = failed + validFailed;

console.log('\nOverall Summary:');
console.log(`  Total Tests: ${totalTests}`);
console.log(`  Passed: ${totalPassed}`);
console.log(`  Failed: ${totalFailed}`);
console.log(`  Success Rate: ${((totalPassed / totalTests) * 100).toFixed(2)}%`);
console.log('='.repeat(60));

process.exit(totalFailed > 0 ? 1 : 0);
