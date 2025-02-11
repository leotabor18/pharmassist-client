import { Container } from '@material-ui/core';
import React, { useContext, useEffect, useState } from 'react';
import { useHistory } from 'react-router';
import EnhancedTable from '../../components/table';
import Title from '../../components/title';
import { AuthContext } from '../../context/AuthContext';
import api from '../../service/api';
import { request } from '../../service/request';
import { createAuditLogData, createAuditLogDetails, createHeadCells, createUserData } from '../../utility';
import { API_METHOD } from '../../utility/constant';
import useStyles from './styles';
import moment from 'moment';

export const headCells = [
  createHeadCells('auditLogId', false, 'Audit Log ID', true, true),
  createHeadCells('timeStamp', false, 'Timestamp', false, true),
  createHeadCells('user', false, 'Performed By', false, false),
  createHeadCells('entity', false, 'Entity', false, false),
  createHeadCells('operation', false, 'Operation', false, false),
  createHeadCells('details', false, 'Details', false, false),
]

const AuditLogs = (props) => {
  const classes = useStyles();
  
  const history = useHistory();
  const { state } = useContext(AuthContext);

  const getProps = {
    api: api.USERS_API + '/search/findByStoreId' ,
    keyword: '',
    dataFormat: createAuditLogData,
    pageName: 'AuditLogs',
    params: {
      storeId: state.user.storeId,
    }
  }
  const [data, setData]               = useState([]);
  const [total, setTotal]   = useState(0);
  const [order, setOrder]             = useState('desc');
  const [orderBy, setOrderBy]         = useState(headCells ? headCells[1].id: 'asc');
  const [rowsPerPage, setRowsPerPage] = useState(getProps.params.size ? getProps.params.size : 10);
  const [page, setPage]               = useState(0);
  const [isLoading, setIsLoading]     = useState(false);

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
    const productCategoryData = await Promise.all(embedded.auditLogs.map(async (item) => {
      const { entityName, timeStamp, userId, operation, _links } = item;
      const auditLogId = _links.self.href.replace(`${api.AUDIT_LOGS_API}/`, '');
      
      const userResponse = await request({
        url: api.USERS_API + "/" + userId,
        method: API_METHOD.GET,
      })
      const name = userResponse.data.lastName + ', ' + userResponse.data.firstName;
      const details = createAuditLogDetails(item, name);
      return getProps.dataFormat(auditLogId, moment(timeStamp).format('LLL'), name, entityName.toUpperCase(), operation.toUpperCase(), details);
    }));

    return productCategoryData
  }

  const getData = async () => {
    setIsLoading(true);

    let params = {
      size: rowsPerPage,
      page: page,
      sort: `${orderBy},${order}`,
    }

    if (state?.user.storeId) {
      params = {
        ...params,
        storeId: state?.user.storeId
      }
    }

    try {
      const response = await request({
        url     : state?.user.storeId ?  api.AUDIT_LOGS_API + '/search/findByStoreId':  api.AUDIT_LOGS_API + '/search/findByStoreIdIsNull',
        method  : API_METHOD.GET,
        params: params,
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
  }

  return (
    <Container className={classes.container}>
      <Title name='Audit Logs'/>
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
        name='AuditLogs'
        handleDelete={() => {}}
        totalItems={total}
        onUpdate={onUpdate}
      />
    </Container>
  )
}

export default AuditLogs