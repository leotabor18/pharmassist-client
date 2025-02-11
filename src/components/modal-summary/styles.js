import { makeStyles } from "@material-ui/core/styles";
import colors from "../../themes/colors";

export default makeStyles((theme) => ({
  paper: {
    paddingTop: theme.spacing(2),
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    '& img': {
      width: '90px'
    },
    '& .MuiBox-root': {
      display: 'flex',
      justifyContent: 'flex-end'
    },
    width: '800px'
  },
  content: {
    display: 'flex',
    gap: theme.spacing(2),
    padding: theme.spacing(3),
    flexDirection: 'column',
    width: '100%'
  },
  delete: {
    fontSize: '32px',
    color: colors.ERROR
  },
  deleteContent: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  },
  buttonContainer: {
    padding: theme.spacing(2.5),
    display: 'flex',
    width: '100%',
    // justifyContent: 'center !important',
    backgroundColor: '#ebebeb78',
    gap: theme.spacing(2),
    '& .MuiButton-containedPrimary': {
      color: colors.WHITE,
      backgroundColor: colors.PRIMARY + ' !important'
    },
    '& .MuiButton-outlinedPrimary': {
      color: colors.PRIMARY + ' !important',
      border: '1px solid '+ colors.PRIMARY + ' !important',
    }
  },
  button: {
    width: theme.spacing(19),
  },
  title: {
    color: colors.PRIMARY,
    fontWeight: '500',
    margin: '16px 24px'
  },
  summaryContainer: {
    display: 'flex',
    width: '100%',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'flex-start',
    padding: '16px',
    '& .MuiBox-root': {
      width: '100%',
      display: 'flex',
      justifyContent: 'space-between'
    }
  },
  textField: {
    width: '100%',
  },
  buttons: { 
    display: 'flex',
    gap: 4,
    padding: '8px',
    flexWrap: 'wrap',
    height: '80%',
    marginTop: '4px'}
}))


