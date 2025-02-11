import { Box, Container, Grid, Paper, Typography } from '@material-ui/core';
import AddBoxIcon from '@mui/icons-material/AddBox';
import FileUploadIcon from '@mui/icons-material/FileUpload';
import FilterAltIcon from '@mui/icons-material/FilterAlt';
import React, { useContext, useEffect, useState } from 'react';
import { PieChart } from 'react-minimal-pie-chart';
import { useHistory } from 'react-router';
import OutOfStockIcon from '../../assets/icons/dashboard-icon-out-of-stock.png';
import SalesIcon from '../../assets/icons/dashboard-icon-sales.png';
import CustomerIcon from '../../assets/icons/dashboard-icon-user.png';
import DashboardTile from '../../components/dashboard-tile';
import EnhancedTable from '../../components/table';
import Title from '../../components/title';
import api from '../../service/api';
import { request } from '../../service/request';
import { createHeadCells, createNavigationBarMenu, createPieProductCategoryData, createProductCategoryData, createReservationData } from '../../utility';
import { API_METHOD } from '../../utility/constant';
import useStyles from './styles';
import { AuthContext } from '../../context/AuthContext';
import moment from 'moment';

export const headCells = [
  createHeadCells('reservation_id', false, 'Reservation Id', true, true),
  createHeadCells('customer', false, 'Customer', false, false),
  createHeadCells('productItems', false, 'Product Items', false, false),
  createHeadCells('totalPrice', false, 'Total Price', false, false),
  createHeadCells('date', false, 'Date', false, false),
  createHeadCells('status', false, 'Status', false, false),
]

const colors = ['#E38627', '#C13C37', '#6A2135', '#388138', '#136192', 'orange'];

