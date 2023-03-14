import React, { useState } from 'react';
import {Typography} from "@mui/material";
import {reportErrorToBackend} from "../../../api/errorReportApi";
const Ajv = require("ajv");

export default function FileUploader({title, schema, disabled}) {
  const [selectedFile, setSelectedFile] = useState(null);


  const reader = new FileReader();

// set the onload event handler
  reader.onload = function() {
    // this function will be called when the file has been loaded
    // the contents of the file will be available in the result property of the reader object
    const fileContents = reader.result;
    console.log(fileContents);
    const parsed_data = JSON.parse(fileContents);

    const ajv = new Ajv();
    const validate = ajv.compile(schema);
    const valid = validate(parsed_data);
  };


  const handleFileSelect = (event) => {
    setSelectedFile(event.target.files[0]);
  };

  const handleUpload = () => {
    // You can perform the upload logic here using the selectedFile
    try {
      reader.readAsText(selectedFile);
    } catch (e) {
      reportErrorToBackend(e)

    }

  };

  return (
    <div>
      <Typography variant={'h6'}> {title} </Typography>
      <input type="file" onChange={handleFileSelect} disabled={disabled}/>
      <button onClick={handleUpload} disabled={!selectedFile || disabled}>
        Upload
      </button>
    </div>
  );
}
