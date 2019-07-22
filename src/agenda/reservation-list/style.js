import { StyleSheet } from 'react-native';
import * as defaultStyle from '../../style';

const STYLESHEET_ID = 'stylesheet.agenda.list';

export default function styleConstructor(theme = {}) {
  const appStyle = { ...defaultStyle, ...theme };
  return StyleSheet.create({
    container: {
      flexDirection: 'row',
    },
    dayNum: {
      fontSize: 20,
      color: appStyle.textColor,
      fontFamily: 'Lato-Regular',
    },
    dayText: {
      fontSize: 15,
      color: appStyle.textColor,
      backgroundColor: 'rgba(0,0,0,0)',
      fontFamily: 'Lato-Regular',
    },
    day: {
      width: 63,
      alignItems: 'center',
      justifyContent: 'flex-start',
      marginTop: 24,
    },
    today: {
      color:appStyle.selectedDayBackgroundColor,
    },
    ...(theme[STYLESHEET_ID] || {}),
  });
}
