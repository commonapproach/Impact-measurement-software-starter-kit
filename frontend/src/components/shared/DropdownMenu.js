import React, { useState } from 'react';
import { useNavigate } from "react-router-dom";
import { IconButton, Menu, MenuItem, ListItemIcon, Typography } from "@mui/material";
import { MoreVert as MoreVertIcon, Edit, Delete, OpenInBrowser } from '@mui/icons-material';
import {navigateHelper} from "../../helpers/navigatorHelper";

const ITEM_HEIGHT = 48;

export default function DropdownMenu({urlPrefix, objectUri, handleDelete, hideViewOption, hideDeleteOption, hideEditOption, indicatorsOption}) {
  const navigator = useNavigate();
  const navigate = navigateHelper(navigator)
  const [anchorEl, setAnchorEl] = useState(null);
  const open = Boolean(anchorEl);
  const handleClick = event => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleLink = link => () => {
    navigate(link);
  };

  return (
    <div>
      <IconButton
        onClick={handleClick}
        size="small"
      >
        <MoreVertIcon/>
      </IconButton>
      <Menu
        id="long-menu"
        anchorEl={anchorEl}
        keepMounted
        open={open}
        onClose={handleClose}
        PaperProps={{
          style: {
            maxHeight: ITEM_HEIGHT * 4.5,
            width: 150,
          },
        }}
      >
        {!hideViewOption &&
        <MenuItem onClick={handleLink(`/${urlPrefix}/${objectUri}/view`)}>
          <ListItemIcon>
            <OpenInBrowser fontSize="small" color="primary"/>
          </ListItemIcon>
          <Typography variant="inherit">View</Typography>

        </MenuItem>
        }

        {!hideEditOption?
          <MenuItem onClick={handleLink(`/${urlPrefix}/${objectUri}/edit`)}>
          <ListItemIcon>
            <Edit fontSize="small" color="primary"/>
          </ListItemIcon>
          Edit
        </MenuItem>:
        <div/>}

        {/*{indicatorsOption?<MenuItem onClick={handleLink(`/indicators/${objectId}`)}>*/}
        {/*  <ListItemIcon>*/}
        {/*    <OpenInBrowser fontSize="small" color="primary"/>*/}
        {/*  </ListItemIcon>*/}
        {/*  <Typography variant="inherit">Indicators</Typography>*/}

        {/*</MenuItem>:<div/>}*/}

        {!hideDeleteOption?
          <MenuItem onClick={() => {
          handleClose();
          handleDelete(objectUri);
        }}>
          <ListItemIcon>
            <Delete fontSize="small" color="secondary"/>
          </ListItemIcon>
          Delete
        </MenuItem>:
          <div/>}

      </Menu>
    </div>
  );
}
