import { Box, CircularProgress, Container, IconButton, InputAdornment, Typography } from '@material-ui/core';
import moment from 'moment/moment';
import React, { useContext, useEffect, useRef, useState } from 'react';
import { useHistory } from 'react-router';
import Modal from '../../components/modal';
import EnhancedTable from '../../components/table';
import Title from '../../components/title';
import { AuthContext } from '../../context/AuthContext';
import api from '../../service/api';
import { multipleRequest, request } from '../../service/request';
import { createHeadCells, createTransactionData, handleAuditLog } from '../../utility';
import { API_METHOD } from '../../utility/constant';
import useStyles from './styles';
import { Formik } from 'formik';
import { pinSchema } from '../../validation/schema';
import { TextField } from '@mui/material';
import { Visibility, VisibilityOff } from '@mui/icons-material';


export const headCells = [
  createHeadCells('transaction_id', false, 'Transaction Number', false, false),
  createHeadCells('transactionId', false, 'Transaction Number', false, false),
  createHeadCells('items', false, '# of Items', false, false),
  createHeadCells('ts', false, 'Date', false, true),
  createHeadCells('user', false, 'Processed By', false, true),
  createHeadCells('user', false, 'Authorized By', false, true),
  createHeadCells('totalPrice', false, 'Total Price', false, false),
  createHeadCells('status', false, 'Status', false, false),
  createHeadCells('action', false, 'Action', false, false),
]

