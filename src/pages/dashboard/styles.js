import { makeStyles } from "@material-ui/core/styles";
import { PAGES_STYLE } from "../../themes/common";
import colors from "../../themes/colors";
export default makeStyles((theme) => ({
  ...PAGES_STYLE,
  filter: {
    '& .MuiButtonBase-root': {
      backgroundColor: 'gray',
      width: '150px'
    }
  },
  inventoryChart: {
    padding: '16px',
    marginTop: '16px',
    boxShadow: '0px 2px 4px -1px rgba(0, 0, 0, 0.2), 0px 4px 5px 0px rgba(0, 0, 0, 0.14), 0px 1px 10px 0px rgba(0, 0, 0, 0.12)'
  }
}))