const Dashboard = () => {
  const classes = useStyles();
  
  const [isLoading, setIsLoading] = useState(false);
  const [data, setData] = useState([]);
  const [order, setOrder] = useState('desc');
  const [orderBy, setOrderBy] = useState(headCells ? headCells[0].id: 'desc');
  const [page, setPage] = useState(0);
  const [total, setTotal]   = useState(0);
  const [selected, setSelected]   = useState(0);
  const [hovered, setHovered]   = useState(null);

  const [totalCustomer, setTotalCustomer] = useState(0);
  const [isLoadingCustomer, setIsLoadingCustomer] = useState(false);

  const [totalSales, setTotalSales] = useState(0);
  const [isLoadingSales, setIsLoadingSales] = useState(false);

  const [totalStock, setTotalStock] = useState(0);
  const [isLoadingStock, setIsLoadingStock] = useState(false);

  const [pieData, setPieData] = useState([]);
  const [isLoadingPie, setIsLoadingPie] = useState(false);

  const { state } = useContext(AuthContext);
  const storeId = parseInt(state.user.storeId);
  
  const history = useHistory();

  const handleRequestSort = (event, property) => {
    const isAsc = orderBy === property && order === 'asc';
    setOrder(isAsc ? 'desc' : 'asc');
    setOrderBy(property);
  };

  const getProps = {
    api: api.RESERVATIONS_API + '/search/findRecentReservation',
    keyword: '',
    dataFormat: createReservationData,
    columns: headCells,
    pageName: 'Reservation',
    params: {
      storeId: storeId
    }
  }

  const getCProps = {
    api: api.PRODUCT_CATEGORIES_BY_STORE_ID_API,
    keyword: '',
    dataFormat: createPieProductCategoryData,
    columns: '',
    pageName: 'ProductCategory',
    params: {
      storeId: storeId
    }
  }

  const getColor = (index)  => {
    return colors[index % colors.length];  // Cycle through the colors
  }

  const formatData = async (embedded) => {
    const transactionHistoryData = await Promise.all(embedded.reservations.map(async(item) => {
      const { _links, totalPrice, ts, status, transactionId } = item;

      const reservationId = _links.self.href.replace(`${api.RESERVATIONS_API}/`, '');
      const nStatus = status === 0 ? 'Pending' : status === 1 ? 'Received' : 'Canceled';
      const secondResponse = await request({
        url: _links.reservationItems.href,
        method: API_METHOD.GET,
      });


      const secondData = secondResponse.data._embedded.reservationItems;
      const itemQuantity = secondData.reduce((sum, item) => sum + (item.quantity), 0);

      const userLink = _links.user.href;
      const fourthResponse = await request({
        url: userLink,
        method: API_METHOD.GET,
      })

      const cName = fourthResponse.data.lastName + ', ' + fourthResponse.data.firstName;
      return getProps.dataFormat(reservationId, cName, itemQuantity, `₱${totalPrice}`, moment(ts).format('LLLL'), nStatus);
    }));

    return transactionHistoryData
  }

  const getData = async () => {
    setIsLoading(true);

    let params = {
      ...getProps.params,
      size: 10,
      page: page,
      sort: `${orderBy},${order}`,
    }

    try {
      const response = await request({
        url     :  getProps.api,
        method  : API_METHOD.GET,
        params  : params,
        headers: {
         'ngrok-skip-browser-warning': 'true'
        }
      })

      if (response.data?.page) {
        const { number, totalElements } = response.data?.page;

        const { _embedded } = response.data;
        const formattedData = await formatData(_embedded);

        if (formattedData.length || number === 0) {
          setPage(number);
        } else {
          setPage(number - 1);
        }
        setData(formattedData);
        setTotal(totalElements);
      } else {
        setData(response.data)
      }

      console.log('response', response)
    } catch (e) {
      console.log('Error:', e);
    } finally {
      setIsLoading(false);
    }
  }

  const handleGetStockCount = async () => {
    setIsLoadingStock(true);
    try {
      const stockResponse = await request({
        url: api.PRODUCT_ITEMS_API + '/search/count',
        method: API_METHOD.GET,
        params: {
          storeId: storeId
        }
      })  

      setTotalStock(stockResponse.data)
    } catch(e) {

    } finally {
      setIsLoadingStock(false);
    }
  }

  const handleGetSaleCount = async () => {
    setIsLoadingSales(true);
    try {
      const salseResponse = await request({
        url: api.TRANSACTIONS_API + '/search/count',
        method: API_METHOD.GET,
        params: {
          storeId: storeId
        }
      }) 

      setTotalSales(salseResponse.data)
    } catch(e) {

    } finally {
      setIsLoadingSales(false);
    }
  }

  const handleGetCount = async () => {
    setIsLoadingCustomer(true);
    try {
      const customerResponse = await request({
        url: api.RESERVATIONS_API + '/search/count',
        method: API_METHOD.GET,
        params: {
          storeId: storeId
        }
      });  

      setTotalCustomer(customerResponse.data)
    } catch(e) {

    } finally {
      setIsLoadingCustomer(false);
    }
  }

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const formatCData = async (embedded) => {
    const productCategoryData = await Promise.all(embedded.productCategories.map((item, idx) => {
      const { name, itemNumber, _links } = item;
      const productCategoryId = _links.self.href.replace(`${api.PRODUCT_CATEGORIES_API}/`, '');

      return getCProps.dataFormat(productCategoryId, name, itemNumber, getColor(idx));
    }));

    return productCategoryData
  }

  const getPieData = async () => {
    setIsLoadingPie(true);

    let params = {
      ...getCProps.params,
      size: 100000,
      page: 0
    }

    try {
      const response = await request({
        url     :  getCProps.api,
        method  : API_METHOD.GET,
        params  : params,
        headers: {
         'ngrok-skip-browser-warning': 'true'
        }
      })

      const { _embedded } = response.data;
      const formattedData = await formatCData(_embedded);

      setPieData(formattedData);
    } catch (e) {
      console.log('Error:', e);
    } finally {
      setIsLoadingPie(false);
    }
  }

  // const pieData = [
  //   { title: 'Liquid', value: 10, color: '#E38627' },
  //   { title: 'Capsules', value: 15, color: '#C13C37' },
  //   { title: 'Tablet', value: 20, color: '#6A2135' },
  //   { title: 'Drops', value: 30, color: '#388138' },
  //   { title: 'Inhaler', value: 13, color: '#136192' },
  //   { title: 'Injections', value: 3, color: 'orange' },
  // ]

  useEffect(() => {
    getData();
    handleGetCount();
    handleGetSaleCount();
    handleGetStockCount();
    getPieData();
    return () => {
      setData([])
    }
  }, [page, order, orderBy]);

  const handleClickGraph = (evt, el) => {
    setSelected(el === selected ? undefined : el);
  }

  console.log('Selected', pieData[selected])

  return (
    <Container className={classes.container}>
      <Title name='Dashboard'/>

      <Grid container spacing={2}>
        <Grid item xl={4} lg={4} md={4} xs={12} sm={12}>
          <DashboardTile isLoading={isLoadingCustomer} icon={CustomerIcon} title='Total Customers' count={totalCustomer} link='/pharmacy/transaction-history'/>
        </Grid>
        <Grid item xl={4} lg={4} md={4} xs={12} sm={12}>
          <DashboardTile isLoading={isLoadingSales} icon={SalesIcon} title='Total Sales' count={`₱${totalSales}`} link='/pharmacy/transaction-history'/>
        </Grid>
        <Grid item xl={4} lg={4} md={4} xs={12} sm={12}>
          <DashboardTile isLoading={isLoadingStock} icon={OutOfStockIcon} title='Out of Stocks' count={totalStock} link='/pharmacy/inventories'/>
        </Grid>
      </Grid>
      <Grid container spacing={2}>
        <Grid item xl={8} lg={8} md={8} xs={12} sm={12}>
          <EnhancedTable
            isLoading={isLoading}
            rows={data}
            headCells={headCells}
            handleRequestSort={handleRequestSort}
            handleChangeRowsPerPage={() => {}}
            handleChangePage={handleChangePage}
            order={order}
            orderBy={orderBy}
            page={page}
            rowsPerPage={10}
            name='Recent Reservation'
            handleView={() => {}}
            handleDelete={() => {}}
            totalItems={total}
            title='Recent Reservation'
          />
        </Grid>
        <Grid item xl={4} lg={4} md={4} xs={12} sm={12}>
          <Paper className={classes.inventoryChart} sx={{ boxShadow: 4}}>
            <Typography variant='h5' style={{padding: '8px', paddingLeft: 0}}>Inventory</Typography>
            <PieChart
              lineWidth={60}
              radius={32}
              segmentsStyle={{ transition: 'stroke .3s', cursor: 'pointer' }}
              segmentsShift={(index) => (index === selected ? 6 : 1)}
              animate
              label={({ dataEntry }) =>  Math.round(dataEntry.percentage) + '%'}
              labelPosition={60}
              labelStyle={{
                fill: '#fff',
                opacity: 0.75,
                pointerEvents: 'none',
                fontSize: '4px'
              }}
              data={pieData}
              onClick={handleClickGraph}
              onMouseOver={(_, index) => {
                setHovered(index);
              }}
              onMouseOut={() => {
                setHovered(undefined);
              }}
            />
            {/* Add label here */}
            <Box>
              {
                pieData[selected] ? 
                <>
                  <Typography variant='h6'>Category: <strong>{pieData[selected]?.title}</strong></Typography>
                  <Typography variant='h6'>Total Item: <strong>{pieData[selected]?.value}</strong></Typography>
                </>
                : <>
                </>
              }
              
            </Box>
            
          </Paper>
        </Grid>
      </Grid>
    </Container>
  )
}

export default Dashboard