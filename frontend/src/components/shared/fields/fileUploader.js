import React, {useEffect, useState} from 'react';
import {Button, Typography} from "@mui/material";
import {reportErrorToBackend} from "../../../api/errorReportApi";

const Ajv = require("ajv");
export default function FileUploader({title, disabled, onchange, importedError, whenRemovedFile, updateFileName}) {
  const [selectedFile, setSelectedFile] = useState(null);
  const [valid, setValid] = useState(false);
  const [checked, setChecked] = useState(false);
  const [error, setError] = useState(importedError);

  const reader = new FileReader();

  useEffect(() => {
    if (selectedFile) {
      updateFileName(selectedFile.name)
    } else {
      updateFileName('')
    }

  }, [selectedFile])

// set the onload event handler
  reader.onload = function () {
    // this function will be called when the file has been loaded
    // the contents of the file will be available in the result property of the reader object
    try {
      const fileContents = reader.result;
      let parsed_data = JSON.parse(fileContents);
      onchange(parsed_data, selectedFile?.name);
      // expand(parsed_data).then(expanded => {
      //   console.log(expanded)
      // })
      // ajv.addSchema(require('../../../helpers/schemas/outcome.json'), 'cids:Outcome');
      // ajv.addSchema(require('../../../helpers/schemas/indicator.json'), 'cids:Indicator');
      // ajv.addSchema(require('../../../helpers/schemas/theme.json'), 'cids:forTheme');

      // console.log(ajv.validate('cids:Outcome',parsed_data))
      // console.log(ajv.errors)

    //   if (!Array.isArray(parsed_data)) {
    //     parsed_data = [parsed_data];
    //   }
    //
    //   const checkingList = parsed_data.map(object => {
    //     const objectType = object["@type"];
    //     if (objectType && ajv.validate(objectType, object)) {
    //       return true;
    //     } else {
    //       return false;
    //     }
    //   });
    //   if (!checkingList.includes(false)) {
    //     onchange(parsed_data);
    //     setValid(true);
    //   } else {
    //     console.log(ajv.errors);
    //     setValid(false);
    //   }
    //
    //   setChecked(true);
    } catch (e) {
      console.log(e);
      setError(e.message ? 'Not a valid JSON file: ' + e.message : 'Error occurred when validating the file.');
    }

  };


  const handleFileSelect = (event) => {
    setSelectedFile(event.target.files[0]);
    setChecked(false);
    setError(null);
    try {
      reader.readAsText(event.target.files[0]);
    } catch (e) {
      reportErrorToBackend(e);
    }
  };

  const handleRemoveFile = (event) => {
    setSelectedFile(null);
    document.getElementById('file-input').value = '';
    setError('');
    whenRemovedFile();
  };


  return (
    <div>
      <Typography variant={'h6'}> {title} </Typography>
      <input type="file" id={'file-input'} onChange={handleFileSelect} style={{color: 'transparent'}}
             disabled={disabled} accept={'.json'}/>
      {selectedFile ? <div>
        <Typography variant={'subtitle2'} style={{display: 'inline-block',}}> {selectedFile?.name} </Typography>
        <button onClick={handleRemoveFile} style={{display: 'inline-block', marginLeft: '10px'}}>
          Remove File
        </button>
      </div> : <div/>}
      {error ?
        <Typography variant={'subtitle1'} color={'red'}> {error} </Typography> : (selectedFile && checked && !valid) ?
          <Typography variant={'subtitle1'}
                      color={'red'}> {'The file is not valid. Please remove the file.'} </Typography> : ''}

    </div>
  );
}
