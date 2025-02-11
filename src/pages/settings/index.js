import { Box, Button, CircularProgress, Container, Divider, FormControlLabel, FormGroup, Grid, IconButton, InputAdornment, Link, Paper, Switch, Typography } from '@material-ui/core';
import React, { useCallback, useContext, useEffect, useState } from 'react';
import Title from '../../components/title';
import useStyles from './styles';
import { Form, Formik } from 'formik';
import { settingsSchema } from '../../validation/schema';
import { Visibility, VisibilityOff } from '@mui/icons-material';
import { useHistory } from 'react-router';
import { TextField } from '@mui/material';
import { AuthContext } from '../../context/AuthContext';
import api from '../../service/api';
import { request } from '../../service/request';
import { API_METHOD } from '../../utility/constant';
import Loading from '../../components/loading';
import SkeletonComponent from './skeleton';
import { GoogleMap, Marker, useJsApiLoader } from '@react-google-maps/api';
import TimeInput from 'material-ui-time-picker'
import moment from 'moment';
import colors from '../../themes/colors';
import Modal from '../../components/modal';
import paymentIcon from '../../assets/images/payment.svg'
import { handleAuditLog, handleInputChange, handleInputNumberChange, isValidPhoneNumber } from '../../utility';

const OperatingItem = (props) => {
  const { name, item, handleOperation } = props;
  const [isCheck, setIsCheck] = useState(item.isCheck);
  const [time, setTime] = useState(item.fromHour);
  const [timeUntil, setTimeUntil] = useState(item.untilHour);

  const handleChange = () => {
    setIsCheck(prev => {
      handleOperation({...item, day: name, fromHour: time, untilHour: timeUntil, isCheck: !prev })

      return !prev
    });
    
  }
  
  const handleChangeUntil = (val) => {
    if (isCheck) {
      setTimeUntil(val);
      handleOperation({...item, day: name, fromHour: time, untilHour: val, isCheck })
    } else {
      setTimeUntil(prev => prev)
    }
  }

  const handleChangeFrom = (val) => {
    if (isCheck) {
      setTime(val);
      handleOperation({...item, day: name, fromHour: val, untilHour: timeUntil, isCheck })
    } else  {
      setTime(prev => prev)
    }
  }

  return (
    <Grid item lg={6} md={6} sm={12} xs={12}>
      <Box style={{ display: 'flex', alignItems: 'center', gap: '16px'}}>
        <Typography style={{ width: '100px'}}>{name}</Typography>
        <FormGroup>
        <FormControlLabel color='primary' control={<Switch onChange={handleChange} checked={isCheck} />} label="" />
        </FormGroup>
        <Box style={{ display: 'flex', alignItems: 'center', gap: '16px'}}>
          <Box style={{ display: 'flex', alignItems: 'center', gap: '8px'}}>
            <Typography>From: </Typography>
            <TimeInput
              mode='12h'
              value={time}
              onChange={(e) => handleChangeFrom(e)}
            />
            </Box>
            <Box style={{ display: 'flex', alignItems: 'center', gap: '8px'}}>
              <Typography>Until: </Typography>
              <TimeInput
                mode='12h'
                value={timeUntil}
                onChange={(e) => handleChangeUntil(e)}
              />
            </Box>
        </Box>
      </Box>
    </Grid>
  )
}

const Days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

