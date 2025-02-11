import { Box, Container, Grid } from '@material-ui/core';
import moment from 'moment/moment';
import React, { useContext, useEffect, useState } from 'react';
import { useHistory } from 'react-router';
import Modal from '../../components/modal';
import SearchBar from '../../components/search-bar';
import EnhancedTable from '../../components/table';
import Title from '../../components/title';
import { AuthContext } from '../../context/AuthContext';
import api from '../../service/api';
import { multipleRequest, request } from '../../service/request';
import { createHeadCells, createReservationData } from '../../utility';
import { API_METHOD } from '../../utility/constant';
import useStyles from './styles';
import { REQUIRED_FIELD } from '../../validation/schema';
import { TextField } from '@mui/material';


export const headCells = [
  createHeadCells('transactionId', false, 'TransactionId', true, true, true),
  createHeadCells('reservationId', false, 'ReservationId', true, true, true),
  createHeadCells('reservationNumber', false, 'Transaction #', true, true),
  createHeadCells('customer', false, 'Customer', false, false),
  createHeadCells('productItems', false, 'Product Items', false, false),
  createHeadCells('totalPrice', false, 'Total Price', false, false),
  createHeadCells('reference', false, 'Payment Reference #', false, false),
  createHeadCells('date', false, 'Scheduled Pickup', false, false),
  createHeadCells('status', false, 'Status', false, false),
  createHeadCells('action', false, 'Action', false, false),
]

