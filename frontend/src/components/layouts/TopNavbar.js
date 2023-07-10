import React, {useState, useContext, useCallback} from 'react';
import {useNavigate} from 'react-router-dom';
import {AppBar, Toolbar, Typography, Menu, MenuItem, ListItemIcon} from '@mui/material';
import {IconButton} from "@mui/material";
import {logout} from '../../api/auth';
import {UserContext, defaultUserContext} from "../../context";
import MenuIcon from '@mui/icons-material/Menu';
import AccountCircleSharpIcon from '@mui/icons-material/AccountCircleSharp';
import ReportIcon from '@mui/icons-material/Report';
import ManageAccountsIcon from '@mui/icons-material/ManageAccounts';
import DashboardIcon from '@mui/icons-material/Dashboard';
import LogoutIcon from '@mui/icons-material/Logout';
import GroupsIcon from '@mui/icons-material/Groups';
import LocationCityIcon from '@mui/icons-material/LocationCity';
import BusinessCenterIcon from '@mui/icons-material/BusinessCenter';
import LoginIcon from '@mui/icons-material/Login';
import OutputIcon from '@mui/icons-material/Output'
import DragIndicatorIcon from '@mui/icons-material/DragIndicator';
import SummarizeIcon from '@mui/icons-material/Summarize';
import {Domain, Download, Edit, FileUpload, People} from "@mui/icons-material";

const ITEM_HEIGHT = 48;

/**
 * This is the TopNavBar shows on every page.
 * @returns {JSX.Element}
 * @constructor
 */
