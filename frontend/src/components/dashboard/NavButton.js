import {Link} from "../shared";
import {Button} from "@mui/material";
import React from 'react';

export function NavButton({to, text, icon, disabled, buttonWidth, buttonHeight, textSize, color, variant}) {
  return (
    <Link to={to}>
      <Button
        sx={{
          width: buttonWidth || 300,
          height: buttonHeight || 100,
          textTransform: 'none',
          margin: 1,
          color: '#535353'
        }}
        disabled={disabled}
        color={color || "inherit"}
        variant={variant || "outlined"}
        startIcon={icon}
        size={textSize || "large"}>
        {text}
      </Button>
    </Link>
  );
}