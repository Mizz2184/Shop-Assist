const { exec } = require('child_process');
const path = require('path');
const os = require('os');

// Get the absolute path to the HTML file
const htmlFilePath = path.resolve(__dirname, 'fix-image-url.html');

// Determine the command to open the file based on the operating system
let command;
switch (os.platform()) {
  case 'darwin': // macOS
    command = `open "${htmlFilePath}"`;
    break;
  case 'win32': // Windows
    command = `start "" "${htmlFilePath}"`;
    break;
  case 'linux': // Linux
    command = `xdg-open "${htmlFilePath}"`;
    break;
  default:
    console.error(`Unsupported platform: ${os.platform()}`);
    process.exit(1);
}

console.log('Opening fix instructions in your default browser...');
exec(command, (error) => {
  if (error) {
    console.error(`Error opening the file: ${error.message}`);
    return;
  }
  console.log('Instructions opened in your default browser.');
  console.log('\nFollow the steps in the browser to fix the imageUrl field in the grocery_list table.');
  console.log('After completing the steps, you should be able to see product images in your grocery list.');
}); 