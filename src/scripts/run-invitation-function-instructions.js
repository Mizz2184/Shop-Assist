const fs = require('fs');
const path = require('path');

// Read the SQL file
const sqlFilePath = path.join(__dirname, 'create-invitation-acceptance-function.sql');
const sqlContent = fs.readFileSync(sqlFilePath, 'utf8');

console.log('='.repeat(80));
console.log('INSTRUCTIONS FOR CREATING THE INVITATION ACCEPTANCE FUNCTION');
console.log('='.repeat(80));
console.log('\n1. Go to the Supabase dashboard: https://app.supabase.com');
console.log('2. Select your project');
console.log('3. Go to the SQL Editor');
console.log('4. Create a new query');
console.log('5. Copy and paste the following SQL:');
console.log('\n' + '-'.repeat(80));
console.log(sqlContent);
console.log('-'.repeat(80));
console.log('\n6. Run the SQL script');
console.log('7. Return to your application and refresh the page');
console.log('\nThis will create a function to handle invitation acceptance in a transaction.');
console.log('='.repeat(80)); 