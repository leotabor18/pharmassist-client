import { useContext } from 'react';
import { Redirect, Route, Switch } from 'react-router-dom';
import AuthLayout from '../components/auth-layout';
import PortalLayout from '../components/portal-layout';
import { AuthContext } from '../context/AuthContext';
import Category from '../pages/category';
import Dashboard from '../pages/dashboard';
import ForgotPassword from '../pages/forgot-password';
import Inventories from '../pages/Inventories';
import Login from '../pages/login';
import Messages from '../pages/messages';
import NewPassword from '../pages/new-password';
import ProductItem from '../pages/product-item';
import Profile from '../pages/profile';
import Reservations from '../pages/reservations';
import Settings from '../pages/settings';
import SystemAdmins from '../pages/system-admins';
import TransactionHistory from '../pages/transaction-history';
import Transactions from '../pages/transactions';
import User from '../pages/user';
import Users from '../pages/users';
import RoutesLayout from './RoutesLayout';
import SystemAdmin from '../pages/system-admin';
import Stores from '../pages/stores';
import Store from '../pages/store';
import AuditLogs from '../pages/audit-logs';

const EnhancedSwitch = (props) => {
  const { children } = props

  return (
    <Switch>
      {
        children
      }
      <Route ><Redirect to="/" /></Route>
    </Switch>
  )
}

const Routes = () => {
  const { state } = useContext(AuthContext);
  const { token, user } = state;

  return (
    <Switch>      
        {
          token && user.role.name === 'PADMIN' ?
            <EnhancedSwitch>
              <Route path="/" exact><Redirect to="/pharmacy/dashboard" /></Route>
              <RoutesLayout exact layout={PortalLayout} path="/pharmacy/dashboard" component={Dashboard} />
              <RoutesLayout exact layout={PortalLayout} path="/pharmacy/reservations" component={Reservations} />
              <RoutesLayout exact layout={PortalLayout} path="/pharmacy/inventories" component={Inventories} />
              <RoutesLayout exact layout={PortalLayout} path="/pharmacy/transactions" component={Transactions} />
              <RoutesLayout exact layout={PortalLayout} path="/pharmacy/transactions/update-items/:id" component={Transactions} />
              <RoutesLayout exact layout={PortalLayout} path="/pharmacy/transaction-history" component={TransactionHistory} />
              <RoutesLayout exact layout={PortalLayout} path="/pharmacy/messages" component={Messages} />
              <RoutesLayout exact layout={PortalLayout} path="/pharmacy/users" component={Users} />
              <RoutesLayout exact layout={PortalLayout} path="/pharmacy/users/create" component={User} />
              <RoutesLayout exact layout={PortalLayout} path="/pharmacy/users/update/:id" component={User} />
              <RoutesLayout exact layout={PortalLayout} path="/pharmacy/inventories/create-category" component={Category} />
              <RoutesLayout exact layout={PortalLayout} path="/pharmacy/inventories/update-category/:id" component={Category} />
              <RoutesLayout exact layout={PortalLayout} path="/pharmacy/inventories/create-product" component={ProductItem} />
              <RoutesLayout exact layout={PortalLayout} path="/pharmacy/inventories/update-product/:id" component={ProductItem} />
              <RoutesLayout exact layout={PortalLayout} path="/pharmacy/settings" component={Settings} />
              <RoutesLayout exact layout={PortalLayout} path="/pharmacy/profile" component={Profile} />
              <RoutesLayout exact layout={PortalLayout} path="/pharmacy/audit-logs" component={AuditLogs} />
            </EnhancedSwitch>
          :
            token && user.role.name === 'PCASHIER' ?
              <EnhancedSwitch>
                <Route path="/" exact><Redirect to="/pharmacy/transactions" /></Route>
                <RoutesLayout exact layout={PortalLayout} path="/pharmacy/reservations" component={Reservations} />
                <RoutesLayout exact layout={PortalLayout} path="/pharmacy/transactions" component={Transactions} />
                <RoutesLayout exact layout={PortalLayout} path="/pharmacy/transactions/update-items/:id" component={Transactions} />
                <RoutesLayout exact layout={PortalLayout} path="/pharmacy/transaction-history" component={TransactionHistory} />
                {/* <RoutesLayout exact layout={PortalLayout} path="/pharmacy/messages" component={Messages} /> */}
                <RoutesLayout exact layout={PortalLayout} path="/pharmacy/profile" component={Profile} />
              </EnhancedSwitch>
            : 
            token && user.role.name === 'ADMIN' ?
              <EnhancedSwitch>
                <Route path="/" exact><Redirect to="/pharmacy/stores" /></Route>
                <RoutesLayout exact layout={PortalLayout} path="/pharmacy/stores" component={Stores} />
                <RoutesLayout exact layout={PortalLayout} path="/pharmacy/stores/create" component={Store} />
                <RoutesLayout exact layout={PortalLayout} path="/pharmacy/stores/update/:id" component={Store} />
                <RoutesLayout exact layout={PortalLayout} path="/pharmacy/system-admins" component={SystemAdmins} />
                <RoutesLayout exact layout={PortalLayout} path="/pharmacy/system-admins/update/:id" component={SystemAdmin} />
                <RoutesLayout exact layout={PortalLayout} path="/pharmacy/system-admins/create" component={SystemAdmin} />
                <RoutesLayout exact layout={PortalLayout} path="/pharmacy/messages" component={Messages} />
                <RoutesLayout exact layout={PortalLayout} path="/pharmacy/audit-logs" component={AuditLogs} />
              </EnhancedSwitch>
            : 
              <EnhancedSwitch>
                <RoutesLayout exact layout={AuthLayout} path="/" component={Login} />
                <RoutesLayout exact layout={AuthLayout} path="/forgot-password" component={ForgotPassword} />
                <RoutesLayout exact layout={AuthLayout} path="/new-password/:code" component={NewPassword} />
              </EnhancedSwitch>
        }
    </Switch>
  )
}


export default Routes;