function TopNavBar() {
  const navigate = useNavigate();
  const userContext = useContext(UserContext);
  const uri = userContext.uri;
  const isLoggedin = !!userContext.email;

  const [anchorElLeft, setAnchorElLeft] = useState(null);
  const [anchorElRight, setAnchorElRight] = useState(null);
  const openLeft = Boolean(anchorElLeft);
  const openRight = Boolean(anchorElRight);

  const handleClickLeft = event => {
    setAnchorElLeft(event.currentTarget);
  };
  const handleCloseLeft = () => {
    setAnchorElLeft(null);
  };
  const handleClickRight = event => {
    setAnchorElRight(event.currentTarget);
  };
  const handleCloseRight = () => {
    setAnchorElRight(null);
  };

  const handleLink = useCallback(link => () => {
    setAnchorElLeft(null);
    setAnchorElRight(null);
    navigate(link);
  }, []);

  const handleLogout = async () => {
    if (isLoggedin)
      await logout();
    userContext.updateUser(defaultUserContext);
    setAnchorElLeft(null);
    setAnchorElRight(null);
    navigate('/login/superPassword');
  }

  return (
    <AppBar position="fixed" sx={{backgroundColor: 'rgb(39, 44, 52)'}}>

      {/*Burger Menu*/}
      <Toolbar variant="dense">
        {isLoggedin ? (
          <div style={{flexGrow: 1}}>
            <IconButton
              onClick={handleClickLeft}
              size="small"
              style={{color: 'white'}}
            >
              <MenuIcon/>
            </IconButton>
            <Menu
              id="function-menu"
              anchorEl={anchorElLeft}
              keepMounted
              open={openLeft}
              onClose={handleCloseLeft}
              PaperProps={{
                style: {
                  maxHeight: ITEM_HEIGHT * 7,
                  width: 200,
                },
              }}
            >

              {userContext.isSuperuser || userContext.groupAdminOfs.length?
                <MenuItem onClick={handleLink(`/groups`)}>
                <ListItemIcon>
                  <People fontSize="medium" sx={{color: 'black'}}/>
                </ListItemIcon>
                <Typography variant="inherit">Groups</Typography>
              </MenuItem>:<div/>}

              {userContext.isSuperuser || userContext.groupAdminOfs.length || userContext.administratorOfs.length?
                <MenuItem onClick={handleLink(`/organizations`)}>
                  <ListItemIcon>
                    <People fontSize="medium" sx={{color: 'black'}}/>
                  </ListItemIcon>
                  <Typography variant="inherit">Organizations</Typography>
                </MenuItem>:<div/>}

              {userContext.isSuperuser?
                <MenuItem onClick={handleLink(`/users`)}>
                  <ListItemIcon>
                    <People fontSize="medium" sx={{color: 'black'}}/>
                  </ListItemIcon>
                  <Typography variant="inherit">Users</Typography>
                </MenuItem>:<div/>}

              <MenuItem onClick={handleLink(`/organization-indicators`)}>
                <ListItemIcon>
                  <DragIndicatorIcon fontSize="medium" sx={{color: 'black'}}/>
                </ListItemIcon>
                <Typography variant="inherit">Indicators</Typography>
              </MenuItem>

              <MenuItem onClick={handleLink(`/organization-outcomes`)}>
                <ListItemIcon>
                  <OutputIcon fontSize="medium" sx={{color: 'black'}}/>
                </ListItemIcon>
                <Typography variant="inherit">Outcomes</Typography>
              </MenuItem>

              <MenuItem onClick={handleLink(`/organization-indicatorReports`)}>
                <ListItemIcon>
                  <SummarizeIcon fontSize="medium" sx={{color: 'black'}}/>
                </ListItemIcon>
                <Typography variant="inherit">Indicator Reports</Typography>
              </MenuItem>

              <MenuItem onClick={handleLink(`/themes`)}>
                <ListItemIcon>
                  <Domain fontSize="medium" sx={{color: 'black'}}/>
                </ListItemIcon>
                <Typography variant="inherit">Themes</Typography>
              </MenuItem>

              <MenuItem onClick={handleLink(`/fileUploading`)}>
                <ListItemIcon>
                  <FileUpload fontSize="medium" sx={{color: 'black'}}/>
                </ListItemIcon>
                <Typography variant="inherit">File Upload</Typography>
              </MenuItem>

              <MenuItem onClick={handleLink(`/reportGenerate`)}>
                <ListItemIcon>
                  <Download fontSize="medium" sx={{color: 'black'}}/>
                </ListItemIcon>
                <Typography variant="inherit">Reports</Typography>
              </MenuItem>


            </Menu>
          </div>
        ) : null}

        <Typography variant="h6" component="div" sx={{flexGrow: 1}}>
         Common Approach Sandbox
        </Typography>

        {/*The profile button containing dashboard, profile, logout/login*/}
        {isLoggedin ? (
          <div>
            <IconButton
              onClick={handleClickRight}
              size="small"
              style={{color: 'white'}}
            >
              <AccountCircleSharpIcon/>
            </IconButton>
            <Menu
              id="user-menu"
              anchorEl={anchorElRight}
              keepMounted
              open={openRight}
              onClose={handleCloseRight}
              PaperProps={{
                style: {
                  maxHeight: ITEM_HEIGHT * 4.5,
                  width: 150,
                },
              }}
            >
              <MenuItem onClick={handleLink(`/dashboard`)}>
                <ListItemIcon>
                  <DashboardIcon fontSize="medium" sx={{color: 'black'}}/>
                </ListItemIcon>
                <Typography variant="inherit">Dashboard</Typography>
              </MenuItem>

              <MenuItem onClick={handleLink('/profile/' + uri + '/')}>
                <ListItemIcon>
                  <ManageAccountsIcon fontSize="medium" sx={{color: 'black'}}/>
                </ListItemIcon>
                <Typography variant="inherit">Profile</Typography>
              </MenuItem>

              <MenuItem onClick={handleLogout}>
                <ListItemIcon>
                  <LogoutIcon fontSize="medium" sx={{color: 'black'}}/>
                </ListItemIcon>
                <Typography variant="inherit">
                  {isLoggedin ? 'Log out' : 'Login'}
                </Typography>
              </MenuItem>
            </Menu>
          </div>
        ) : (
          <div>
            <MenuItem onClick={handleLogout}>
              <ListItemIcon>
                <LoginIcon fontSize="medium" sx={{color: 'white'}}/>
              </ListItemIcon>
              <Typography variant="inherit">
                {isLoggedin ? 'Log out' : 'Login'}
              </Typography>
            </MenuItem>
          </div>
        )}

      </Toolbar>
    </AppBar>
  )
}

export default TopNavBar;
