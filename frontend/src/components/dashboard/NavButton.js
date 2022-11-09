import {Link} from "../shared";
import {Button} from "@mui/material";
import React from 'react';

export function NavButton({to, text, icon, disabled}) {
  return (
    <Link to={to}>
      <Button
        sx={{
          width: 300,
          height: 100,
          textTransform: 'none',
          margin: 1,
          color: '#535353'
        }}
        disabled={disabled}
        color="inherit"
        variant="outlined"
        startIcon={icon}
        size="large">
        {text}
      </Button>
    </Link>
  );
}