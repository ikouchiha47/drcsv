// Fetch the file from the given URL
async function fileFromURL(url) {
  try {
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }

    const blob = await response.blob();

    const fileName = url.split('/').at(-1);
    const file = new File([blob], fileName, { type: 'text/csv' });

    // console.log("File object created: ", file, fileName);

    const fileContents = await readFileAsText(file);

    return { file, fileContents };

  } catch (error) {
    console.error("Error while downloading and converting the file: ", error);
  }
}

function readFileAsText(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = function(e) {
      resolve(e.target.result);
    };

    reader.onerror = function() {
      reject(new Error('Error reading file'));
    };

    reader.readAsText(file);
  });
}

export default fileFromURL

// // URL of the CSV file
// const fileUrl = 'https://raw.githubusercontent.com/krishnadey30/LeetCode-Questions-CompanyWise/refs/heads/master/adobe_1year.csv';
//
// // Call the function
// downloadFileAndConvertToFileObject(fileUrl);