const Reservations = (props) => {
  const { notify } = props;

  const classes = useStyles();
  const { state } = useContext(AuthContext);
  const history = useHistory();

  const getProps = {
    api: api.TRANSACTIONS_API,
    keyword: '',
    dataFormat: createReservationData,
    columns: headCells,
    pageName: 'Reservation',
    params: {
      storeId: parseInt(state.user.storeId)
    }
  }

  const [isLoading, setIsLoading]     = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteList, setDeleteList] = useState([]);
  const [deleteIdList, setDeleteIdList] = useState([]);
  const [deleteIdList2, setDeleteIdList2] = useState([]);
  const [deletedTrans, setDeletedTrans] = useState('');
  const [data, setData] = useState([]);
  const [total, setTotal]   = useState(0);
  const [order, setOrder]             = useState('desc');
  const [orderBy, setOrderBy]         = useState(headCells ? headCells[0].id: 'desc');
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [page, setPage]               = useState(0);
  const [keyword, setKeyword] = useState('');
  const [type, setType]= useState('');
  const [reason, setReason]= useState('');
  const [reasonErr, setReasonErr]= useState('');

  const handleDelete = async () => {
    if (type === 'reject') {
      if (!reason) {
        setReasonErr(true);
        return;
      }

      setReasonErr(false);

      await request({
        url: `${api.RESERVATION_API}/${deleteIdList[0]}`,
        method: API_METHOD.PATCH,
        data: {
          status: 3,
          note: reason
        }
      })
      await getData();
      handleCloseDeleteModal();
      notify('success', `The Reservation ${deletedTrans} has been rejected successfully!`);

      return;
    }

    try {
      await multipleRequest(deleteIdList.map(async(value) =>
        await request({
          url: `${api.RESERVATIONS_API}/${parseInt(value)}`,
          method: API_METHOD.DELETE
        })
      )) 
      await multipleRequest(deleteIdList2.map(async(value) =>
        await request({
          url: `${api.TRANSACTIONS_API}/${parseInt(value)}`,
          method: API_METHOD.DELETE
        })
      )) 
      notify('success', `The Reservation ${deletedTrans} has been deleted successfully!`);
      getData();
    } catch(er) {
      notify('error', `Failed to delete reservation ${deletedTrans}!`);
    }

    handleCloseDeleteModal();
  }

  const handleOpenDeleteModal = (values, type) => {
    setType(type);
    setDeleteOpen(true);
    setDeletedTrans(values.id);
    setDeleteIdList([values.reservationId]);
    setDeleteList([values.reservationId])
    setDeleteIdList2([values.transactionId])
  }

  const handleCloseDeleteModal = () => {
    setDeleteOpen(false);
  }

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleRequestSort = (event, property) => {
    const isAsc = orderBy === property && order === 'asc';
    setOrder(isAsc ? 'desc' : 'asc');
    setOrderBy(property);
  };

  const formatData = async (embedded) => {
    const transactionHistoryData = await Promise.all(embedded.reservations.map(async(item) => {
      const { _links, totalPrice, ts, status, transactionId, reference, scheduleTime } = item;

      const reservationId = _links.self.href.replace(`${api.RESERVATIONS_API}/`, '');

      const givenDate = moment(scheduleTime);

        // Get the current time
      const now = moment();

      // Check if more than 24 hours have passed
      const isPast24Hours = now.diff(givenDate, 'hours') >= 24;


      let nStatus = 'Received'

      if (status === 2 && !reference) {
        nStatus = 'Accepted'
      } else if (status === 2 && reference) {
        nStatus = 'Accepted w/ Partial Payment'
      } else if (status === 0 && !reference) {
        nStatus = 'Pending'
      } else if (status === 0 && reference) {
        nStatus = 'Pending w/ Partial Payment'
      } else if (status === 3) {
        nStatus = 'Rejected'
      }

      let date = moment(ts).format('dddd, M/D/YYYY h:mm A');
      if (nStatus !== 'Received') {
        date = moment(scheduleTime).format('dddd, M/D/YYYY h:mm A')
      }

      console.log('scheduleTime', scheduleTime)

      if (isPast24Hours && nStatus !== 'Received') {
        nStatus = nStatus + ' (Expired)'
      }
      // const secondResponse = await request({
      //   url: _links.reservationItems.href,
      //   method: API_METHOD.GET,
      // });

      const response = await request({
        url     :  api.TRANSACTIONS_API + '/'+ transactionId + '/transactionItems',
        method  : API_METHOD.GET,
      })

      const response1 = await request({
        url     :  api.TRANSACTIONS_API + '/'+ transactionId,
        method  : API_METHOD.GET,
      })

      const secondData = response.data._embedded.transactionItems;
      const itemQuantity = secondData.reduce((sum, item) => sum + (item.quantity), 0);

      const userLink = _links.user.href;
      // const reservationId = thirdResponse.data._links.self.href.replace(`${api.RESERVATIONS_API}/`, '');
      const fourthResponse = await request({
        url: userLink,
        method: API_METHOD.GET,
      })

      const cName = fourthResponse.data.lastName + ', ' + fourthResponse.data.firstName;
      return getProps.dataFormat(transactionId, reservationId, response1.data.transactionNum, cName, itemQuantity, `₱${totalPrice}`, reference ? `#${reference}` : '--', date, nStatus);
    }));

    return transactionHistoryData
  }

  const getUrl = (value) => {
    let url = api.RESERVATIONS_API + '/search/findByStoreStoreId'
    if (keyword) {
      url = api.RESERVATIONS_API + '/search/search-reservation';
    }

    return url
  }

  const getData = async () => {
    setIsLoading(true);

    let params = {
      ...getProps.params,
      size: rowsPerPage,
      page: page,
      sort: `${orderBy},${order}`,
    }

    if (keyword) {
      params = {
        ...params,
        lastName: keyword,
        firstName: keyword
      }
    } 

    try {
      const response = await request({
        url     :  getUrl(),
        method  : API_METHOD.GET,
        params  : params,
        headers: {
         'ngrok-skip-browser-warning': 'true'
        }
      })

      if (response.data?.page) {
        const { number, size, totalElements } = response.data?.page;

        const { _embedded } = response.data;
        const formattedData = await formatData(_embedded);

        if (formattedData.length || number === 0) {
          setPage(number);
        } else {
          setPage(number - 1);
        }
        setData(formattedData);
        setRowsPerPage(size);
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

  const handleSearchQuery = (values) => {
    setKeyword(values);
  }

  const handleApprove = async (id) => {
    await request({
      url: `${api.RESERVATION_API}/${id}`,
      method: API_METHOD.PATCH,
      data: {
        status: 2
      }
    })
  }

  useEffect(() => {
    getData();

    return () => {
      setData([])
    }
  }, [page, rowsPerPage, order, orderBy, keyword]);

  const onUpdate = async (value, type) => {
    console.log('value', value)
    if (type === 'approve') {
      await handleApprove(value.reservationId);
      await getData();

      notify('success', `The Reservation with reservation #${value.id} has been approved successfully!`);

      return;
    }

    history.push(`/pharmacy/transactions/update-items/${value.transactionId}`);
  }

  return (
    <Container className={classes.container}>
      <Modal 
        open={deleteOpen} 
        handleClose={handleCloseDeleteModal} 
        handleSubmit={handleDelete} 
        buttonName={type === 'reject' ? 'Reject' : 'Delete'}
        image={''}
        title={type === 'reject' ? 'Reject Reservation' : 'Delete Reservation'}
      >
        <Box className={classes.deleteContent}>
          Are you sure you want to {type === 'reject' ? 'reject' : 'delete'} reservation #{ deletedTrans}?
        </Box>
        {
          type === 'reject' ? 
          <TextField
            fullWidth
            id="reason"
            label={'Reason*'}
            name="reason"
            value={reason}
            onChange={(e) => {
              setReason(e.target.value)
            }}
            error={reasonErr}
            helperText={reasonErr && REQUIRED_FIELD}
          />
          : 
          <></>
        }
      </Modal>
      <Title name='Reservations'/>
      <Grid container>
        <Grid item xl={6} lg={6} md={6} xs={10} sm={6}>
          <SearchBar handleSearchQuery={handleSearchQuery}/>
        </Grid>
      </Grid> 
      <EnhancedTable
        isLoading={isLoading}
        rows={data}
        headCells={headCells}
        handleRequestSort={handleRequestSort}
        handleChangeRowsPerPage={handleChangeRowsPerPage}
        handleChangePage={handleChangePage}
        order={order}
        orderBy={orderBy}
        page={page}
        rowsPerPage={rowsPerPage}
        name='Reservation'
        handleDelete={handleOpenDeleteModal}
        totalItems={total}
        onUpdate={onUpdate}
      />
    </Container>
  )
}


export default Reservations
