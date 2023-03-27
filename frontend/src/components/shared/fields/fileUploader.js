import React, {useEffect, useState} from 'react';
import {Button, Typography} from "@mui/material";
import {reportErrorToBackend} from "../../../api/errorReportApi";

const Ajv = require("ajv");

export default function FileUploader({title, formType, disabled, onchange, importedError, whenRemovedFile}) {
  const [selectedFile, setSelectedFile] = useState(null);
  const [valid, setValid] = useState(false);
  const [checked, setChecked] = useState(false);
  const [error, setError] = useState(importedError);

  const schemas = {
    'Indicator': {
      type: 'object',
      properties: {
        name: {type: 'string'},
        description: {type: 'string'},
        dateCreated: {type: 'string', format: 'time'},
      },
      required: ['name', 'description']
    },
    'Indicator Report': {
      type: 'object',
      properties: {
        name: {type: 'string'},
        comment: {type: 'string'},
        indicatorName: {type: 'string'},
        numericalValue: {type: 'number'},
        unitOfMeasure: {type: 'string'},
        startTime: {type: 'string', format: 'date-time'},
        endTime: {type: 'string', format: 'date-time'},
        dateCreated: {type: 'string', format: 'date-time'},
      },
      required: [
        'name', 'indicatorName', 'numericalValue', 'unitOfMeasure', 'startTime', 'endTime', 'dateCreated'
      ]
    },
    'Outcome': {
      type: 'object',
      properties: {
        name: {type: 'string'},
        description: {type: 'string'},
        themeName: {type: 'string'}
      },
      required: ['name', 'description', 'themeName']
    }
  };


  const reader = new FileReader();

// set the onload event handler
  reader.onload = function () {
    // this function will be called when the file has been loaded
    // the contents of the file will be available in the result property of the reader object
    try{
      const fileContents = reader.result;
      const parsed_data = JSON.parse(fileContents);

      const ajv = new Ajv();
      const validator = ajv.compile(schemas[formType]);
      if (Array.isArray(parsed_data)) {
        const checkingList = parsed_data.map(object => {
          if (validator(object)) {
            onchange(parsed_data);
            return true;
          } else {
            return false;
          }
        });
        if (!checkingList.includes(false)) {
          setValid(true);
        } else {
          setValid(false);
        }
      } else {
        setValid(false);
      }

      setChecked(true);
    } catch (e) {
      setError(e.message || 'Error occurs')
    }

  };


  const handleFileSelect = (event) => {
    console.log(event)
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
    setSelectedFile(null)
    document.getElementById('file-input').value = '';
    whenRemovedFile()
  }

  // const handleUpload = () => {
  //   // You can perform the upload logic here using the selectedFile
  //   try {
  //     reader.readAsText(selectedFile);
  //   } catch (e) {
  //     reportErrorToBackend(e);
  //   }
  //
  // };

  return (
    <div>
      <Typography variant={'h6'}> {title} </Typography>
      <input type="file" id={'file-input'} onChange={handleFileSelect} style={{color: 'transparent'}} disabled={disabled} accept={'.json'}/>
      {selectedFile? <div >
        <Typography variant={'subtitle2'} style={{display: 'inline-block',}}> {selectedFile?.name} </Typography>
        <button onClick={handleRemoveFile} style={{display: 'inline-block', marginLeft: '10px'}}>
          Remove File
        </button>
      </div>: <div/>}
      {error ? <Typography variant={'subtitle1'} color={'red'}> {error} </Typography> : (selectedFile && checked && !valid) ?
        <Typography variant={'subtitle1'} color={'red'}> {'The file is not valid. Please remove the file.'} </Typography> : ''}

    </div>
  );
}
