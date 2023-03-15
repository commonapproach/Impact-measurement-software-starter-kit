import React, {useEffect, useState} from 'react';
import {Typography} from "@mui/material";
import {reportErrorToBackend} from "../../../api/errorReportApi";
const Ajv = require("ajv");

export default function FileUploader({title, schema, disabled, onchange, importedError}) {
  const [selectedFile, setSelectedFile] = useState(null);
  const [valid, setValid] = useState(false)
  const [checked, setChecked] = useState(false)
  const [error, setError] = useState(importedError)


  const reader = new FileReader();

  // useEffect(() => {
  //   if (valid) {
  //     onchange(selectedFile)
  //   }
  // }, [valid])

// set the onload event handler
  reader.onload = function() {
    // this function will be called when the file has been loaded
    // the contents of the file will be available in the result property of the reader object
    const fileContents = reader.result;
    console.log(fileContents);
    const parsed_data = JSON.parse(fileContents);

    const ajv = new Ajv();
    const validator = ajv.compile(schema);
    if(validator(parsed_data)){
      setValid(true)
      onchange(parsed_data)
    } else {
      setValid(false)
    }
    setChecked(true)
  };


  const handleFileSelect = (event) => {
    setSelectedFile(event.target.files[0]);
    setError(null)
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
      {error? <Typography variant={'subtitle1'} color={'red'}> { error } </Typography> : (checked && !valid)? <Typography variant={'subtitle1'} color={'red'}> { 'The file is not valid' } </Typography> : ''}

    </div>
  );
}
