import { faAddressBook, faBell, faGear, faBox, faSignIn, faSignOut, faUser, faUserEdit, faStoreAlt, faUsersGear, faUserGraduate, faTableCellsLarge, faArchive, faCartPlus, faClockRotateLeft, faUserGear } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { AppBar, Badge, Box, IconButton, Tooltip } from '@material-ui/core';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import MenuIcon from '@mui/icons-material/Menu';
import NotificationsIcon from '@mui/icons-material/Notifications';
import { Container, Toolbar, Typography } from '@mui/material';
import React, { useContext, useState } from 'react';
import { useHistory } from 'react-router';
import logo from '../../assets/images/logo-name.png';
import useResponsive from '../../hooks/useResponsive';
import { createNavigationBarMenu } from '../../utility';
import DropDownMenu from '../drop-down-menu';
import useStyles from './styles';
import SearchBar from '../search-bar';
import { AuthContext } from '../../context/AuthContext';
import { LOGOUT } from '../../reducer/AuthReducer';

const NAVIGATION_BAR_MENU = [
  createNavigationBarMenu('Profile', '/pharmacy/profile', <FontAwesomeIcon icon={faUserEdit} size="lg" />),
  createNavigationBarMenu('Logout', '/', <FontAwesomeIcon icon={faSignOut} size="lg" />)
]

const MOBILE_NAVIGATION_BAR_MENU = [
  createNavigationBarMenu('Dashboard', '/pharmacy/dashboard', <FontAwesomeIcon icon={faTableCellsLarge} size="lg" />),
  createNavigationBarMenu('Inventory', '/pharmacy/inventories', <FontAwesomeIcon icon={faArchive} size="lg" />),
  createNavigationBarMenu('Reservation', '/pharmacy/reservations', <FontAwesomeIcon icon={faBox} size="lg" />),
  createNavigationBarMenu('Point of Sale', '/pharmacy/transactions', <FontAwesomeIcon icon={faCartPlus} size="lg" />),
  createNavigationBarMenu('Transaction History', '/pharmacy/transaction-history', <FontAwesomeIcon icon={faClockRotateLeft} size="lg" />, true),
  createNavigationBarMenu('Messages', '/pharmacy/messages', <FontAwesomeIcon icon={faBell} size="lg" />),
  createNavigationBarMenu('User', '/pharmacy/users', <FontAwesomeIcon icon={faUserGear} size="lg" />),
  createNavigationBarMenu('Settings', '/pharmacy/settings', <FontAwesomeIcon icon={faGear} size="lg" />),
]

const MENU_CASHIER = [
  createNavigationBarMenu('Reservation', '/pharmacy/reservations', <FontAwesomeIcon icon={faBox} size="lg" />),
  createNavigationBarMenu('Point of Sale', '/pharmacy/transactions', <FontAwesomeIcon icon={faCartPlus} size="lg" />),
  createNavigationBarMenu('Transaction History', '/pharmacy/transaction-history', <FontAwesomeIcon icon={faClockRotateLeft} size="lg" />),
  createNavigationBarMenu('Messages', '/pharmacy/messages', <FontAwesomeIcon icon={faBell} size="lg" />),
]

const MENU_ADMIN = [
  createNavigationBarMenu('System Admins', '/pharmacy/system-admins', <FontAwesomeIcon icon={faUsersGear} size="lg" />),
  createNavigationBarMenu('Stores', '/pharmacy/stores', <FontAwesomeIcon icon={faStoreAlt} size="lg" />),
  createNavigationBarMenu('Messages', '/pharmacy/messages', <FontAwesomeIcon icon={faBell} size="lg" />),
]

const PROFILE_MENU = [
  createNavigationBarMenu('Profile', '/portal/profile', <FontAwesomeIcon icon={faUser} size="lg" />),
  createNavigationBarMenu('Settings', '/portal/profile/settings', <FontAwesomeIcon icon={faGear} size="lg" />),
  createNavigationBarMenu('Logout', '/portal', <FontAwesomeIcon icon={faSignOut} size="lg" />)
]


