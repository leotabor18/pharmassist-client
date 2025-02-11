import { makeStyles } from "@material-ui/core/styles";
import colors from "../../themes/colors";

export default makeStyles((theme) => ({
  drawer: {
    '& .MuiDrawer-paper': {
      marginTop: theme.spacing(11.25),
      background: colors.PRIMARY
    },
    '& .MuiList-root': {
      width: theme.spacing(37.5),
      '& .MuiDivider-root': {
        display: 'none'
      }
    },
    '& .MuiListItem-root:hover': {
      background: colors.SECONDARY+ " !important"
    },
    '& .MuiListItemText-root span': {
      fontSize: '20px',
      color: colors.WHITE
    },
    '& .MuiListItemIcon-root svg': {
      fontSize: '25px',
      color: colors.WHITE
    },
    '& .Mui-selected': {
      backgroundColor: colors.SECONDARY + " !important",
    },
    '& .Mui-selected .MuiListItemText-root span': {
      color : colors.WHITE
    },
    '& .Mui-selected .MuiListItemIcon-root svg': {
      color : colors.WHITE
    },
    '& .MuiListItem-root': {
      paddingTop: '16px',
      paddingBottom: '16px',
    }
  },
  mDrawer: {
    display: 'none'
  },
  main: {
    marginLeft: '300px',
    position: 'relative',
    height: '88vh',
  },
  contentBackground: {
    height: '100%',
    width: '100%'
  },
  mMain: {
    marginLeft: '0px',
  },
  content: {
    position: 'absolute',
    width: '100%',
    overflowY: 'scroll',
    top: 0
  },
  mContentBackground: {
    display: 'none'
  },
  profileMain: {
    width: '100%',
    position: 'fixed',
    height: '100%',
    overflowY:'scroll',
    marginBottom: '24px'
  },
  border: {
    height: '2px',
    background: colors.WHITE
  },
  pos: {
    '& .MuiList-root' :{
      width: '60px !important'
    }
  },
  posMain: {
    marginLeft : '60px !important'
  },
  posMainR: {
    marginLeft : '0px !important'
  }
}))


