import React, { useCallback} from "react";
import { Autocomplete, TextField } from "@mui/material";
import {Help as HelpIcon} from "@mui/icons-material";

export default function Dropdown(props) {
  // options is {labelValue1: label1, labelValue2: label2, ...}
  const {options, label, value, onChange, helperText, required, error, onBlur, disabled, questionMarkOnClick, minWidth} = props;

  const handleChange = useCallback((e, value) => {
    onChange({target: {value}});
  }, [onChange]);

  return (
    <div style={{ display: 'flex', alignItems: 'center' }}>
      <Autocomplete
        sx={{mt: '16px'}}
        multiple
        options={Object.keys(options)}
        onChange={handleChange}
        getOptionLabel={ labelValue=> options[labelValue]}
        defaultValue={value}
        onBlur={onBlur}
        fullWidth
        disabled={disabled}
        renderInput={(params) => (
          <TextField
            {...params}
            required={required}
            label={label}
            sx={{minWidth: minWidth || 350}}
            fullWidth
            helperText={helperText}
            error={error}
          />
        )}
      />
      {questionMarkOnClick?<HelpIcon
        cursor={'pointer'}
        onClick={questionMarkOnClick}
        sx={{mt: '25px'}}
        color={"primary"}
      />:<div/>}


    </div>

  )
}
