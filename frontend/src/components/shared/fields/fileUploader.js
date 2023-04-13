import React, {useEffect, useState} from 'react';
import {Button, Typography} from "@mui/material";
import {reportErrorToBackend} from "../../../api/errorReportApi";

const Ajv = require("ajv");
export default function FileUploader({title, disabled, onchange, importedError, whenRemovedFile}) {
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
    },

  };

  const ajv = new Ajv();
  // const validators = {
  //   "cids:Indicator": ajv.compile(schemas.Indicator),
  //   "cids:Outcome": ajv.compile(schemas.Outcome),
  //   "cids:IndicatorReport": ajv.compile(schemas["Indicator Report"])
  // }

  const reader = new FileReader();

// set the onload event handler
  reader.onload = function () {
    // this function will be called when the file has been loaded
    // the contents of the file will be available in the result property of the reader object
    try {
      const fileContents = reader.result;
      let parsed_data = JSON.parse(fileContents);
      ajv.addSchema(require('../../../helpers/schemas/outcome.json'), 'cids:Outcome');
      ajv.addSchema(require('../../../helpers/schemas/indicator.json'), 'cids:Indicator');
      ajv.addSchema(require('../../../helpers/schemas/theme.json'), 'cids:forTheme');

      // console.log(ajv.validate('cids:Outcome',parsed_data))
      // console.log(ajv.errors)

      if (!Array.isArray(parsed_data)) {
        parsed_data = [parsed_data];
      }

      const checkingList = parsed_data.map(object => {
        const objectType = object["@type"];
        if (objectType && ajv.validate(objectType, object)) {
          return true;
        } else {
          return false;
        }
      });
      if (!checkingList.includes(false)) {
        onchange(parsed_data);
        setValid(true);
      } else {
        console.log(ajv.errors);
        setValid(false);
      }

      setChecked(true);
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