const NavigationBar = (props) => {
  const { isProfile, isPublic, notify } = props;
  const { dispatch : authDispatch, state } = useContext(AuthContext);

  const { user } = state;

  const classes = useStyles();
  const { isMobileView, isResponsive, isTabletView } = useResponsive();

  const nMenu = user.role.name === 'PCASHIER' ? MENU_CASHIER : user.role.name === 'ADMIN' ?  MENU_ADMIN : MOBILE_NAVIGATION_BAR_MENU;

  const menu = isProfile ? PROFILE_MENU : isResponsive ? nMenu :  NAVIGATION_BAR_MENU;

  const history = useHistory();

  const [anchorElUser, setAnchorElUser] = useState(null);
  const [anchorElNotif, setAnchorElNotif] = useState(null);
  const [anchorElPublic, setAnchorElPublic] = useState(null);

  const handleOpenUserMenu = (event) => {
    setAnchorElUser(event.currentTarget);
  };

  const handleOpenNotification = (event) => {
    setAnchorElNotif(event.currentTarget);
  };

  const handleOpenPublicMenu = (event) => {
    setAnchorElPublic(event.currentTarget);
  }

  const handleClosenNotification = (event) => {
    setAnchorElNotif(null);
  };

  const handleCloseUserMenu = () => {
    setAnchorElUser(null);
  };

  const handleClosePublicMenu = () => {
    setAnchorElPublic(null);
  };

  const handleProfileItemClick = (path) => {
    setAnchorElUser(null);

    if (path === '/') {
      signOut();
    } else if (path.includes('profile')) {
      notify('success', `This page is under development`);
      return;
    }
    history.push(path)
  }
 
  const signOut = () => {
    console.log('Logging out')
    authDispatch({
      type : LOGOUT
    });
  }


  const handlePublicItemClick = (path) => {
    setAnchorElPublic(null);
    history.push(path)
  }

  const handleNotificationItemClick = (path) => {
    console.log('handleNotificationItemClick')
  }

  const handleHome = () => {
    history.push('/')
    console.log('first')
  }

  return (
    <AppBar position="relative" color='transparent' sx={{ boxShadow: 2 }} style={{boxShadow: '0px 2px 4px -1px rgba(0, 0, 0, 0.2), 0px 4px 5px 0px rgba(0, 0, 0, 0.14), 0px 1px 10px 0px rgba(0, 0, 0, 0.12)'}}>
      <Container className={classes.appBarContainer} >
        <Toolbar disableGutters>
          <Typography
            variant="h6"
            noWrap
            component="a"
            href='/'
            onClick={handleHome}
            sx={{
              mr: 2,
              display: { xs: 'none', md: 'flex' },
              fontFamily: 'monospace',
              fontWeight: 700,
              letterSpacing: '.3rem',
              color: 'inherit',
              textDecoration: 'none',
            }}
          >
            <img onClick={handleHome} className={classes.logo} src={logo} alt='pharmassist Logo' />
          </Typography>
          <Typography
            variant="h5"
            noWrap
            href='/'
            component="a"
            onClick={handleHome}
            sx={{
              mr: 2,
              display: { xs: 'flex', md: 'none' },
              flexGrow: 1,
              fontFamily: 'monospace',
              fontWeight: 600,
              letterSpacing: '.3rem',
              color: 'inherit',
              textDecoration: 'none',
            }}
          >
             <img onClick={handleHome} className={classes.mLogo} src={logo} alt='pharmassist Logo' />
          </Typography>
          <Box className={classes.profile} sx={{ flexGrow: 0 }}>
            {
              !isMobileView && !isTabletView ? 
              <Typography>Hi, {user?.firstName} {user?.lastName}</Typography>
              :
              <></>
            }
            <Tooltip title="Profile settings">
              <IconButton onClick={handleOpenUserMenu} sx={{ p: 0 }}>
                {
                  isMobileView ? 
                    <MenuIcon className={classes.buttonIcon} alt="Menu" fontSize='large' />
                  :
                    <AccountCircleIcon className={classes.buttonIcon} alt="Profile" fontSize='large' />
                }
              </IconButton>
            </Tooltip>
            </Box>
            <DropDownMenu
              menu={menu} 
              anchorEl={anchorElUser}
              handleCloseMenu={handleCloseUserMenu}
              handleItemClick={handleProfileItemClick}
            />
        </Toolbar>
      </Container>
    </AppBar>
  )
}

export default NavigationBar