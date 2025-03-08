const { exec } = require('child_process');
const path = require('path');
const os = require('os');

// Get the absolute path to the HTML file
const htmlFilePath = path.join(__dirname, 'fix-database.html');

// Determine the command based on the operating system
let command;
if (os.platform() === 'darwin') {
  // macOS
  command = `open "${htmlFilePath}"`;
} else if (os.platform() === 'win32') {
  // Windows
  command = `start "" "${htmlFilePath}"`;
} else {
  // Linux and others
  command = `xdg-open "${htmlFilePath}"`;
}

console.log(`Opening ${htmlFilePath} in your default browser...`);

// Execute the command
exec(command, (error, stdout, stderr) => {
  if (error) {
    console.error(`Error opening file: ${error.message}`);
    return;
  }
  if (stderr) {
    console.error(`stderr: ${stderr}`);
    return;
  }
  console.log('Browser opened successfully.');
});

// Also provide instructions for accessing the admin page directly
console.log('\nAlternatively, you can access the admin page directly at:');
console.log('http://localhost:3006/api/admin/recreate-table');
console.log('\nOr use the fix-database page:');
console.log('http://localhost:3006/fix-database'); 