import { faArchive, faBell, faBox, faCartPlus, faClockRotateLeft, faGear, faStoreAlt, faTableCellsLarge, faUserGear, faUsersGear } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { Box, Divider, Drawer, List, ListItem, ListItemIcon, ListItemText, Tooltip } from '@material-ui/core';
import React, { useContext, useEffect, useState } from 'react';
import { useHistory } from 'react-router';
import backgroundImage from '../../assets/images/auth-background.jpg';
import useResponsive from '../../hooks/useResponsive';
import { createNavigationBarMenu } from '../../utility';
import NavigationBar from '../navigation-bar';
import useStyles from './styles';
import { AuthContext } from '../../context/AuthContext';
import { Bounce, toast, ToastContainer } from 'react-toastify';
import { faClipboard } from '@fortawesome/free-regular-svg-icons';

const MENU = [
  createNavigationBarMenu('Dashboard', '/pharmacy/dashboard', <FontAwesomeIcon icon={faTableCellsLarge} size="lg" />),
  createNavigationBarMenu('Inventory', '/pharmacy/inventories', <FontAwesomeIcon icon={faArchive} size="lg" />),
  createNavigationBarMenu('Reservation', '/pharmacy/reservations', <FontAwesomeIcon icon={faBox} size="lg" />),
  createNavigationBarMenu('Point of Sale', '/pharmacy/transactions', <FontAwesomeIcon icon={faCartPlus} size="lg" />),
  createNavigationBarMenu('Transaction History', '/pharmacy/transaction-history', <FontAwesomeIcon icon={faClockRotateLeft} size="lg" />, true),
  createNavigationBarMenu('Messages', '/pharmacy/messages', <FontAwesomeIcon icon={faBell} size="lg" />),
  createNavigationBarMenu('User', '/pharmacy/users', <FontAwesomeIcon icon={faUserGear} size="lg" />),
  createNavigationBarMenu('Settings', '/pharmacy/settings', <FontAwesomeIcon icon={faGear} size="lg" />),
  createNavigationBarMenu('Audit Logs', '/pharmacy/audit-logs', <FontAwesomeIcon icon={faClipboard} size="lg" />),
]

const MENU_CASHIER = [
  createNavigationBarMenu('Reservation', '/pharmacy/reservations', <FontAwesomeIcon icon={faBox} size="lg" />),
  createNavigationBarMenu('Point of Sale', '/pharmacy/transactions', <FontAwesomeIcon icon={faCartPlus} size="lg" />),
  createNavigationBarMenu('Transaction History', '/pharmacy/transaction-history', <FontAwesomeIcon icon={faClockRotateLeft} size="lg" />),
  // createNavigationBarMenu('Messages', '/pharmacy/messages', <FontAwesomeIcon icon={faBell} size="lg" />),
]

const MENU_ADMIN = [
  createNavigationBarMenu('Developers', '/pharmacy/system-admins', <FontAwesomeIcon icon={faUsersGear} size="lg" />),
  createNavigationBarMenu('Stores', '/pharmacy/stores', <FontAwesomeIcon icon={faStoreAlt} size="lg" />),
  createNavigationBarMenu('Messages', '/pharmacy/messages', <FontAwesomeIcon icon={faBell} size="lg" />),
  createNavigationBarMenu('Audit Logs', '/pharmacy/audit-logs', <FontAwesomeIcon icon={faClipboard} size="lg" />),
]