const Settings = (props) => {
  const {notify} = props;

  const classes = useStyles();
  const history = useHistory();

  const { state } = useContext(AuthContext);

  const initialOperation = Days.map(item => {
    return {
      day: item,
      fromHour: new Date(),
      untilHour: new Date(),
    }
  });

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [isReservationActivated, setIsReservationActivated] = useState(true);
  const [firstAddress, setFirstAddress] = useState('');
  const [secondAddress, setSecondAddress] = useState('');
  const [city, setCity] = useState('');
  const [pstate, setState] = useState('');
  const [postalCode, setPostalCode] = useState('');
  const [phoneNumber, setPhoneNumber] = useState(null);
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState('');
  const [map, setMap] = useState(null)
  const [markers, setMarker] = useState({lat: 15.041729400333121, lng: 120.68314341171437});
  const [operation, setOperation] = useState(initialOperation);
  const [prevOperation, setPrevOperation] = useState(initialOperation);
  const [open, setOpen] = useState(false);

  const [prevImage, setPrevImage] = useState('');
  const [preview, setPreview] = useState(null)
  const [image, setImage] = useState('');
  const [accountNumber, setAccountNumber] = useState('')
  const [accountName, setAccountName] = useState('');
  const [prevVal, setPrev] = useState(null);

  const initialValues = {
    name,
    description,
    isReservationActivated,
    firstAddress,
    secondAddress,
    city,
    postalCode,
    phoneNumber,
    email,
    state: pstate
    // pinLocation: '',
  }

  const handleCancel = () => {
    history.push('/pharmacy/settings');
  }

  const handleSubmit =  async(values, formik) => {
    const { setSubmitting } = formik;

    let newValues = {
      ...values,
      isReservationActivated,
    }

    if (markers.lat) {
      newValues = {
        ...newValues,
        pinLocation: markers.lat ? `lat:${markers.lat},lng:${markers.lng}` : ''
      }
    }

    try {
      const response = await request({
        url: `${api.STORE_API}/${state.user.storeId}`,
        method: API_METHOD.PATCH,
        data: newValues,
      })

      await request({
        url: `${api.STORES_API}/account/${state.user.storeId}` ,
        method: API_METHOD.PATCH,
        data: {
          image: image,
          accountNumber: accountNumber,
          accountName: accountName
        },
        headers: {
          'Content-type': 'multipart/form-data'
        }
      })

      const createOpening = operation.filter(item => item.type === 'new');

      await Promise.all(createOpening.map(async(op) => {
        await request({
          url: api.OPENING_HOURS_API,
          method: API_METHOD.POST,
          data: {
            ...op,
            storeId: state.user.storeId
          }
        })
      }));

      const updateOpening = operation.filter(item => item.type === 'update');
      await Promise.all(updateOpening.map(async(op) => {
        await request({
          url: api.OPENING_HOURS_API + '/' + parseInt(op.id),
          method: API_METHOD.PATCH,
          data: {
            ...op,
            storeId: state.user.storeId
          }
        });
      }));

      const deleteOpening = operation.filter(item => item.type === 'delete');
      await Promise.all(deleteOpening.map(async(op) => {
        await request({
          url: api.OPENING_HOURS_API + '/' + parseInt(op.id),
          method: API_METHOD.DELETE,
        })
      }));
      
      const newOperation = operation.map(item => {
        delete item.type
        delete item.id

        return item
      })
      setOperation(newOperation);

      const newOp = newOperation.map(i => {
        return {
          [i.day]: i.isCheck ? `Open ${moment(i.fromHour).format('h:mm A')} - ${moment(i.untilHour).format('h:mm A')}` : 'Closed'
        }
      })

      const result = newOp.reduce((acc, current) => {
        const key = Object.keys(current)[0]; 
        acc[key] = current[key];
        return acc;
      }, {});


      const newVal = {
        ...newValues,
        reservation: newValues.isReservationActivated ? 'Activated': 'Deactivated',
        ...result
      }


      console.log('newVal', newVal)
      delete newVal.pinLocation
      await handleAuditLog(state, state.user.storeId, state.user.storeId, 'settings', 'updated', prevVal, newVal)

      handeGetData();
      notify('success', `${response.data.name} has been updated successfully!`);
    } catch(error) {
      notify('error', `Failed to update a store!`);
      console.log('ERROR', error)
    } finally {
      setSubmitting(false);
    }
  }

  const handeGetData = async() => {
    setIsLoading(true);
    try {
      const response = await request({
        url: `${api.STORE_API}/${state.user.storeId}`,
        method: API_METHOD.GET,
      })
      const { name, description, isReservationActivated, firstAddress, secondAddress, city, postalCode, phoneNumber, email, state: pstate, pinLocation,
        qrCode, accountName, accountNumber
       } = response.data;
      // const userId = _links.self.href.replace(`${api.USERS_API}/`, '');
      console.log('response.data', response.data)
      setName(name)
      setDescription(description)
      setIsReservationActivated(isReservationActivated)
      setFirstAddress(firstAddress)
      setSecondAddress(secondAddress)
      setCity(city)
      setPostalCode(postalCode)
      setPhoneNumber(phoneNumber)
      setEmail(email)
      setState(pstate)
      setAccountName(accountName)
      setAccountNumber(accountNumber)
      setImage(qrCode)

      
      const secondresponse = await request({
        url: `${api.OPENING_HOURS_API}/search/findByStoreStoreId`,
        method: API_METHOD.GET,
        params: {
          storeId: parseInt(state.user.storeId)
        }
      })
      

      // const newOpening = secondresponse.data._embedded.openingHours.map(value => {
      //     return operation.map(item => {
      //       if (item.day === value.day) {
      //         return {
      //           ...item,
      //           untilHour: value.untilHour,
      //           fromHour: value.fromHour,
      //           isCheck: true
      //         }
      //       }
      //       return item
      //     })
      // })

      const newOpening = operation.map(item => {
        const found = secondresponse.data._embedded.openingHours.find(val => val.day === item.day);
        if (found) {
          const openingId = found._links.self.href.replace(`${api.OPENING_HOURS_API}/`, '');
          delete item.type;
          
          return {
            ...item,
            untilHour: new Date(found.untilHour),
            fromHour: new Date(found.fromHour),
            isCheck: true,
            id: openingId
          }
        }

        return item;
      })
      
      setOperation(newOpening);
      setPrevOperation(newOpening);
      
      if (pinLocation) {
        const locations = pinLocation?.split(',');
        const lat = locations[0].replace('lat:', '');
        const lng = locations[1].replace('lng:', '');
        setMarker({ lat: parseFloat(lat), lng: parseFloat(lng)})
      }
      
      const newOp = newOpening.map(i => {
        return {
          [i.day]: i.isCheck ? `Open ${moment(i.fromHour).format('h:mm A')} - ${moment(i.untilHour).format('h:mm A')}` : 'Closed'
        }
      })

      const result = newOp.reduce((acc, current) => {
        const key = Object.keys(current)[0]; 
        acc[key] = current[key];
        return acc;
      }, {});

      setPrev({
        name, description, reservation: isReservationActivated ? 'Activated': 'Deactivated', 
        firstAddress, secondAddress, city, postalCode, phoneNumber, email, state: pstate,
        qrCode, accountName, accountNumber, ...result
      })
      setIsLoading(false);
    } catch (e) {
      setIsLoading(false);
    }
  }

  console.log('Operation', prevVal)

  const handleChange = (event) => {
    console.log('first', event.target.checked)
    setIsReservationActivated(event.target.checked ? 1 : 0)
  }

  useEffect(() => {
    handeGetData();
  }, [])

  const { isLoaded } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: 'AIzaSyArqkzzkg1IJoYt0qd69tIJs4N5LP1yXws',
    // googleMapsApiKey: '',
  })

  const onLoad = useCallback(function callback(map) {
    if (markers.lng) {
      // This is just an example of getting and using the map instance!!! don't just blindly copy!
      const bounds = new window.google.maps.LatLngBounds(markers)
      map.fitBounds(bounds)
  
      setMap(map)
    }
  }, [markers])

  const onUnmount = useCallback(function callback(map) {
    setMap(null)
  }, [])

  const containerStyle = {
    width: '100%',
    height: '400px',
  }
  
  const onMapClick = (e) => {
    setMarker({
      lat: e.latLng.lat(),
      lng: e.latLng.lng()
    });
  };

  const handleOperation = (value) => {
    setOperation(prev => {
      return prev.map(item => {
        if (item.day === value.day) {
          let type = value.id ? 'update' : 'new';
          type = value.id && !value.isCheck ? 'delete' : type;
          type = !value.id && !value.isCheck ? '' : type
          return {
            ...value,
            type: type
          }
        }
        return item
      })
    })
  }

  useEffect(() => {
    if (!image) {
        setPreview(undefined)
        return
    }

    if (image instanceof Blob) {
      const objectUrl = URL.createObjectURL(image);
      setPreview(objectUrl);
  
      return () => {
        URL.revokeObjectURL(objectUrl); 
      };
    } else {
      setPreview(image)
    }
  }, [image])

  const onSelectFile = e => {
    if (!e.target.files || e.target.files.length === 0) {
      setImage(undefined)
      return
    }

    setImage(e.target.files[0])
  }

  const handleClose = () => {
    setOpen(false);
  }

  const handleUpload = () => {

  }

  const handleOpen = () => {
    setOpen(true);
  }

  return (
    <Container className={classes.container}>
      <Modal
        open={open} 
        handleClose={handleClose} 
        handleSubmit={() => handleUpload()} 
        buttonName='Done'
        image={paymentIcon}
        title={`Store QR Code Settings`}
      >
        <Grid container>
        <Grid className={classes.photoContainer} item md={12} sm={12} xs={12}>
            {
              preview ?  
                <img style={{width: '100%', height: '400px'}} src={preview} /> 
              :
                <>
                 
                </>
            }
            <Button
              id="uploadButton"
              variant="contained"
              color="primary"
              size='medium'
              component="label"
              className={classes.uploadButton}
            >
              {preview ? 'Update QR Code' : 'Upload QR Code'}
              <input
                id="file"
                name="file"
                variant="outlined"
                // value={formik.values.file}
                style={{ display: 'none' }}
                onChange={onSelectFile}
                type="file" 
                // accept=".csv"
              />
            </Button>
          </Grid>  
        </Grid>
      </Modal>
      <Title name={'Store Settings'}/>
      <Paper className={classes.paper} style={{ height: '70vh', overflowY: 'scroll', background: '#fff !important'}}>
      {
      isLoading ?
        <SkeletonComponent />
        : 
        <>
          <FormGroup style={{ padding: '16px', width: '100%', textAlign: 'end', alignItems: 'flex-end'}}>
            <FormControlLabel color='primary' control={<Switch onChange={handleChange} checked={isReservationActivated} />} label="Reservation" />
          </FormGroup>
          <Formik
            initialValues={initialValues}
            validationSchema={settingsSchema}
            onSubmit={handleSubmit}
          >
          {
            formik => (
              <Form>
                <Grid container spacing={2}>
                  <Grid item lg={12} md={12} sm={12} xs={12}>
                    <Title name={`${name}`}/>
                    {/* <TextField
                      fullWidth
                      id="name"
                      label={'Name*'}
                      disabled
                      name="name"
                      value={formik.values.name}
                      onChange={formik.handleChange}
                      error={formik.touched.name && Boolean(formik.errors.name)}
                      helperText={formik.touched.name && formik.errors.name}
                    /> */}
                  </Grid>
                  <Grid item lg={6} md={6} sm={12} xs={12}>
                    <TextField
                      fullWidth
                      id="email"
                      label={'Email'}
                      name="email"
                      value={formik.values.email}
                      onChange={formik.handleChange}
                      error={formik.touched.email && Boolean(formik.errors.email)}
                      helperText={formik.touched.email && formik.errors.email}
                    />
                  </Grid>
                  <Grid item lg={6} md={6} sm={12} xs={12}>
                    <TextField
                      fullWidth
                      id="phoneNumber"
                      label={'Phone Number'}
                      name="phoneNumber"
                      type='number'
                      value={formik.values.phoneNumber}
                      onChange={isValidPhoneNumber(formik, 'phoneNumber')}
                    />
                  </Grid>
                </Grid>
                <Grid container spacing={2}>
                  <Grid item lg={12} md={12} sm={12} xs={12}>
                    <TextField
                      fullWidth
                      multiline
                      rows={6}
                      id="description"
                      label={'Description'}
                      name="description"
                      value={formik.values.description}
                      onChange={handleInputChange(formik, "description")}
                      error={formik.touched.description && Boolean(formik.errors.description)}
                      helperText={formik.touched.description && formik.errors.description}
                    />
                  </Grid>
                </Grid>
                <Grid container spacing={1}>
                  <Grid item lg={12} md={12} sm={12} xs={12}>
                    <Divider style={{marginTop: '16px', marginBottom: '16px', background: colors.PRIMARY, height: '2px'}}/>
                    <Typography><strong>Operating Hours</strong></Typography>
                  </Grid>
                  {
                    operation.map((item, i) => (
                      <OperatingItem key={i} name={item.day} item={item} handleOperation={handleOperation}/>
                    ))
                  }
                </Grid>
                <Grid container spacing={2}>
                  <Grid item lg={12} md={12} sm={12} xs={12}>
                  <Divider style={{marginTop: '16px', marginBottom: '16px', background: colors.PRIMARY, height: '2px'}}/>
                    <Typography><strong>Payment Method</strong></Typography>
                  </Grid>
                  <Grid item lg={6} md={6} sm={12} xs={12}>
                    <TextField
                      fullWidth
                      id="accountName"
                      label={'Account Name'}
                      name="accountName"
                      value={accountName}
                      onChange={e => setAccountName(e.target.value)}
                    />
                  </Grid>
                  <Grid item lg={6} md={6} sm={12} xs={12}>
                    <TextField
                      fullWidth
                      id="accountNumber"
                      label={'Account Number'}
                      name="accountNumber"
                      value={accountNumber}
                      onChange={(e) => setAccountNumber(e.target.value)}
                    />
                  </Grid>
                  <Grid className={classes.photoContainer} item md={4} sm={4} xs={12}>
                    <Button
                      id="uploadButton"
                      variant="contained"
                      color="primary"
                      size='medium'
                      onClick={handleOpen}
                      component="label"
                      className={classes.uploadButton}
                    >
                      {'View QR Code'}
                    </Button>
                  </Grid>  
                </Grid>
                <Grid container spacing={2}>
                  <Grid item lg={12} md={12} sm={12} xs={12}>
                    <Divider style={{marginTop: '16px', marginBottom: '16px', background: colors.PRIMARY, height: '2px'}}/>
                    <Typography><strong>Store Address</strong></Typography>
                  </Grid>
                  <Grid item lg={2} md={2} sm={12} xs={12}>
                    <TextField
                      fullWidth
                      id="firstAddress"
                      label={'Street'}
                      name="firstAddress"
                      value={formik.values.firstAddress}
                      onChange={handleInputChange(formik, "firstAddress")}
                      error={formik.touched.firstAddress && Boolean(formik.errors.firstAddress)}
                      helperText={formik.touched.firstAddress && formik.errors.firstAddress}
                    />
                  </Grid>
                  <Grid item lg={2} md={2} sm={12} xs={12}>
                    <TextField
                      fullWidth
                      id="secondAddress"
                      label={'Barangay'}
                      name="secondAddress"
                      value={formik.values.secondAddress}
                      onChange={handleInputChange(formik, "secondAddress")}
                      error={formik.touched.secondAddress && Boolean(formik.errors.secondAddress)}
                      helperText={formik.touched.secondAddress && formik.errors.secondAddress}
                    />
                  </Grid>
                  <Grid item lg={3} md={3} sm={12} xs={12}>
                    <TextField
                      fullWidth
                      id="city"
                      label={'City/Municipality*'}
                      name="city"
                      value={formik.values.city}
                      onChange={handleInputChange(formik, "city")}
                      error={formik.touched.city && Boolean(formik.errors.city)}
                      helperText={formik.touched.city && formik.errors.city}
                    />
                  </Grid>
                  <Grid item lg={3} md={3} sm={12} xs={12}>
                    <TextField
                      fullWidth
                      id="state"
                      label={'Province*'}
                      name="state"
                      value={formik.values.state}
                      onChange={handleInputChange(formik, "state")}
                      error={formik.touched.state && Boolean(formik.errors.state)}
                      helperText={formik.touched.state && formik.errors.state}
                    />
                  </Grid>
                  <Grid item lg={2} md={2} sm={12} xs={12}>
                    <TextField
                      fullWidth
                      id="postalCode"
                      label={'Postal Code*'}
                      name="postalCode"
                      value={formik.values.postalCode}
                      onChange={handleInputChange(formik, "postalCode")}
                      error={formik.touched.postalCode && Boolean(formik.errors.postalCode)}
                      helperText={formik.touched.postalCode && formik.errors.postalCode}
                    />
                  </Grid>
                </Grid>
                {/*  */}
                {
                  isLoaded && markers.lng ?
                  <Container>
                    {
                      console.log('first', { 
                        lat: parseFloat(markers.lat),
                        lng: parseFloat(markers.lng) 
                      })
                    }
                    <GoogleMap
                      mapContainerStyle={containerStyle}
                      center={{ 
                        lat: parseFloat(markers.lat),
                        lng: parseFloat(markers.lng) 
                      }}
                      zoom={10}
                      onLoad={onLoad}
                      onUnmount={onUnmount}
                      onClick={onMapClick}
                      >
                      {markers.lng ?
                        <Marker
                          position={{ 
                            lat: parseFloat(markers.lat),
                            lng: parseFloat(markers.lng) 
                          }} />
                          : 
                          <></>
                    }
                    </GoogleMap>
                  </Container>
                  :
                  <></>
                }
                <Box textAlign='center' className={classes.buttonContainer}>
                  <Button
                    id="submitButton"
                    onClick={handleCancel} 
                    variant="outlined"
                    color="primary"
                    size='medium'
                    className={classes.button}
                  >
                    Cancel
                  </Button>
                  <Button
                    id="cancelButton"
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
                        'Update'
                    }
                  </Button>
                </Box>
              </Form>
            )
          }

          </Formik>
        </>
    }
    </Paper>
  </Container>
  )
}

export default Settings