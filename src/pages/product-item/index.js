import { Box, Button, CircularProgress, Container, Grid, Paper } from '@material-ui/core';
import { TextField } from '@mui/material';
import { Form, Formik } from 'formik';
import React, { useContext, useEffect, useState } from 'react';
import { useHistory } from 'react-router';
import Select from '../../components/select';
import Title from '../../components/title';
import { AuthContext } from '../../context/AuthContext';
import api from '../../service/api';
import { request } from '../../service/request';
import { createProductCategoryData, handleAuditLog, handleInputChange, handleInputNumberChange, handlePreventNegative } from '../../utility';
import { API_METHOD } from '../../utility/constant';
import { productItemSchema } from '../../validation/schema';
import { categoryHeadCells } from '../Inventories';
import SkeletonComponent from './skeleton';
import useStyles from './styles';

const ProductItem = (props) => {
  const { match, notify } = props;
  const { id } = match.params;
  const isCreate = id === 'create';
  
  const classes = useStyles();
  const history = useHistory();
  const { state } = useContext(AuthContext);

  const [name, setName] = useState('');
  const [genericName, setGenericName] = useState('');
  const [productNumber, setProductNumber] = useState('');
  const [price, setPrice]         = useState(0);
  const [stock, setStock]         = useState(0);
  const [description, setDescription]  = useState('');
  const [category, setCategory]  = useState('');
  const [categories, setCategories]  = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [categoryError, setCategoryError] = useState(false);
  const [prescription, setPrescription] = useState('No');
  const [prescriptionError, setPrescriptionError] = useState(false);
  const [criticalLevel, setCriticalLevel] = useState(0);
  const [prevVal, setPrev] = useState(null);

  const initialValues = {
    productNumber,
    name,
    genericName,
    price,
    stock,
    description,
    criticalLevel
  }

  const handleSubmit =  async(values, formik) => {
    const { setErrors, setSubmitting } = formik;

    if (!category) {
      setCategoryError('Product Category is required!');
      return;
    }

    let newValues = {
      category: category,
      withPrescription: prescription === 'Yes' ? 1: 0,
      ...values
    }

    if (id) {
      newValues = {
        ...newValues,
        productItemId: id
      }
    }

    try {
      const response = await request({
        url: id ? `${api.PRODUCT_ITEM_API}/update`: `${api.PRODUCT_ITEM_API}/create` ,
        method: id ? API_METHOD.PATCH: API_METHOD.POST,
        data: newValues,
      })

      history.push('/pharmacy/inventories');
      let message = id ? 'updated' : 'created';
      await handleAuditLog(state, id, state.user.storeId, 'products', message, prevVal, {...newValues, withPrescription: prescription})

      notify('success', `The ${response.data.name} has been ${message} successfully!`);
    } catch(error) {
      if (error?.response?.status === 409) {
        setErrors({
          productNumber: 'Product number already exist'
        });
      } else {
        notify('error', `Failed to create a product item!`);
      }
      console.log('ERROR', error)
    } finally {
      setSubmitting(false);
    }
   
    // handleCreate(values, formik);
  }

  const handleCancel = () => {
    history.push('/pharmacy/inventories');
  }

  const handeGetData = async() => {
    setIsLoading(true);
    try {
      const response = await request({
        url: `${api.PRODUCT_ITEMS_API}/${id}`,
        method: API_METHOD.GET,
      })
      const { productNumber, price, name, genericName, description, stock, _links, criticalLevel, withPrescription } = response.data;
      setProductNumber(productNumber);
      setPrice(price);
      setName(name);
      setDescription(description);
      setStock(stock);
      setGenericName(genericName);
      setCriticalLevel(criticalLevel);
      setPrescription(withPrescription === 1 ? 'Yes' : 'No');

      setPrev({
        productNumber, price, name, genericName, description, stock, criticalLevel, withPrescription: withPrescription ? 'Yes' : 'No'
      })
      
      const categoryResponse = await request({
        url: _links.productCategory.href,
        method: API_METHOD.GET,
      })
      const { name: categoryName } = categoryResponse.data;

      setCategory(categoryName);

    } catch (e) {
      console.log('error', e)
    } finally {
      setIsLoading(false);
    }
  }

  const getProps = {
    api: api.PRODUCT_CATEGORIES_BY_STORE_ID_API,
    keyword: '',
    dataFormat: createProductCategoryData,
    columns: categoryHeadCells,
    pageName: 'ProductCategory',
    params: {
      storeId: state.user.storeId
    }
  }

  const getData = async () => {
    // setIsLoading(true);

    let params = {
      ...getProps.params,
      size: 1000,
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
      const { _embedded } = response.data;
      const formattedData = await formatData(_embedded);
      setCategories(formattedData)
    } catch (e) {
      console.log('Error:', e);
    } finally {
      // setIsLoading(false);
    }
  }

  const formatData = async(embedded) => {
    const productCategoryData = await Promise.all(embedded.productCategories.map(async (alumni) => {
      const { name, _links } = alumni;
      const productCategoryId = _links.self.href.replace(`${api.PRODUCT_CATEGORIES_API}/`, '');

      return {
        id: productCategoryId,
        name: name
      }
    }));

    return productCategoryData
  }

  const handleSelectedProgram = (item) => {
    setCategory(item.target.value);
  }

  const handlePrescription = (item) => {
    console.log('item.target.value', item.target.value)
    setPrescription(item.target.value);
  }

  useEffect(() => {
    getData();
    if (id && !isCreate) {
      handeGetData()
    }
  }, [])

  console.log('isLoading', isLoading)
return (
  <Container className={classes.container}>
    <Title name='Product Item'/>
    <Paper className={classes.paper}>
    {
      isLoading ?
        <SkeletonComponent />
        : 
        <Formik
          initialValues={initialValues}
          validationSchema={productItemSchema}
          onSubmit={handleSubmit}
        >
          {
            formik => (
              
              <Form>
                <Grid container spacing={2}>
                  <Grid item lg={6} md={6} sm={12} xs={12}>
                    <TextField
                      fullWidth
                      id="productNumber"
                      label={'Product Number*'}
                      name="productNumber"
                      value={formik.values.productNumber}
                      onChange={handleInputChange(formik, "productNumber")}
                      error={formik.touched.productNumber && Boolean(formik.errors.productNumber)}
                      helperText={formik.touched.productNumber && formik.errors.productNumber}
                    />
                  </Grid>
                  <Grid item lg={6} md={6} sm={12} xs={12}>
                    <TextField
                      fullWidth
                      id="name"
                      label={'Brand Name*'}
                      name="name"
                      value={formik.values.name}
                      onChange={handleInputChange(formik, "name")}
                      error={formik.touched.name && Boolean(formik.errors.name)}
                      helperText={formik.touched.name && formik.errors.name}
                    />
                  </Grid>
                  <Grid item lg={6} md={6} sm={12} xs={12}>
                    <TextField
                      fullWidth
                      id="genericName"
                      label={'Generic Name*'}
                      name="genericName"
                      value={formik.values.genericName}
                      onChange={handleInputChange(formik, "genericName")}
                      error={formik.touched.genericName && Boolean(formik.errors.genericName)}
                      helperText={formik.touched.genericName && formik.errors.genericName}
                    />
                  </Grid>
                  <Grid item lg={6} md={6} sm={12} xs={12}>
                    <Select handleClick={() => {}} error={categoryError} menuItem={categories} label='Product Category*' value={category} handleChange={handleSelectedProgram}/>
                  </Grid>
                  <Grid item lg={3} md={3} sm={6} xs={6}>
                    <TextField
                      fullWidth
                      id="price"
                      label={'Price*'}
                      name="price"
                      type='number'
                      onKeyDown={handlePreventNegative}
                      onChange={handleInputNumberChange(formik, "price")}
                      value={formik.values.price}
                      error={formik.touched.price && Boolean(formik.errors.price)}
                      helperText={formik.touched.price && formik.errors.price}
                    />
                  </Grid>
                  <Grid item lg={3} md={3} sm={6} xs={6}>
                    <Select handleClick={() => {}} error={prescriptionError} menuItem={[{id: 1, name: 'Yes'}, {id: 0, name: 'No'}]} label='Prescription Required?*' value={prescription} handleChange={handlePrescription}/>
                  </Grid>
                  <Grid item lg={3} md={3} sm={6} xs={6}>
                    <TextField
                      fullWidth
                      id="stock"
                      label={'Stock (pcs)*'}
                      name="stock"
                      type='number'
                      value={formik.values.stock}
                      onKeyDown={handlePreventNegative}
                      onChange={handleInputNumberChange(formik, "stock")}
                      error={formik.touched.stock && Boolean(formik.errors.stock)}
                      helperText={formik.touched.stock && formik.errors.stock}
                    />
                  </Grid>      
                  <Grid item lg={3} md={3} sm={6} xs={6}>
                    <TextField
                      fullWidth
                      id="criticalLevel"
                      label={'Critical Level*'}
                      name="criticalLevel"
                      type='number'
                      value={formik.values.criticalLevel}
                      onKeyDown={handlePreventNegative}
                      onChange={handleInputNumberChange(formik, "criticalLevel")}
                      error={formik.touched.criticalLevel && Boolean(formik.errors.criticalLevel)}
                      helperText={formik.touched.criticalLevel && formik.errors.criticalLevel}
                    />
                  </Grid>      
                  <Grid item lg={12} md={12} sm={12} xs={12}>
                    <TextField
                      fullWidth
                      multiline
                      rows={6}
                      id="description"
                      label={'Description*'}
                      name="description"
                      value={formik.values.description}
                      onChange={handleInputChange(formik, "description")}
                      error={formik.touched.description && Boolean(formik.errors.description)}
                      helperText={formik.touched.description && formik.errors.description}
                    />
                  </Grid>
                </Grid>    
                <Box textAlign='center' className={`${classes.buttonContainer} 
                `}>
                  <Button
                    id="cancelButton"
                    onClick={handleCancel} 
                    variant="outlined"
                    color="primary"
                    size='medium'
                    className={classes.button}
                  >
                    Cancel
                  </Button>
                  <Button
                    id="submitButton"
                    type="submit"
                    variant="contained"
                    color="primary"
                    size='medium'
                    className={classes.button}
                  >
                    {
                      formik.isSubmitting ?
                        <CircularProgress color="inherit" size={24}/>
                      :
                        'Submit'
                    }
                  </Button>
                </Box>
              </Form>
            )
          }
          
        </Formik>
    }
    </Paper>
  </Container>
)
}

export default ProductItem