const PortalLayout = (props) => {
  const { children } = props;
  const classes = useStyles();
  const history = useHistory();

  const { state } = useContext(AuthContext);
  const { user } = state;

  const { pathname } = history.location;

  const [selectedIndex, setSelectedIndex] = useState(null);

  const { isMobileView, isTabletView } = useResponsive();

  const responsive = isMobileView || isTabletView;
  const handleListItemClick = (index, path) => {
    setSelectedIndex(index);
    history.push(path)
  }

  const posClss = responsive? classes.posMainR : classes.posMain

  const notify = (type, message) => 	{
		const option = {
			position: "top-right",
			autoClose: 5000,
			hideProgressBar: false,
			closeOnClick: true,
			pauseOnHover: true,
			draggable: true,
			progress: undefined,
			theme: "colored",
			transition: Bounce,
		}
		if (type === 'success') {
			toast.success(message, option);
		} else {
			toast.error(message, option);
		}
	}

  const [ isPos, setIsPos ] = useState(false);

  const isProfile = pathname.includes('profile');

  const nMenu = user.role.name === 'PCASHIER' ? MENU_CASHIER : user.role.name === 'ADMIN' ?  MENU_ADMIN : MENU;

  useEffect(() => {
    let title = 'Dashboard';
    let index = 0;
    if (user.role.name === 'PCASHIER') {
      if (pathname.includes('reservations')) {
        index = 0;
        title = 'Reservations';
      } else if (pathname.includes('transactions')) {
        title = 'Transactions';
        index = 1;
      } else if (pathname.includes('transaction-history')) {
        title = 'Transaction History';
        index = 2;
      }
    } else if (user.role.name === 'PADMIN') {
      if (pathname.includes('inventories')) {
        index = 1;
        title = 'Inventories';
      } else if (pathname.includes('reservations')) {
        index = 2;
        title = 'Reservations';
      } else if (pathname.includes('transactions')) {
        title = 'Transactions';
        index = 3;
      } else if (pathname.includes('transaction-history')) {
        title = 'Transaction History';
        index = 4;
      } else if (pathname.includes('messages')) {
        title = 'Messages';
        index = 5;
      } else if (pathname.includes('users')) {
        title = 'Users';
        index = 6;
      } else if (pathname.includes('settings')) {
        title = 'Settings';
        index = 7;
      } else if (pathname.includes('audit-logs')) {
        title = 'Audit Logs';
        index = 8;
      } else if (pathname.includes('profile')) {
        title = 'Profiles';
      } 
    } else if (user.role.name === 'ADMIN') {
      if (pathname.includes('system-admins')) {
        index = 0;
        title = 'System Admins';
      } else if (pathname.includes('stores')) {
        index = 1;
        title = 'Stores';
      } else if (pathname.includes('messages')) {
        title = 'Messages';
        index = 2;
      } else if (pathname.includes('audit-logs')) {
        title = 'Audit Logs';
        index = 3;
      }
    }

    setIsPos(title === 'Transactions');
    setSelectedIndex(index);
    document.title = `Pharmassist - ${title}`;

  }, [pathname]);

  return (
    <> 
      <ToastContainer />
      <NavigationBar isProfile={isProfile} notify={notify}/>
      <Drawer
        variant="permanent"
        open={true}
        className={`${responsive || isProfile ? classes.mDrawer : classes.drawer} ${isPos && classes.pos}`}
      >
        <List className={classes.list}>
          {
            nMenu.map((item, index) => (
              <>
                <div key={'box-panel-' + index}>
                  <Box className={`menu-list-${index}`}>
                    <Tooltip title={item.name}>
                      <ListItem
                        id={item.name}
                        key={index}
                        button
                        style={{ cursor: 'pointer'}}
                        selected={selectedIndex === index}
                        onClick={() => handleListItemClick(index, item.path)}
                        >
                        <ListItemIcon>
                          {
                            item.icon
                          }
                        </ListItemIcon>
                        {
                          isPos ?
                          <></>
                          :
                          <ListItemText primary={item.name}/>
                        }
                      </ListItem>
                    </Tooltip>
                  </Box>
                  <Divider />
                </div>
                {
                  item.hasBorder ?
                    <hr className={classes.border}/>
                  :
                    <></>
                }
              </>
            ))
          }
        </List>
      </Drawer>
      <main>
        <Box className={`${isProfile ? classes.profileMain : responsive ? classes.mMain : classes.main} ${ isPos && posClss}`}> 
          <img className={responsive ? classes.mContentBackground : classes.contentBackground} src={backgroundImage} />
          <Box className={responsive ? '' : classes.content}> 
            {
              children
            }
          </Box>
        </Box>
      </main>
    </>
  )
}

export default PortalLayout