const TransactionHistory = (props) => {
  const { notify } = props;

  const classes = useStyles();
  const { state } = useContext(AuthContext);
  const history = useHistory();

  const getProps = {
    api: api.TRANSACTIONS_API,
    keyword: '',
    dataFormat: createTransactionData,
    columns: headCells,
    pageName: 'TransactionHistory',
    params: {
      storeId: parseInt(state.user.storeId)
    }
  }

  const [isLoading, setIsLoading]     = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteList, setDeleteList] = useState([]);
  const [deleteIdList, setDeleteIdList] = useState([]);
  const [data, setData] = useState([]);
  const [total, setTotal]   = useState(0);
  const [order, setOrder]             = useState('desc');
  const [orderBy, setOrderBy]         = useState(headCells ? headCells[0].id: 'desc');
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [page, setPage]               = useState(0);
  const [updateModal, setUpdateModal] = useState(false);
  const [updateId, setUpdateId] = useState(null);
  const [pin, setPin] = useState(null);

  const [isDisabled, setIsdisabled] = useState(false);
  const [isLoading1, setIsLoading1] = useState(false);
  const [name, setName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [type, setType] = useState('');

  const textRef = useRef(null);

  const handleDelete = async () => {
    try {
      await multipleRequest(deleteIdList.map(async(value) =>
        await request({
          url: `${api.TRANSACTIONS_API}/${parseInt(value)}`,
          method: API_METHOD.DELETE
        })
      )) 
      notify('success', `The transaction id ${deleteIdList[0]} has been deleted successfully!`);
      getData();
    } catch(er) {
      notify('error', `Failed to delete transaction id ${deleteIdList[0]}!`);
    }

    handleCloseDeleteModal();
  }

  const handleOpenDeleteModal = (values) => {
    if (state.user.role.name === 'PCASHIER') return;

    setDeleteOpen(true);
    setDeleteIdList([values.id]);
    setDeleteList([values.id])
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

  const getUserById = async(userId) => {
    if (!userId) {
      return 'Deleted user';
    }

    try {
      const response = await request({
        url: `${api.USERS_API}/${userId}`,
        method: API_METHOD.GET,
      });

      const { firstName, lastName } = response.data;
      return `${lastName}, ${firstName}`;
    } catch {
      return 'Deleted user';
    }
  }

  const getAdminById = async(userId) => {
    if (!userId)  {
      return '--'
    }
    try {
      const response = await request({
        url: `${api.USERS_API}/${userId}`,
        method: API_METHOD.GET,
      });

      const { firstName, lastName } = response.data;
      return `${lastName}, ${firstName}`;
    } catch {
      return '--';
    }
  }

  const formatData = async (embedded) => {
    const transactionHistoryData = await Promise.all(embedded.transactions.map(async(item) => {
      const { name, transactionNum, itemNumber, _links, totalPrice, ts, status, whoAdded, authorizedBy } = item;

      const productCategoryId = _links.self.href.replace(`${api.TRANSACTIONS_API}/`, '');
      let nStatus = 'Completed';

      if (status === 0) {
        nStatus = 'Draft';
      } else if (status === 2) {
        nStatus = 'Void';
      }
      // const nStatus = status === 0 ? 'Draft' : 'Completed';
      const secondResponse = await request({
        url: _links.transactionItems.href,
        method: API_METHOD.GET,
      });

      const userName = await getUserById(whoAdded);
      const userName1 = await getAdminById(authorizedBy);
      const secondData = secondResponse.data._embedded.transactionItems;
      const itemQuantity = secondData.reduce((sum, item) => sum + (item.quantity), 0);

      return getProps.dataFormat(productCategoryId, transactionNum, itemQuantity, moment(ts).format('LLLL'), userName, userName1, `₱${totalPrice}`, nStatus);
    }));

    return transactionHistoryData
  }


  const getData = async () => {
    setIsLoading(true);

    let params = {
      ...getProps.params,
      size: rowsPerPage,
      page: page,
      sort: `${orderBy},${order}`,
      statuses: '3, 5'
    }

    try {
      const response = await request({
        url     :  api.TRANSACTIONS_API + '/search/findAllStatusNotIn',
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

  useEffect(() => {
    getData();

    return () => {
      setData([])
    }
  }, [page, rowsPerPage, order, orderBy]);

  const onUpdate = (value) => {
    if (value.status === 'Completed') {
      setUpdateModal(true);
      setUpdateId(value);
      return;
    }

    history.push(`/pharmacy/transactions/update-items/${value.id}`);
  }

  const handleCloseUpdateModal = () => {
    setUpdateModal(false);
  }

  const handleUpdate = async (value) => {
    await request({
      url     :  api.TRANSACTION_API + '/' + updateId.id,
      method  : API_METHOD.PATCH,
      data  : {
        authorizedBy: state.user.userId
      }
    })
    console.log('updateId', updateId)
    await handleAuditLog(state, updateId.id, state.user.storeId, 'transaction history', 'voided', { transactionNumber: updateId.transactionNum, pharmacyAdmin: name} , null)

    setUpdateModal(false);
    notify('success', `The transaction id ${updateId.id} has been void successfully!`);
    getData()
    // history.push(`/pharmacy/transactions/update-items/${updateId.id}`);
  }

  const handleSearchPin = async () => {
    setIsLoading1(true);
    try {
      const response = await request({
        url     :  api.USERS_API + '/search/findByPin',
        method  : API_METHOD.GET,
        params  : {
          pin: pin
        }
      })
      textRef.current.setTouched({ pin: false });
      setName(`${response.data.lastName}, ${response.data.firstName}`)
      setTimeout(() => {
        setIsdisabled(false);
        setIsLoading1(false);
      }, 1000)
    } catch {
      if (textRef.current) {
        const { pin } = textRef.current.values;

        textRef.current.setTouched({ pin: true });
        textRef.current.setErrors({ pin: 'Invalid Admin PIN. Please try again' });
      }
      setIsdisabled(true);
      setIsLoading1(false);
    }
  }

  useEffect(() => {
    if (pin?.length === 6) {
      handleSearchPin();
    } else {
      setIsdisabled(true);
      setName('')
      setIsLoading1(false);
    }
  }, [pin])

  const handleShowPassword = () => {
    setShowPassword(prevValue => !prevValue);
  }

  return (
    <Container className={classes.container}>
      <Title name='Transactions'/>
      <Modal 
        open={deleteOpen} 
        handleClose={handleCloseDeleteModal} 
        handleSubmit={handleDelete} 
        buttonName='Delete'
        image={''}
        title='Delete Transaction History'
      >
        <Box className={classes.deleteContent}>
          Are you sure you want to delete transaction { deleteList.join(', ')}?
        </Box>
      </Modal>
      <Modal 
        open={updateModal} 
        isDisabled={isDisabled}
        handleClose={handleCloseUpdateModal} 
        handleSubmit={handleUpdate} 
        buttonName='Void'
        image={''}
        title='Void Transaction'
      >
        <Box className={classes.deleteContent}>
          Please enter the 6-digit Pharmacy Admin PIN to validate and authorize the transaction void.
        </Box>
        <Formik
            innerRef={textRef}
            initialValues={{ pin }}
            validationSchema={pinSchema}
            onSubmit={handleUpdate}
          >
          {
            formik => (
              <TextField
                fullWidth
                id="pin"
                label={'Admin PIN'}
                name="adminPin"
                type={showPassword ? 'number' : 'password'}
                value={formik.values.pin}
                onChange={(e) => setPin(e.target.value)}
                error={formik.touched.pin && Boolean(formik.errors.pin)}
                helperText={formik.touched.pin && formik.errors.pin}
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton 
                        id="passwordVisibility"
                        aria-label="toggle password visibility"
                        onClick={handleShowPassword}
                        edge="end"
                      >
                        {showPassword ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    </InputAdornment>
                  )
                }}
              />
            )
          }
        </Formik>
        {
          isLoading1 ?
          <CircularProgress color="inherit" size={24}/>
          : 
          <></>
        }
        {
            isDisabled ?
            <></>
          :
            <Typography style={{ fontWeight: 500 }}>Admin: 
              <span style={{ fontWeight: 'bold' }}>{name}</span>
            </Typography>
        }
      </Modal>
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
        name='TransactionHistory'
        handleDelete={handleOpenDeleteModal}
        totalItems={total}
        onUpdate={onUpdate}
      />
    </Container>
  )
}

export default TransactionHistory