import React, {useCallback, useState} from 'react';
import {AdapterDateFns} from '@mui/x-date-pickers/AdapterDateFns';
import {format, parse} from 'date-fns';
import {TextField} from '@mui/material';
import {
  LocalizationProvider,
  DatePicker, DateTimePicker, TimePicker
} from '@mui/x-date-pickers';
import MuiPhoneNumber from "material-ui-phone-number";
import {Help as HelpIcon} from "@mui/icons-material";
import {Link} from "../index";

export const dateFormat = 'yyyy-MM-dd HH:mm:ss';
export const dateTimeFormat = 'yyyy-MM-dd HH:mm:ss';
export const timeFormat = 'HH:mm:ss';

export default function GeneralField({
                                       type,
                                       onChange,
                                       value: defaultValue,
                                       questionMarkOnClick,
                                       ...props
                                     }) {

  let customFormat = dateFormat, Picker = DatePicker;
  if (type === 'datetime') {
    customFormat = dateTimeFormat;
    Picker = DateTimePicker;
  } else if (type === 'time') {
    customFormat = timeFormat;
    Picker = TimePicker;
  }

  // duplicate the state, the drawback is much smaller than re-render all the form.
  const [value, setValue] = useState(() => {
    if (type === 'date' || type === 'datetime' || type === 'time') {
      if (defaultValue) {
        if (typeof defaultValue === "string")
          return parse(defaultValue, customFormat, new Date());
        else if (typeof defaultValue === "number")
          return new Date(defaultValue);
      } else
        return null;
    }
    return defaultValue || '';
  });

  const handleChange = useCallback(e => {
    const val = e.target.value;
    setValue(val);
    onChange({target: {value: val}});
  }, [onChange, type]);


  const onChangeDate = date => {
    setValue(date);
    try {
      const formattedDate = format(date, customFormat);
      onChange({target: {value: formattedDate}});
    } catch (e) {
      // Clear the date if the input is malformed
      onChange({target: {value: undefined}});
    }
  };

  if (type === 'date' || type === 'datetime' || type === 'time')
    return (
      <div>
        <LocalizationProvider dateAdapter={AdapterDateFns}>
          <Picker
            value={value}
            onChange={onChangeDate}
            onAccept={() => props.onBlur()}
            renderInput={(params) =>
              <TextField {...params}
                         sx={{minWidth: props.minWidth || 350}}
                         margin="normal"
                         required={props.required}
                         error={params.error || props.error}
                         helperText={params.helperText || props.helperText}
                         onBlur={props.onBlur}
              />
            }
            {...props}
          />
        </LocalizationProvider>
        {questionMarkOnClick? <HelpIcon
          cursor={'pointer'}
          onClick={questionMarkOnClick}
          sx={{mt: '32px'}}
          color={"primary"}
        />:<div/>}
      </div>
    );
  else if (type === 'phoneNumber')
    return (
      <div>
        <MuiPhoneNumber
          defaultCountry={'ca'}
          {...props}
          value={value}
          onChange={val => {
            onChange({target: {value: val}});
            setValue(val);
          }}
          // disableAreaCodes
          sx={{mt: '16px', minWidth: 350}}
          variant="outlined"
        />
        {questionMarkOnClick? <HelpIcon
          cursor={'pointer'}
          onClick={questionMarkOnClick}
          sx={{mt: '32px'}}
          color={"primary"}
        />:<div/>}
      </div>
    );
  else
    return (
      <div>
        <TextField
          sx={{mt: '16px', minWidth: 350}}
          type={type}
          {...props}
          onChange={handleChange}
          value={value}
        />
        {questionMarkOnClick? <HelpIcon
          cursor={'pointer'}
          onClick={questionMarkOnClick}
          sx={{mt: '32px'}}
          color={"primary"}
        />:<div/>}


      </div>
    );
}
